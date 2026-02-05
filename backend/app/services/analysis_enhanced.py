"""Service d'analyse contractuelle amélioré avec recherche juridique FR.

Ce service intègre:
- Recherche de sources juridiques officielles
- Calcul de score de confiance
- Prompts optimisés avec disclaimer
- Anti-hallucinations
"""

import json
import logging
from typing import Any, cast

from anthropic import AsyncAnthropic
from anthropic.types import MessageParam

from app.config import settings
from app.core.legal_search import (
    LegalSearchResults,
    LegalSource,
    detect_clause_type,
    is_official_source,
    search_legal_sources,
)
from app.core.confidence import calculate_confidence, calculate_clause_confidence
from app.prompts.legal_analysis import (
    format_prompt_with_context,
    get_disclaimer,
    LEGAL_ANALYSIS_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)

# Client Anthropic
anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def analyze_contract_enhanced(
    contract_text: str,
    contract_id: str | None = None,
    use_web_search: bool = True,
) -> dict[str, Any]:
    """Analyse un contrat avec recherche juridique et score de confiance.

    Args:
        contract_text: Texte du contrat à analyser
        contract_id: ID du contrat (optionnel)
        use_web_search: Activer la recherche web de sources

    Returns:
        Analyse complète avec score de confiance et sources
    """
    logger.info(f"Début analyse contrat {'#' + contract_id if contract_id else 'nouveau'}")

    # ==========================================================================
    # ÉTAPE 1: Recherche de sources juridiques
    # ==========================================================================
    search_results: LegalSearchResults = {
        "sources": [],
        "confidence_score": 0.0,
        "official_count": 0,
        "search_queries": [],
    }

    if use_web_search:
        try:
            # Détecte les types de clauses
            detected_types = detect_clause_type(contract_text)
            logger.info(f"Types de clauses détectés: {detected_types}")

            # Recherche les sources pour le type principal
            if detected_types:
                search_results = await search_legal_sources(
                    clause_type=detected_types[0], keywords=detected_types, max_results=10
                )
                logger.info(f"Sources trouvées: {len(search_results['sources'])}")
        except Exception as e:
            logger.error(f"Erreur recherche sources: {e}")
            # Continue sans sources si erreur

    # ==========================================================================
    # ÉTAPE 2: Préparation du prompt
    # ==========================================================================
    prompt = format_prompt_with_context(
        contract_text=contract_text,
        search_results=[dict(source) for source in search_results["sources"]],
    )

    # ==========================================================================
    # ÉTAPE 3: Appel au LLM avec tool web_search de Claude
    # ==========================================================================
    try:
        messages: list[MessageParam] = [
            {
                "role": "user",
                "content": prompt,
            }
        ]
        tools_payload = [{"type": "web_search", "name": "web_search_tool"}]

        response = await anthropic_client.messages.create(
            model=settings.ANTHROPIC_MODEL or "claude-sonnet-4-5-20250929",
            max_tokens=4096,
            system=LEGAL_ANALYSIS_SYSTEM_PROMPT,
            messages=messages,
            temperature=0.1,  # Faible pour plus de déterminisme
            extra_body={"tools": tools_payload},
        )

        # Extrait le contenu JSON de la réponse
        content = response.content[0].text if response.content else ""

        # Tente de parser le JSON
        analysis_data: dict[str, Any]
        try:
            analysis_data = cast(dict[str, Any], json.loads(content))
        except json.JSONDecodeError:
            # Si pas de JSON valide, tente d'extraire entre ```json et ```
            import re

            json_match = re.search(r"```json\n(.*?)\n```", content, re.DOTALL)
            if json_match:
                analysis_data = cast(dict[str, Any], json.loads(json_match.group(1)))
            else:
                # Fallback: retourne le texte brut
                logger.warning("Réponse LLM non-JSON, retour format brut")
                analysis_data = {
                    "disclaimer": get_disclaimer(),
                    "score_confiance_global": 0,
                    "niveau_confiance": "insuffisant",
                    "erreur_parsing": True,
                    "contenu_brut": content[:2000],
                }

        # ==========================================================================
        # ÉTAPE 4: Calcul du score de confiance
        # ==========================================================================
        sources: list[LegalSource] = search_results["sources"]
        sources_count = len(sources)
        official_count = search_results["official_count"]
        if sources_count and official_count == 0:
            official_count = sum(
                is_official_source(str(source.get("url", ""))) for source in sources
            )
        official_ratio = (official_count / sources_count) if sources_count else 0.0
        analyses_data = analysis_data.get("analyses")
        has_citations = bool(
            analysis_data.get("articles_applicables")
            or analysis_data.get("citations")
            or (
                isinstance(analyses_data, list)
                and any(
                    isinstance(clause, dict) and clause.get("articles_applicables")
                    for clause in analyses_data
                )
            )
        )
        consistency_score = float(search_results["confidence_score"])

        confidence_result = calculate_confidence(
            has_citations=has_citations,
            sources_count=sources_count,
            official_sources_ratio=official_ratio,
            consistency_score=consistency_score,
            search_results=[dict(source) for source in sources],
        )

        # Met à jour le score dans les données d'analyse
        analysis_data["score_confiance_global"] = confidence_result["score"]
        analysis_data["niveau_confiance"] = confidence_result["level"]
        analysis_data["recommandation_verification"] = confidence_result["score"] < 70

        # Ajoute les détails du scoring
        analysis_data["_scoring_details"] = {
            "factors": confidence_result["factors"],
            "recommendation": confidence_result.get("recommendation"),
        }

        # Calcule le score pour chaque clause
        if isinstance(analyses_data, list):
            for clause_analysis in analyses_data:
                if not isinstance(clause_analysis, dict):
                    continue
                clause_text = (
                    clause_analysis.get("analyse_juridique")
                    or clause_analysis.get("analyse")
                    or ""
                )
                clause_confidence = calculate_clause_confidence(
                    citation_found=bool(clause_analysis.get("articles_applicables")),
                    source_official=official_ratio > 0,
                    text_length=len(clause_text),
                )
                clause_analysis["score_confiance_clause"] = clause_confidence["score"]
                clause_analysis["niveau_confiance_clause"] = clause_confidence["level"]

        # ==========================================================================
        # ÉTAPE 5: Ajout des sources et vérification langue
        # ==========================================================================
        # Ajoute les sources utilisées
        analysis_data["_sources_used"] = search_results["sources"]
        analysis_data["_search_queries"] = search_results["search_queries"]

        # Vérifie que tout est en français (anti-anglais)
        analysis_data = _verify_french_content(analysis_data)

        # S'assure que le disclaimer est présent
        if not analysis_data.get("disclaimer"):
            analysis_data["disclaimer"] = get_disclaimer()

        logger.info(
            f"Analyse terminée - Score confiance: {confidence_result['score']}"
        )

        return analysis_data

    except Exception as e:
        logger.error(f"Erreur analyse LLM: {e}")
        # Retourne une réponse d'erreur structurée
        return {
            "disclaimer": get_disclaimer(),
            "score_confiance_global": 0,
            "niveau_confiance": "insuffisant",
            "recommandation_verification": True,
            "erreur": str(e),
            "message": "Une erreur est survenue lors de l'analyse. Veuillez réessayer.",
        }


