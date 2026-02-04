"""Tests du module de recherche juridique.

Ce module teste les fonctions de recherche de sources
officielles françaises.
"""

import pytest
from app.core.legal_search import (
    detect_clause_type,
    is_official_source,
    get_source_type,
    calculate_relevance,
    estimate_date_from_url,
    SEARCH_TEMPLATES,
    OFFICIAL_SOURCES,
)


class TestDetectClauseType:
    """Tests de la détection de type de clause."""
    
    def test_detect_penalty_clause(self):
        """Test détection clause pénalité."""
        text = "En cas de retard de paiement, une pénalité de 10% sera appliquée."
        result = detect_clause_type(text)
        assert "clause_pénalité" in result
    
    def test_detect_resiliation_clause(self):
        """Test détection clause de résiliation."""
        text = "Le contrat peut être résilié avec un préavis de 3 mois."
        result = detect_clause_type(text)
        assert "délai_résiliation" in result
    
    def test_detect_garantie_clause(self):
        """Test détection clause de garantie."""
        text = "Le vendeur garantit le produit contre tout vice caché."
        result = detect_clause_type(text)
        assert "garantie" in result
    
    def test_detect_confidentiality_clause(self):
        """Test détection clause de confidentialité."""
        text = "Les parties s'engagent à garder confidentielles les informations."
        result = detect_clause_type(text)
        assert "confidentialité" in result
    
    def test_detect_multiple_clauses(self):
        """Test détection multiple clauses."""
        text = "Clause de non-concurrence et pénalité de retard."
        result = detect_clause_type(text)
        assert len(result) >= 2
    
    def test_empty_text(self):
        """Test avec texte vide."""
        result = detect_clause_type("")
        assert result == ["general"]


class TestOfficialSources:
    """Tests des sources officielles."""
    
    def test_is_official_source_legifrance(self):
        """Test reconnaissance Légifrance."""
        url = "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032042139"
        assert is_official_source(url) is True
    
    def test_is_official_source_cassation(self):
        """Test reconnaissance Cour de cassation."""
        url = "https://www.courdecassation.fr/..."
        assert is_official_source(url) is True
    
    def test_is_not_official_source(self):
        """Test rejet source non officielle."""
        url = "https://www.blog-droit.com/article"
        assert is_official_source(url) is False
    
    def test_all_official_sources_are_strings(self):
        """Test que toutes les sources sont des strings."""
        for source in OFFICIAL_SOURCES:
            assert isinstance(source, str)
            assert "." in source  # Doit contenir un point (domaine)


class TestSourceType:
    """Tests de détermination du type de source."""
    
    def test_legislation_type(self):
        """Test type législation."""
        url = "https://www.legifrance.gouv.fr/codes/"
        assert get_source_type(url) == "legislation"
    
    def test_jurisprudence_type(self):
        """Test type jurisprudence."""
        url = "https://www.courdecassation.fr/..."
        assert get_source_type(url) == "jurisprudence"
    
    def test_doctrine_type(self):
        """Test type doctrine."""
        url = "https://www.dalloz.fr/..."
        assert get_source_type(url) == "doctrine"


class TestCalculateRelevance:
    """Tests du calcul de pertinence."""
    
    def test_official_source_bonus(self):
        """Test bonus source officielle."""
        url = "https://www.legifrance.gouv.fr/..."
        score = calculate_relevance(url, "Titre", "Snippet", "query")
        assert score > 50  # Score de base
    
    def test_jurisprudence_bonus(self):
        """Test bonus jurisprudence."""
        url = "https://www.courdecassation.fr/jurisprudence/..."
        score = calculate_relevance(url, "Arrêt", "Snippet", "query")
        assert score >= 50
    
    def test_recent_date_bonus(self):
        """Test bonus date récente."""
        url = "https://www.legifrance.gouv.fr/2024/..."
        score = calculate_relevance(url, "Article 2024", "Snippet", "query")
        # Score élevé car récent
        assert score > 50


class TestSearchTemplates:
    """Tests des templates de recherche."""
    
    def test_all_templates_have_legifrance(self):
        """Test que tous les templates incluent Légifrance."""
        for clause_type, queries in SEARCH_TEMPLATES.items():
            for query in queries:
                assert "legifrance.gouv.fr" in query, \
                    f"Template {clause_type} sans Légifrance"
    
    def test_common_clause_types_have_templates(self):
        """Test que les types courants ont des templates."""
        common_types = [
            "clause_pénalité",
            "délai_résiliation",
            "garantie",
            "confidentialité",
            "responsabilité",
        ]
        for clause_type in common_types:
            assert clause_type in SEARCH_TEMPLATES, \
                f"Type {clause_type} sans template"
    
    def test_templates_are_lists(self):
        """Test que les templates sont des listes."""
        for clause_type, queries in SEARCH_TEMPLATES.items():
            assert isinstance(queries, list)
            assert len(queries) > 0
            for query in queries:
                assert isinstance(query, str)


