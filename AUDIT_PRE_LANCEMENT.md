# AUDIT AI CONTRACT GUARDIAN - Fonctionnalités & Conformité

**Date:** 4 Février 2026  
**Auditeur:** Sage  
**Statut:** Pré-lancement - Analyse critique

---

## 📋 1. FONCTIONNALITÉS ACTUELLES

### ✅ Ce qui existe

| Module | Fonctionnalité | Statut |
|--------|---------------|--------|
| **Auth** | JWT login/register | ✅ |
| **Upload** | PDF/DOCX drag-drop | ✅ |
| **Analyse** | Extraction + LLM Claude | ✅ |
| **Visualisation** | Dashboard, liste, détail | ✅ |
| **UI** | Responsive, shadcn/ui | ✅ |
| **Tests** | E2E Playwright | ✅ |
| **Sécurité** | Headers, rate limiting | ✅ |
| **CI/CD** | GitHub Actions | ✅ |

### ❌ Ce qui MANQUE CRITIQUEMENT

| Manque | Impact | Priorité |
|--------|--------|----------|
| Sources légales FR à jour | Hallucinations, erreurs juridiques | CRITIQUE |
| Score de confiance | Utilisateur ne sait pas se fier | CRITIQUE |
| Anti-hallucinations | Réponses fausses = danger | CRITIQUE |
| Disclaimer légal | Interdit en FR sans avertissement | CRITIQUE |
| Vérification jurisprudence | Décisions contradictoires ignorées | HAUTE |
| Langue FR forcée | Réponses anglais = rejet marché | HAUTE |

---

## ⚖️ 2. CONFORMITÉ LÉGALE FRANCE

### Obligations légales (strictes)

**Article L. 127-1 du Code de commerce:**
- Interdiction de se faire passer pour un professionnel du droit sans titre
- **Solution:** Disclaimer "Cet outil ne remplace pas un avocat"

**Déontologie avocat (CNBF):**
- Pas de conseil juridique personnalisé sans avocat
- **Solution:** Analyse descriptive uniquement, pas de recommandations d'action

**RGPD:**
- Données juridiques sensibles
- **Solution:** Encryption + droit à l'oubli (déjà en place)

**Obligations du service:**
1. ✅ Ne pas prétendre être un avocat
2. ✅ Avertir clairement l'utilisateur
3. ✅ Citer sources des informations
4. ✅ Indiquer date des textes de loi
5. ✅ Permettre vérification par professionnel

### Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Plainte Ordre des Avocats | Moyen | Critique | Disclaimer + pas de conseil |
| Hallucination légale | Haute | Critique | Recherche web sources + confiance |
| Données confidentielles | Moyen | Haut | Encryption + anonymisation |
| Obligations non détectées | Haute | Haut | Vérification jurisprudence |

---

## 🔍 3. SOURCES LÉGALES FRANÇAISES FIABLES

### Sources officielles (à intégrer)

**Législation:**
1. **Légifrance** (legifrance.gouv.fr) - Officiel
   - Codes: Civil, Commercial, Travail
   - Lois, ordonnances, décrets
   - API disponible

2. **JORF** (Journal Officiel) - Officiel
   - Textes publiés à jour
   - Pas d'API directe

**Jurisprudence:**
3. **Légifrance Jurisprudence** - Officiel
   - Cassation, Conseil d'État
   - Cours d'appel

4. **Doctrine** (doctrine.fr) - Payant
   - Décisions tribunaux
   - Analytics

5. **Dalloz** (dalloz.fr) - Payant
   - Jurisprudence complète

**Doctrine juridique:**
6. **CNIL** (cnil.fr) - RGPD
7. **URSSAF** - Social
8. **Bofip** - Fiscal

### Stratégie d'intégration

```
Analyse contrat
    ↓
Détection clauses (NLP)
    ↓
Recherche web sources:
    - Légifrance (codes applicables)
    - Jurisprudence (décisions similaires)
    - Doctrine (interprétations)
    ↓
Synthèse avec citations
    ↓
Score confiance calculé
```

---

## 🤖 4. AMÉLIORATIONS LLM REQUISES

### Prompt Engineering

**Actuel:** Analyse générique
**Requis:** Analyse avec recherche web sources

**Nouveau prompt:**
```
Tu es un assistant d'analyse contractuelle pour TPE/PME.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en français
2. Pour chaque clause analysée, cite:
   - Article de loi applicable (Code, article, alinéa)
   - Date du texte
   - Source: Légifrance ou jurisprudence
3. Si information incertaine: indique "[À VÉRIFIER]"
4. Pour jurisprudence: cite numéro d'affaire si possible
5. Calcule score de confiance: 0-100%

SCORE CONFIANCE:
- 90-100%: Texte de loi clair + jurisprudence confirmant
- 70-89%: Texte de loi clair sans jurisprudence
- 50-69%: Interprétation possible, zone grise
- <50%: Information insuffisante, AVIS AVOCAT REQUIS

DISCLAIMER À AJOUTER EN DÉBUT DE RAPPORT:
"Ce rapport est généré par une IA à titre indicatif. 
Il ne constitue pas un avis juridique et ne remplace pas 
la consultation d'un avocat ou notaire."

FORMAT DE SORTIE:
{
  "disclaimer": "...",
  "score_confiance_global": 0-100,
  "analyses": [{
    "clause": "...",
    "analyse": "...",
    "articles_applicables": [{
      "code": "Code civil",
      "article": "1134",
      "texte": "...",
      "date_texte": "2024-01-01",
      "source": "https://legifrance.gouv.fr/..."
    }],
    "jurisprudences": [{
      "juridiction": "Cour de cassation",
      "numero": "23-12.345",
      "date": "2023-06-15",
      "sommaire": "...",
      "source": "https://legifrance.gouv.fr/..."
    }],
    "score_confiance": 0-100,
    "recommandation_verification": true/false
  }]
}
```