def _verify_french_content(data: dict[str, Any]) -> dict[str, Any]:
    """Vérifie que le contenu est bien en français.

    Args:
        data: Données d'analyse

    Returns:
        Données avec vérification langue
    """
    # Simple vérification: cherche des mots anglais communs
    english_words = ["the", "and", "of", "to", "in", "is", "you", "that", "it", "he"]

    def check_text_french(text: str) -> bool:
        """Vérifie si le texte semble être en français."""
        if not text:
            return True

        text_lower = text.lower()
        words = text_lower.split()

        if not words:
            return True

        # Compte les mots anglais
        english_count = sum(1 for word in words if word in english_words)
        ratio = english_count / len(words)

        # Si plus de 20% de mots anglais, suspect
        return ratio < 0.2

    # Vérifie les champs principaux
    fields_to_check = ["conclusion", "sommaire"]

    for field in fields_to_check:
        if field in data and isinstance(data[field], str):
            if not check_text_french(data[field]):
                logger.warning(f"Contenu suspect non-français détecté dans {field}")
                data["_language_warning"] = (
                    "Certains éléments de l'analyse pourraient être en anglais."
                )
                break

    # Vérifie les analyses
    analyses = data.get("analyses")
    if isinstance(analyses, list):
        for analysis in analyses:
            if not isinstance(analysis, dict):
                continue
            for key in ["analyse_juridique", "risque_identifie"]:
                if key in analysis and isinstance(analysis[key], str):
                    if not check_text_french(analysis[key]):
                        analysis["_langue"] = "⚠️ Cette section pourrait être en anglais"

    return data


async def verify_analysis_quality(analysis_data: dict[str, Any]) -> dict[str, Any]:
    """Vérifie la qualité et la cohérence de l'analyse.

    Args:
        analysis_data: Données d'analyse à vérifier

    Returns:
        Rapport de vérification
    """
    issues: list[dict[str, Any]] = []
    score = 100

    # Vérifie la présence du disclaimer
    if not analysis_data.get("disclaimer"):
        issues.append(
            {
                "type": "disclaimer_missing",
                "severity": "critique",
                "message": "Disclaimer légal manquant",
            }
        )
        score -= 30

    # Vérifie les citations d'articles
    analyses = analysis_data.get("analyses", [])
    if not isinstance(analyses, list):
        analyses = []
    for analysis in analyses:
        if not isinstance(analysis, dict):
            continue
        articles = analysis.get("articles_applicables", [])
        if not articles:
            issues.append(
                {
                    "type": "no_citations",
                    "severity": "majeure",
                    "clause": analysis.get("clause_detectee", "inconnue"),
                    "message": "Aucun article de loi cité",
                }
            )
            score -= 10
        else:
            # Vérifie que les URLs sont présentes
            for article in articles:
                if not article.get("url_source"):
                    issues.append(
                        {
                            "type": "missing_url",
                            "severity": "mineure",
                            "article": article.get("article", "inconnu"),
                            "message": "URL source manquante",
                        }
                    )
                    score -= 5

    # Vérifie le score de confiance
    if analysis_data.get("score_confiance_global", 0) < 50:
        issues.append(
            {
                "type": "low_confidence",
                "severity": "majeure",
                "score": analysis_data.get("score_confiance_global"),
                "message": "Score de confiance faible, vérification avocat recommandée",
            }
        )

    # Vérifie la langue
    if "_language_warning" in analysis_data:
        issues.append(
            {
                "type": "language",
                "severity": "majeure",
                "message": "Contenu potentiellement non-français",
            }
        )
        score -= 15

    return {
        "verification_complete": len(issues) == 0,
        "score": max(0, score),
        "issues": issues,
        "total_issues": len(issues),
        "critical_issues": len([i for i in issues if i.get("severity") == "critique"]),
    }


# Fonction pour compatibilité avec ancien code
def analyze_contract_sync(contract_text: str) -> dict[str, Any]:
    """Version synchrone de l'analyse (pour tests)."""
    import asyncio

    return asyncio.run(analyze_contract_enhanced(contract_text, use_web_search=False))
