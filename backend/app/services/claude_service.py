"""Claude analysis service.

Ce module fournit des fonctions pour analyser des contrats avec l'API Anthropic Claude.
"""

import json
import os
from typing import Any

import httpx

from app.config import settings

ANALYSIS_PROMPT = """Tu es un expert juridique spécialisé dans l'analyse de contrats pour les TPE/PME.
Analyse le contrat suivant et fournis une évaluation structurée.

CONTRAT À ANALYSER:
```
{contract_text}
```

Fournis ta réponse au format JSON strict avec la structure suivante:
{{
    "summary": "Résumé concis du contrat (2-3 phrases)",
    "risks": [
        {{
            "severity": "high|medium|low",
            "description": "Description du risque identifié",
            "clause": "Référence ou extrait de la clause concernée"
        }}
    ],
    "recommendations": [
        "Recommandation actionnable 1",
        "Recommandation actionnable 2"
    ],
    "key_clauses": [
        {{
            "name": "Nom de la clause",
            "content": "Résumé du contenu",
            "importance": "critical|important|standard"
        }}
    ],
    "unfair_terms": [
        {{
            "clause": "Description de la clause",
            "reason": "Pourquoi elle est potentiellement abusive"
        }}
    ],
    "score_equity": 0-100,
    "score_clarity": 0-100,
    "missing_clauses": ["Clause manquante importante"]
}}

IMPORTANT:
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Les scores doivent être des entiers entre 0 et 100
- score_equity: évalue l'équilibre des obligations entre les parties
- score_clarity: évalue la clarté et la compréhensibilité du contrat
- Identifie au moins 3 risques si possibles
- Propose au moins 2 recommandations concrètes"""


async def analyze_contract_with_claude(contract_text: str) -> dict[str, Any]:
    """Analyse un contrat avec l'API Anthropic Claude.

    Args:
        contract_text: Texte du contrat à analyser

    Returns:
        Les résultats de l'analyse sous forme de dictionnaire

    Raises:
        ValueError: Si l'analyse échoue ou si la clé API n'est pas configurée
    """
    # Cost guard: disable real external LLM calls by default.
    # Enable explicitly with `LLM_REAL_CALLS_ENABLED=true`.
    if not settings.LLM_REAL_CALLS_ENABLED:
        raise ValueError("Clé API Anthropic non configurée")

    api_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise ValueError("Clé API Anthropic non configurée")

    # Limite la taille du texte ( Claude a des limites de contexte)
    max_chars = 100000
    if len(contract_text) > max_chars:
        contract_text = contract_text[:max_chars] + "\n\n[... Contrat tronqué pour l'analyse ...]"

    prompt = ANALYSIS_PROMPT.format(contract_text=contract_text)

    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
    }

    payload = {
        "model": settings.ANTHROPIC_MODEL,
        "max_tokens": 4000,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()

            data = response.json()
            content = data["content"][0]["text"]

            # Extrait le JSON de la réponse
            # Cherche un bloc JSON entre accolades
            start_idx = content.find("{")
            end_idx = content.rfind("}")

            if start_idx == -1 or end_idx == -1:
                raise ValueError("Format de réponse invalide: JSON non trouvé")

            json_str = content[start_idx : end_idx + 1]
            result = json.loads(json_str)

            # Normalise les résultats
            return {
                "summary": result.get("summary", ""),
                "risks": result.get("risks", []),
                "recommendations": result.get("recommendations", []),
                "key_clauses": result.get("key_clauses", []),
                "unfair_terms": result.get("unfair_terms", []),
                "score_equity": result.get("score_equity", 50),
                "score_clarity": result.get("score_clarity", 50),
                "missing_clauses": result.get("missing_clauses", []),
            }

        except httpx.HTTPStatusError as e:
            raise ValueError(f"Erreur API Anthropic: {e.response.status_code} - {e.response.text}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON: {e}")
        except Exception as e:
            raise ValueError(f"Erreur lors de l'analyse: {e}")
