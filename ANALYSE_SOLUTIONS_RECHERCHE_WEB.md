# ANALYSE SOLUTIONS RECHERCHE WEB - AI Contract Guardian

**Date:** 4 Février 2026  
**Objectif:** Choisir la solution la plus fiable pour sources légales FR

---

## 🔍 SOLUTIONS ÉVALUÉES

### 1. **Anthropic Web Search Tool** (Claude)

**Description:** Tool natif intégré au SDK Anthropic

#### Avantages ✅
- **Intégration native** - Direct dans l'API Claude, pas d'appel externe
- **Citations automatiques** - Claude cite les sources dans sa réponse
- **Contexte conservé** - Résultats search intégrés au contexte LLM
- **Simple à implémenter** - Un paramètre `tools: [{"type": "web_search"}]`
- **Pas de gestion de clé API externe** - Une seule clé Anthropic

#### Inconvénients ❌
- **Coût élevé** - Prix LLM + surcharge web search (environ +30-50%)
- **Moins de contrôle** - Pas de filtrage de sources spécifiques
- **Dépendance totale** - Si Anthropic down = pas de search
- **Rate limiting** - Limites sur le nombre de searches
- **Sources non garanties** - Ne privilégie pas sites officiels (Légifrance)

#### Prix estimé (février 2026)
```
Input tokens: $3/1M + surcharge search ~$5/1M
Output tokens: $15/1M
Coût analyse contrat 10 pages: ~$0.08-0.12
```

---

### 2. **OpenAI Web Search** (GPT-5)

**Description:** Tool web_search dans Responses API

#### Avantages ✅
- **Agentic search** - GPT-5 peut faire plusieurs searches en chaîne
- **Deep research** - Mode investigation approfondie (minutes, centaines sources)
- **Citations détaillées** - URLs, titres, snippets complets
- **Multi-modal** - Peut analyser images des pages web
- **Reasoning** - O3/o4 peuvent raisonner sur les résultats

#### Inconvénients ❌
- **Très coûteux** - Deep research = $$$ (plusieurs minutes de compute)
- **Lent** - Agentic search = plusieurs secondes/minutes
- **Complexe** - Nécessite Responses API (pas Chat Completions simple)
- **Overkill** - Trop puissant pour besoins simples
- **Pas de priorité FR** - Sources anglophones privilégiées

#### Prix estimé
```
Standard search: $2/1M input
Agentic search: $5-15/1M + temps compute
Deep research: $$$ (5-10x plus cher)
Coût analyse contrat: $0.15-0.50
```

---

### 3. **Brave Search API** (Notre solution actuelle)

**Description:** API de recherche indépendante (brave.com)

#### Avantages ✅
- **Contrôle total** - Query personnalisée, filters (country, freshness)
- **Pas cher** - Free tier: 2000 requêtes/mois, puis $3/1000
- **Rapide** - < 1 seconde réponse
- **Privacy-focused** - Ne traque pas utilisateurs
- **Résultats bruts** - URLs, titles, snippets pour traitement custom
- **Fallback facile** - Peut switcher vers autre provider

#### Inconvénients ❌
- **Deux appels API** - Search puis LLM = latence + complexité
- **Contexte limité** - Snippets courts (pas page complète)
- **Pas d'intelligence** - Résultats bruts, pas d'analyse LLM
- **Nécessite traitement** - Doit parser et synthétiser soi-même
- **Free tier limité** - 2000 req/mois (suffisant pour MVP?)

#### Prix estimé
```
Free tier: 2000 req/mois
Pro: $3/1000 requêtes
Coût analyse contrat: ~$0.01-0.03 (search) + $0.05 (LLM) = $0.06-0.08
```

---

### 4. **Tavily** (API recherche pour LLM)

**Description:** API de recherche spécialement conçue pour LLMs

#### Avantages ✅
- **Conçu pour LLM** - Optimisé pour contexte LLM
- **Résultats enrichis** - Content extrait, pas juste snippet
- **Multi-sources** - Agrège plusieurs moteurs
- **Citations** - Format prêt pour LLM
- **Bon pour juridique** - Excellente pour recherche académique/juridique

#### Inconvénients ❌
- **Coût** - $0.025/requête (cher pour volume)
- **Moins connu** - Moins de documentation communauté
- **Dépendance** - Service externe supplémentaire

#### Prix estimé
```
Free: 1000 req/mois
Starter: $0.025/req ($25/1000)
Coût analyse contrat: ~$0.10-0.15
```

---

### 5. **Serper** (API Google Search)

**Description:** API Google Search (Scrape automatisé)

#### Avantages ✅
- **Google quality** - Meilleur indexation web
- **Résultats riches** - Featured snippets, knowledge graph
- **Local search** - Priorise géolocalisation
- **Juridique FR** - Bon pour .fr et sources FR

