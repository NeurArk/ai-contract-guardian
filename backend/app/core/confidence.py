"""Module de calcul de score de confiance.

Ce module fournit des fonctions pour calculer les scores
de confiance des analyses contractuelles.
"""

from typing import Any


def calculate_confidence(
    has_citations: bool = False,
    sources_count: int = 0,
    official_sources_ratio: float = 0.0,
    consistency_score: float = 0.0,
    search_results: list[dict] | None = None,
) -> dict[str, Any]:
    """Calcule le score de confiance global d'une analyse.

    Args:
        has_citations: Indique si l'analyse contient des citations
        sources_count: Nombre de sources utilisées
        official_sources_ratio: Ratio de sources officielles (0-1)
        consistency_score: Score de cohérence interne (0-1)

    Returns:
        Dictionnaire avec le score et les détails
    """
    # Poids des différents facteurs
    weights = {
        "citations": 0.3,
        "sources": 0.25,
        "official": 0.25,
        "consistency": 0.2,
    }

    # Score pour les citations (binaire)
    citation_score = 1.0 if has_citations else 0.0

    # Score pour le nombre de sources (diminue après 5 sources)
    sources_score = min(sources_count / 5, 1.0)

    # Calcul du score pondéré
    total_score = (
        citation_score * weights["citations"]
        + sources_score * weights["sources"]
        + official_sources_ratio * weights["official"]
        + consistency_score * weights["consistency"]
    )

    # Conversion en pourcentage
    percentage = round(total_score * 100)

    # Détermination du niveau
    if percentage >= 80:
        level = "élevé"
    elif percentage >= 50:
        level = "moyen"
    else:
        level = "faible"

    return {
        "score": percentage,
        "level": level,
        "factors": {
            "citations": round(citation_score * weights["citations"] * 100),
            "sources_count": round(sources_score * weights["sources"] * 100),
            "official_sources": round(official_sources_ratio * weights["official"] * 100),
            "consistency": round(consistency_score * weights["consistency"] * 100),
        },
    }


def calculate_clause_confidence(
    citation_found: bool,
    source_official: bool,
    text_length: int,
) -> dict[str, Any]:
    """Calcule le score de confiance pour une clause spécifique.

    Args:
        citation_found: Si une citation juridique a été trouvée
        source_official: Si la source est officielle
        text_length: Longueur du texte d'analyse

    Returns:
        Score et explication
    """
    score = 0.0
    reasons = []

    if citation_found:
        score += 0.4
        reasons.append("Citation juridique présente")
    else:
        reasons.append("Citation juridique manquante")

    if source_official:
        score += 0.3
        reasons.append("Source officielle")
    else:
        reasons.append("Source non officielle")

    # Score basé sur la longueur du texte
    if text_length > 200:
        score += 0.3
        reasons.append("Analyse détaillée")
    elif text_length > 100:
        score += 0.2
        reasons.append("Analyse moyenne")
    else:
        score += 0.1
        reasons.append("Analyse concise")

    percentage = round(score * 100)

    return {
        "score": percentage,
        "reasons": reasons,
    }
