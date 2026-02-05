"""Module de recherche juridique pour sources officielles FR.

Ce module fournit des fonctions pour rechercher et valider
des sources juridiques officielles françaises.
"""

from typing import Any

# Templates de recherche pour différents types de clauses
SEARCH_TEMPLATES: dict[str, list[str]] = {
    "clause_pénalité": ["site:legifrance.gouv.fr pénalité de retard"],
    "délai_résiliation": ["site:legifrance.gouv.fr résiliation contrat"],
    "garantie": ["site:legifrance.gouv.fr garantie vice caché"],
    "confidentialité": ["site:legifrance.gouv.fr clause confidentialité"],
    "cgv": ["site:legifrance.gouv.fr conditions générales de vente"],
    "force_majeure": ["site:legifrance.gouv.fr force majeure"],
    "responsabilité": ["site:legifrance.gouv.fr limitation responsabilité"],
    "propriété_intellectuelle": ["site:legifrance.gouv.fr propriété intellectuelle"],
    "conformité_rgpd": [
        "site:legifrance.gouv.fr rgpd",
        "site:legifrance.gouv.fr base légale traitement données",
    ],
    "droit_retractation": ["site:legifrance.gouv.fr droit de rétractation"],
    "non_concurrence": ["site:legifrance.gouv.fr clause de non-concurrence"],
}

# Sources officielles reconnues
OFFICIAL_SOURCES: dict[str, dict[str, Any]] = {
    "legifrance.gouv.fr": {
        "name": "Légifrance",
        "type": "legislation",
        "priority": 1,
    },
    "cnil.fr": {
        "name": "CNIL",
        "type": "autorité",
        "priority": 2,
    },
    "europa.eu": {
        "name": "EUR-Lex",
        "type": "legislation",
        "priority": 3,
    },
    "courdecassation.fr": {
        "name": "Cour de cassation",
        "type": "jurisprudence",
        "priority": 2,
    },
}


def detect_clause_type(text: str) -> list[str]:
    """Détecte les types de clauses présents dans un texte.

    Args:
        text: Texte du contrat à analyser

    Returns:
        Liste des types de clauses détectés
    """
    if not text:
        return ["general"]

    text_lower = text.lower()
    detected = []

    if any(word in text_lower for word in ["pénalité", "pénalités", "retard", "défaut de paiement"]):
        detected.append("clause_pénalité")

    if any(word in text_lower for word in ["résiliation", "résilier", "préavis", "congé", "délai de résiliation"]):
        detected.append("délai_résiliation")

    if any(word in text_lower for word in ["confidentiel", "confidentialité", "secret"]):
        detected.append("confidentialité")

    if any(word in text_lower for word in ["responsabilité", "dommages", "indemnisation"]):
        detected.append("responsabilité")

    if any(word in text_lower for word in ["propriété intellectuelle", "brevet", "marque", "copyright"]):
        detected.append("propriété_intellectuelle")

    if any(word in text_lower for word in ["rgpd", "données personnelles", "gdpr", "protection des données"]):
        detected.append("conformité_rgpd")

    if any(word in text_lower for word in ["garantie", "vice caché", "éviction"]):
        detected.append("garantie")

    if any(word in text_lower for word in ["cgv", "conditions générales", "conditions de vente"]):
        detected.append("cgv")

    if any(word in text_lower for word in ["force majeure", "cas de force majeure", "événement fortuit"]):
        detected.append("force_majeure")

    if any(word in text_lower for word in ["non-concurrence", "non concurrence"]):
        detected.append("non_concurrence")

    if any(word in text_lower for word in ["rétractation", "rétracte", "délai de rétractation", "14 jours"]):
        detected.append("droit_retractation")

    return detected if detected else ["general"]


def is_official_source(url: str) -> bool:
    """Vérifie si une URL est une source officielle.

    Args:
        url: URL à vérifier

    Returns:
        True si c'est une source officielle
    """
    return any(source in url.lower() for source in OFFICIAL_SOURCES.keys())