class TestEstimateDate:
    """Tests de l'estimation de date."""
    
    def test_extract_year_from_url(self):
        """Test extraction année URL."""
        url = "https://www.legifrance.gouv.fr/2024/01/15/article"
        date = estimate_date_from_url(url)
        assert "2024" in str(date)
    
    def test_extract_year_from_legifrance_id(self):
        """Test extraction ID Légifrance."""
        url = "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032042139"
        # L'ID contient souvent une année
        date = estimate_date_from_url(url)
        # Pas de date claire dans cet ID
    
    def test_no_date_found(self):
        """Test quand pas de date trouvée."""
        url = "https://www.legifrance.gouv.fr/codes/"
        date = estimate_date_from_url(url)
        assert date is None


@pytest.mark.asyncio
class TestSearchLegalSources:
    """Tests de la recherche de sources (asynchrone)."""
    
    async def test_search_returns_structure(self):
        """Test que la recherche retourne la bonne structure."""
        from app.core.legal_search import search_legal_sources
        
        result = await search_legal_sources(
            clause_type="clause_pénalité",
            keywords=["pénalité", "retard"],
            max_results=5,
        )
        
        # Vérifie la structure
        assert "sources" in result
        assert "confidence_score" in result
        assert "official_count" in result
        assert "search_queries" in result
        assert isinstance(result["sources"], list)
    
    async def test_search_with_clause_type(self):
        """Test recherche avec type de clause."""
        from app.core.legal_search import search_legal_sources
        
        result = await search_legal_sources(
            clause_type="garantie",
            max_results=3,
        )
        
        # Doit retourner des requêtes spécifiques
        assert len(result["search_queries"]) > 0
        # Les requêtes doivent contenir le type
        assert any("garantie" in q for q in result["search_queries"])
    
    async def test_search_with_keywords(self):
        """Test recherche avec mots-clés."""
        from app.core.legal_search import search_legal_sources
        
        result = await search_legal_sources(
            keywords=["clause", "abusive", "consommation"],
            max_results=3,
        )
        
        # Doit utiliser les mots-clés dans les requêtes
        queries_str = " ".join(result["search_queries"])
        assert "clause" in queries_str or "abusive" in queries_str


class TestContractExamples:
    """Tests avec des exemples de contrats réels."""
    
    def test_cgv_ecommerce_detection(self):
        """Test détection clauses CGV e-commerce."""
        text = """
        CONDITIONS GÉNÉRALES DE VENTE
        
        Article 1 - Commandes
        Toute commande implique l'acceptation intégrale des présentes CGV.
        
        Article 2 - Prix
        Les prix sont indiqués en euros TTC. La TVA applicable est celle en vigueur.
        
        Article 3 - Droit de rétractation
        Conformément à l'article L. 221-18 du Code de la consommation, le client dispose 
        d'un délai de 14 jours pour exercer son droit de rétractation.
        
        Article 4 - Garanties
        Les produits bénéficient de la garantie légale de conformité et de la garantie 
        contre les vices cachés prévues aux articles 1641 et suivants du Code civil.
        
        Article 5 - Clause pénale
        En cas de retard de paiement, des pénalités de retard égales à 3 fois le taux 
        d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire de 40€.
        """
        
        clauses = detect_clause_type(text)
        
        # Doit détecter plusieurs types
        assert "cgv" in clauses
        assert "garantie" in clauses
        assert "clause_pénalité" in clauses
        assert "droit_retractation" in clauses
    
    def test_b2b_contract_detection(self):
        """Test détection contrat B2B."""
        text = """
        CONTRAT DE PRESTATION DE SERVICES
        
        ENTRE:
        La société ABC, SAS au capital de 50 000€
        
        ET:
        La société XYZ, SARL au capital de 10 000€
        
        Article 1 - Objet
        La société ABC confie à la société XYZ la réalisation des prestations décrites.
        
        Article 2 - Propriété intellectuelle
        Tous les droits de propriété intellectuelle sur les livrables sont cédés 
        à la société ABC à titre exclusif.
        
        Article 3 - Confidentialité
        Les parties s'engagent à traiter comme confidentielles toutes les informations.
        
        Article 4 - Responsabilité
        La responsabilité de XYZ est limitée au montant des honoraires perçus.
        
        Article 5 - Force majeure
        Aucune des parties ne pourra être tenue responsable d'un retard ou manquement
        dû à un cas de force majeure.
        """
        
        clauses = detect_clause_type(text)
        
        # Doit détecter les clauses B2B
        assert "propriété_intellectuelle" in clauses
        assert "confidentialité" in clauses
        assert "responsabilité" in clauses
        assert "force_majeure" in clauses