### Fonction recherche web

**Tool:** `web_search` avec `freshness="pm"` (past month minimum)

**Queries:**
```python
# Pour clause pénalité
web_search({
    "query": "clause pénalité abusif jurisprudence Cour cassation 2024",
    "country": "FR",
    "search_lang": "fr"
})

# Pour délai résiliation
web_search({
    "query": "délai préavis résiliation contrat commercial Code civil article",
    "country": "FR"
})
```

---

## 📊 5. SCORE CONFIANCE - ALGORITHME

### Calcul du score

```python
def calculate_confidence(analysis_data):
    factors = {
        "texte_loi_clair": 30,      # Article précis cité
        "jurisprudence_confirmant": 25,  # Décision similaire
        "jurisprudence_contraire": -20,  # Risque d'erreur
        "zone_grise": -15,          # Interprétation nécessaire
        "information_incomplete": -30,   # Manque données
        "anciennete_texte": variable,    # >5 ans = -10
    }
    
    base_score = 50
    
    for factor, impact in factors.items():
        if analysis_data.get(factor):
            base_score += impact
    
    return max(0, min(100, base_score))
```

### Seuils d'avertissement

| Score | Couleur | Message | Action |
|-------|---------|---------|--------|
| 90-100 | 🟢 Vert | Fiable | Validation automatique |
| 70-89 | 🟡 Jaune | Probable | Mention "À vérifier" |
| 50-69 | 🟠 Orange | Incertain | Recommander avocat |
| <50 | 🔴 Rouge | Insuffisant | Refuser analyse |

---

## 🛡️ 6. ANTI-HALLUCINATIONS

### Techniques à implémenter

1. **Recherche web systématique** avant réponse
2. **Citation obligatoire** de toute affirmation
3. **Date des sources** vérifiée
4. **Cross-validation** plusieurs sources
5. **Vérification humaine** si score <70

### Vérification des réponses

```python
def verify_legal_claim(claim: str) -> dict:
    """Vérifie une affirmation juridique via recherche web"""
    search_result = web_search({
        "query": f"{claim} site:legifrance.gouv.fr",
        "country": "FR"
    })
    
    return {
        "verified": len(search_result) > 0,
        "sources": [r.url for r in search_result[:3]],
        "confidence": calculate_verification_score(search_result)
    }
```

---

## 💻 7. INFRASTRUCTURE - HETZNER + COOLIFY

### Hetzner VPS Recommandation

**Pour lancement (MVP):**
- **Type:** CPX21 (2 vCPU, 4 GB RAM, 80 GB NVMe)
- **Prix:** ~€8.21/mois
- **Pourquoi:** Suffisant pour démarrer, scalable

**Pour croissance (100+ analyses/jour):**
- **Type:** CPX31 (4 vCPU, 8 GB RAM, 160 GB NVMe)
- **Prix:** ~€14.76/mois

**Pour scale (1000+ analyses/jour):**
- **Type:** CPX41 (8 vCPU, 16 GB RAM, 240 GB NVMe)
- **Prix:** ~€26.47/mois

### Coolify Configuration

**Avantages:**
- Déploiement simplifié (type Heroku)
- Docker natif
- SSL automatique (Let's Encrypt)
- Monitoring intégré
- Backups automatisés

**Stack Coolify:**
```yaml
Services:
  - Frontend: Next.js (port 3000)
  - Backend: FastAPI (port 8000)
  - DB: PostgreSQL (port 5432)
  - Cache: Redis (port 6379)
  - Queue: Celery workers
```

---

## 📋 8. ROADMAP CORRIGÉE

### AVANT LANCEMENT (Obligatoire)

**Phase 4.5 - Conformité & Fiabilité:**
1. ✅ Intégration recherche web sources légales
2. ✅ Score confiance calculé
3. ✅ Disclaimer légal obligatoire
4. ✅ Forçage réponses FR uniquement
5. ✅ Anti-hallucinations (citations obligatoires)
6. ✅ Vérification jurisprudence
7. ✅ Tests avec vrais contrats

### PHASE 5 - DÉPLOIEMENT (après validation conformité)

1. **Setup Hetzner + Coolify**
2. **Configuration production**
3. **Monitoring Sentry**
4. **Landing page Stripe**
5. **Documentation utilisateur**

---

## ✅ CHECKLIST PRÉ-LANCEMENT

- [ ] Recherche web sources légales intégrée
- [ ] Score confiance affiché dans UI
- [ ] Disclaimer visible avant analyse
- [ ] Tests avec 10 contrats réels
- [ ] Vérification réponses en FR
- [ ] Aucune hallucination détectée
- [ ] Coolify + Hetzner testés
- [ ] Documentation conformité rédigée

---

## 🎯 RECOMMANDATION

**NE PAS LANCER** avant Phase 4.5 terminée.

Risque trop élevé:
- Hallucinations juridiques = responsabilité
- Non-conformité = interdiction
- Manque fiabilité = réputation

**Priorité:** Rendre le service juridiquement fiable AVANT déploiement.

---

*Audit réalisé le 4 février 2026*  
*Prochaine étape: Phase 4.5 - Conformité & Fiabilité*