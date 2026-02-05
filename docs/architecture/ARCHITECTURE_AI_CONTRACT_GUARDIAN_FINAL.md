# AI Contract Guardian - Architecture Finale

**Date:** Février 2026  
**Version:** 1.0 - Générée avec recherches web  
**Status:** ✅ Complète

---

## 🧠 1. CHOIX LLM (Recherches Web Février 2026)

### Analyse Comparative

| Modèle | Contexte | Prix/1M tokens | Français Juridique | Recommandation |
|--------|----------|----------------|-------------------|----------------|
| **Claude Sonnet 4** | 200K | $3/$15 | ⭐⭐⭐⭐⭐ | **TIER 1 - Primaire** |
| **Claude Opus 4.5** | 200K | $5/$25 | ⭐⭐⭐⭐⭐ | Cas complexes >50 pages |
| **GPT-4.1** | 128K-1M | $2-3/$8-12 | ⭐⭐⭐⭐ | **TIER 2 - Secondaire** |
| **GPT-5 mini** | 1M | $0.15/$0.60 | ⭐⭐⭐ | Pré-analyse économique |
| **Gemini 2.5 Pro** | 1M | $1.25-2.50/$10-15 | ⭐⭐⭐⭐ | **TIER 3 - Corpus massifs** |
| **Mistral Large 2** | 128K-262K | $0.50-2/$1.50-6 | ⭐⭐⭐⭐⭐ | **RGPD-First (FR)** |
| **DeepSeek V3.2** | 128K | $0.28/$0.42 | ⭐⭐⭐ | Fallback économique |

### Stratégie Hybride Recommandée

```
TIER 1 - Analyse complexe:
└── Claude Sonnet 4 (primaire)
└── Claude Opus 4.5 (cas >50 pages)

TIER 2 - Extraction rapide:
└── GPT-5 mini (économique)
└── Mistral Large 2 (RGPD)

TIER 3 - Corpus massifs:
└── Gemini 2.5 Pro (1M contexte)

FALLBACK:
└── DeepSeek V3 (avec validation)
```

**Pourquoi cette stratégie:**
- Claude = meilleur raisonnement juridique, moins d'hallucinations
- GPT-5 mini = économique pour tâches simples
- Mistral = RGPD natif, souveraineté française
- Gemini = contexte massif pour corpus entiers

---

## 🏗️ 2. STACK TECHNIQUE

### Backend: Python FastAPI

**Pourquoi Python (et pas Node.js):**
| Critère | Python | Node.js |
|---------|--------|---------|
| NLP Juridique | ✅ Spacy, transformers | ⚠️ Bindings complexes |
| PDF Processing | ✅ pdfplumber, camelot | ⚠️ Moins mature |
| LLM Integration | ✅ LangChain, LlamaIndex | ⚠️ Moins mature |
| Ecosystème ML | ✅ Dominant | ❌ Limité |

**Stack Backend:**
- **Framework:** FastAPI 0.115 (ASGI, async, OpenAPI)
- **PDF:** pdfplumber + camelot (tables) + PyMuPDF
- **NLP:** spacy 3.8 + langchain 0.3
- **LLM:** Clients anthropic, openai, mistral, google
- **Queue:** Celery + Redis
- **DB:** PostgreSQL 16 + SQLModel

### Frontend: Next.js 15

- **Framework:** Next.js 15 (App Router, dernier stable)
- **UI:** Tailwind CSS 4 + shadcn/ui
- **PDF:** react-pdf + annotations
- **State:** Zustand + TanStack Query

### Infrastructure

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Vercel    │  │   Railway   │  │   Supabase  │
│  (Frontend) │  │  (Backend)  │  │  (DB/Auth)  │
│   $20/mois  │  │   $29/mois  │  │   $25/mois  │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Total infrastructure:** ~$119/mois

---

## 📊 3. ARCHITECTURE DÉTAILLÉE

### Flux de Données

```
[User] → [Next.js/Vercel] → [FastAPI/Railway]
                                ↓
                    ┌───────────────────┐
                    │  1. Upload PDF    │
                    │  2. Queue Celery  │
                    │  3. Worker Python │
                    └─────────┬─────────┘
                              ↓
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        [Extraction]    [OCR si scan]   [Chunking]
              └───────────────┬───────────────┘
                              ↓
                    [LLM Provider]
                    (Claude/GPT/etc)
                              ↓
                    [Post-traitement]
                              ↓
                    [PostgreSQL/S3]
```

### Phases de Développement

| Phase | Objectif | Durée estimée |
|-------|----------|---------------|
| **1. Foundation** | Setup, auth, upload | 2-3 jours |
| **2. Core Backend** | Parsing PDF, LLM integration | 4-5 jours |
| **3. Frontend** | UI, visualisation | 3-4 jours |
| **4. Polish** | Tests, sécurité, perf | 2-3 jours |
| **5. Launch** | Deploy, monitoring | 1-2 jours |

---

## 💰 4. COÛTS

### Par analyse (moyenne 15 pages)

| Scénario | Coût LLM | Infra/mois | Total 100 analyses |
|----------|----------|------------|-------------------|
| **Standard** | $0.09 (Claude) | $119 | **$128** |
| **Économique** | $0.005 (DeepSeek) | $119 | **$120** |
| **Premium** | $0.15 (Claude Opus) | $119 | **$134** |

### Scénarios mensuels

| Volume | Coût total | Revenus (€49/client) | Rentabilité |
|--------|-----------|---------------------|-------------|
| 100 analyses | $128 | €4,900 | ✅ 38x |
| 500 analyses | $164 | €24,500 | ✅ 149x |
| 2000 analyses | $280 | €98,000 | ✅ 350x |

**Conclusion:** Très rentable dès le premier client.

---

## 🔐 5. SÉCURITÉ RGPD

- ✅ Encryption AES-256 (PDFs at rest)
- ✅ HTTPS/TLS 1.3 (in transit)
- ✅ PII detection avant envoi LLM
- ✅ Audit trails complets
- ✅ Suppression auto 90j
- ✅ Droit à l'oubli (endpoint DELETE)
- ✅ Mistral option RGPD-first (FR)

---

## 🎯 RECOMMANDATION FINALE

**Stack optimal:**
- **Backend:** Python FastAPI + Celery + PostgreSQL
- **Frontend:** Next.js 15 + shadcn/ui
- **LLM:** Claude Sonnet 4 (primaire) + GPT-5 mini (éco) + Mistral (RGPD)
- **Infra:** Vercel + Railway + Supabase
- **Coût:** ~$120-150/mois pour démarrer

**Prochaine étape:** Lancer le développement Phase 1 (Foundation) ?

---

*Architecture générée avec web search Brave API + benchmarks actuels*