def get_source_type(url: str) -> str:
    """Retourne le type de source pour une URL.

    Args:
        url: URL à analyser

    Returns:
        Type de source (legislation, jurisprudence, etc.)
    """
    for domain, info in OFFICIAL_SOURCES.items():
        if domain in url.lower():
            return info.get("type", "inconnu")
    return "doctrine"


def calculate_relevance(
    url: str,
    title: str = "",
    snippet: str = "",
    query: str = "",
) -> float:
    """Calcule le score de pertinence d'une source.

    Args:
        url: URL de la source
        title: Titre de la source
        snippet: Extrait de la source
        query: Requête de recherche

    Returns:
        Score de pertinence entre 0 et 100
    """
    score = 50.0  # Score de base

    # Bonus pour source officielle
    if is_official_source(url):
        score += 20

    # Bonus pour type de source
    source_type = get_source_type(url)
    if source_type == "legislation":
        score += 15
    elif source_type == "jurisprudence":
        score += 10

    # Vérification des mots-clés dans le titre
    if title and query:
        query_words = query.lower().split()
        title_lower = title.lower()
        matching_words = sum(1 for word in query_words if word in title_lower)
        if query_words:
            score += (matching_words / len(query_words)) * 10

    # Bonus pour date récente
    year = estimate_date_from_url(url)
    if year and year >= 2020:
        score += 5

    return min(score, 100.0)


def estimate_date_from_url(url: str) -> int | None:
    """Estime la date d'une source à partir de son URL.

    Args:
        url: URL à analyser

    Returns:
        Année estimée ou None
    """
    import re

    # Recherche de patterns comme /2023/ ou ID LEGIARTI000042645437
    patterns = [
        r"/(\d{4})/",  # /2023/
        r"/(\d{4})-\d{2}/",  # /2023-01/
        r"/(\d{4})\d{2}/",  # /202301/
        r"LEGIARTI(\d{4})\d+",  # LEGIARTI2020xxxxxx
        r"JURITEXT(\d{4})\d+",  # JURITEXT2020xxxxxx
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            year_str = match.group(1)
            if len(year_str) == 4 and year_str.isdigit():
                year = int(year_str)
                if 1990 <= year <= 2030:
                    return year

    return None


async def search_legal_sources(
    query: str = "",
    max_results: int = 5,
    clause_type: str | None = None,
    keywords: list[str] | None = None,
) -> dict[str, Any]:
    """Recherche des sources juridiques pour une requête.

    Args:
        query: Requête de recherche (optionnel)
        max_results: Nombre maximum de résultats
        clause_type: Type de clause optionnel
        keywords: Mots-clés additionnels

    Returns:
        Dictionnaire avec sources et métadonnées
    """
    search_queries = []

    # Construit les requêtes de recherche
    if clause_type and clause_type in SEARCH_TEMPLATES:
        search_queries.extend(SEARCH_TEMPLATES[clause_type])
    elif query:
        search_queries.append(f"site:legifrance.gouv.fr {query}")
    else:
        search_queries.append("site:legifrance.gouv.fr")

    if keywords:
        keywords_query = " ".join(keywords)
        search_queries.append(f"site:legifrance.gouv.fr {keywords_query}")

    # Cette fonction devrait intégrer une vraie recherche web
    # Pour l'instant, on retourne des résultats simulés
    sources = [
        {
            "title": f"Résultat simulé pour: {search_queries[0] if search_queries else query}",
            "url": "https://www.legifrance.gouv.fr",
            "snippet": "Extrait de texte juridique pertinent...",
            "score": 0.85,
        }
    ]

    official_count = sum(1 for s in sources if is_official_source(s.get("url", "")))

    return {
        "sources": sources[:max_results],
        "confidence_score": 0.75,
        "official_count": official_count,
        "search_queries": search_queries,
    }