#### Inconvénients ❌
- **Scraping instable** - Google change = cassé
- **Rate limiting** - Strict sur volume
- **Coût** - $50/5000 requêtes ($0.01/req)
- **Pas officiel** - Risque juridique Google

#### Prix estimé
```
Free: 100 req/mois
Starter: $0.01/req ($50/5000)
Coût analyse contrat: ~$0.05-0.10
```

---

### 6. **Légifrance API Officielle** (PISTE)

**Description:** API officielle du gouvernement français

#### Avantages ✅
- **Officielle** - Données garanties à jour
- **Légale** - Sources juridiques fiables
- **Gratuite** - API publique
- **Ciblée** - Uniquement droit français

#### Inconvénients ❌
- **Complexe** - Documentation technique dense
- **Limitée** - Uniquement Légifrance (pas jurisprudence externe)
- **Pas de LLM** - Résultats structurés, pas de synthèse
- **Auth lourde** - Nécessite compte PISTE
- **Rate limiting** - Limites strictes

#### Prix
```
Gratuit (avec inscription)
Coût analyse: API gratuite + $0.05 (LLM) = $0.05
```

---

## 📊 COMPARATIF SYNTHÈSE

| Critère | Claude Tool | GPT-5 Search | Brave | Tavily | Serper | Légifrance |
|---------|-------------|--------------|-------|--------|--------|------------|
| **Fiabilité FR** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Coût/usage** | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Vitesse** | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Simplicité** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Contrôle** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Citations** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 RECOMMANDATION

### **HYBRIDE RECOMMANDÉ: Brave + Claude Tool (fallback)**

**Architecture proposée:**
```python
async def search_legal_sources(query: str) -> dict:
    """
    Stratégie hybride:
    1. Brave pour recherche ciblée sources FR
    2. Claude Web Search pour synthèse et citations
    3. Fallback si échec
    """
    
    # Étape 1: Recherche Brave (rapide, ciblée)
    brave_results = await brave_search({
        "query": f"{query} site:legifrance.gouv.fr OR site:dalloz.fr",
        "country": "FR",
        "freshness": "pm"
    })
    
    # Étape 2: Envoi à Claude avec contexte
    claude_response = await claude.messages.create(
        model="claude-sonnet-4-5-20250929",
        tools=[{"type": "web_search"}],  # Tool natif pour compléter
        messages=[{
            "role": "user",
            "content": f"Analyse juridique basée sur: {brave_results}\n\nQuery: {query}"
        }]
    )
    
    return {
        "sources": brave_results,
        "analysis": claude_response,
        "confidence": calculate_confidence(brave_results, claude_response)
    }
```

**Pourquoi cette approche:**

1. **Brave pour ciblage FR** - Filtre pays + site:legifrance = sources fiables
2. **Claude pour synthèse** - Tool natif = citations automatiques + cohérence
3. **Fallback intégré** - Si Brave échoue, Claude search prend le relais
4. **Coût optimisé** - Brave gratuit (2000/mois) + Claude payant uniquement si besoin
5. **Vitesse** - Brave < 1s + Claude ~2-3s = acceptable

### **Alternative simple: Claude Web Search Tool uniquement**

Si complexité à éviter:
```python
# Solution simple mais plus chère
response = claude.messages.create(
    model="claude-sonnet-4-5-20250929",
    tools=[{"type": "web_search"}],
    system="Tu dois uniquement utiliser des sources françaises (legifrance.gouv.fr, ...)",
    messages=[{"role": "user", "content": query}]
)
```

**Inconvénient:** Moins de contrôle sur sources, coût +30-50%

---

## 💰 COÛT ESTIMÉ PAR ANALYSE

| Solution | Coût/analyse | Fiabilité | Recommandation |
|----------|--------------|-----------|----------------|
| **Brave + Claude** | $0.06-0.08 | ⭐⭐⭐⭐⭐ | **✅ RECOMMANDÉ** |
| Claude Tool seul | $0.10-0.15 | ⭐⭐⭐⭐ | Alternative simple |
| GPT-5 Agentic | $0.20-0.50 | ⭐⭐⭐⭐⭐ | Trop cher pour MVP |
| Tavily + Claude | $0.15-0.20 | ⭐⭐⭐⭐⭐ | Bon mais cher |
| Légifrance API | $0.05 | ⭐⭐⭐⭐⭐ | Complexe, uniquement FR |

---

## ✅ DÉCISION PROPOSÉE

**Implémenter solution hybride: Brave Search + Claude Web Search Tool**

**Avantages pour AI Contract Guardian:**
- ✅ Sources FR fiables (filtrage Brave)
- ✅ Citations automatiques (Claude tool)
- ✅ Coût maîtrisé (~$0.07/analyse)
- ✅ Fallback intégré (robustesse)
- ✅ Facile à tester (free tier Brave)

**Prochaine étape:** POC avec 5 requêtes juridiques test

---

*Analyse réalisée le 4 février 2026*
*Sources: docs Anthropic, OpenAI, Brave, Tavily, Serper*