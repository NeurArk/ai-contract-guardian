# 🛡️ AI Contract Guardian - Architecture Technique V4

**Date:** 4 Février 2026  
**Version:** 4.0 - Architecture Haut Niveau  
**Status:** ✅ Conception Complète

---

## 🎯 1. VISION SYSTÈME

### Objectif
Plateforme d'analyse contractuelle par IA pour TPE/PME française. Upload PDF → Analyse juridique automatisée → Rapport structuré avec alertes.

### Architecture Cible
Architecture distribuée **asynchrone** séparant :
- **Frontend** : Interface utilisateur (Next.js 15)
- **API Gateway** : Points d'entrée REST (FastAPI)
- **Workers** : Traitement lourd parallèle (Celery)
- **Storage** : Données structurées + fichiers

---

## 🏗️ 2. ARCHITECTURE LOGIQUE

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENT                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────┐   │
│  │  Web App     │─────▶│  Next.js 15  │─────▶│  REST API       │   │
│  │  (Browser)   │      │  (Vercel)    │      │  /api/v1/*      │   │
│  └──────────────┘      └──────────────┘      └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          GATEWAY API                                │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────┐   │
│  │  Auth        │      │  Validation  │      │  Rate Limiting  │   │
│  │  JWT         │      │  Pydantic    │      │  Redis          │   │
│  └──────────────┘      └──────────────┘      └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  Upload  │   │  Status  │   │  Export  │
       │  Service │   │  Service │   │  Service │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            └──────────────┼──────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         QUEUE SYSTEM                                │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────┐   │
│  │  Redis       │─────▶│  Celery      │─────▶│  Workers        │   │
│  │  (Broker)    │      │  (Queue)     │      │  (Processing)   │   │
│  └──────────────┘      └──────────────┘      └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PROCESSING LAYER                              │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────┐   │
│  │  PDF Parser      │───▶│  LLM Service     │───▶│  Scoring    │   │
│  │  (OCR + Text)    │    │  (Multi-provider)│    │  Engine     │   │
│  └──────────────────┘    └──────────────────┘    └─────────────┘   │
│           │                                               │         │
│           ▼                                               ▼         │
│  ┌──────────────────┐                          ┌─────────────────┐ │
│  │  NLP Pipeline    │                          │  Report Gen     │ │
│  │  (Clause detect) │                          │  (PDF Export)   │ │
│  └──────────────────┘                          └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────┐   │
│  │  PostgreSQL  │      │  Supabase    │      │  Redis Cache    │   │
│  │  (Metadata)  │      │  Storage     │      │  (Sessions)     │   │
│  └──────────────┘      └──────────────┘      └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants Principaux

| Composant | Rôle | Technologie | Justification |
|-----------|------|-------------|---------------|
| **Frontend** | UI/UX | Next.js 15 | App Router, RSC, SSR |
| **API Gateway** | Endpoints REST | FastAPI | Async natif, validation auto |
| **Queue** | Traitement async | Celery + Redis | Pattern producteur/consommateur |
| **PDF Parser** | Extraction texte | Marker + PyPDF | OCR IA SOTA + fallback rapide |
| **LLM Service** | Appels modèles | SDK Anthropic | Contrôle total, pas d'abstraction |
| **Scoring Engine** | Évaluation risques | Python custom | Algo métier spécifique |
| **Database** | Persistence | PostgreSQL 16 | JSONB flexible, ACID |
| **File Storage** | Stockage PDF | Supabase S3 | Signatures URL, EU region |

---

## 🧠 3. CHOIX STACK DÉTAILLÉS

### 3.1 LLM Provider - Stratégie Multi-Provider

**Primary: Anthropic Claude**
- **Modèle:** Sonnet 4.5 (stable) / Sonnet 5 (dès release)
- **Justification:** 
  - Meilleur raisonnement juridique (benchmarks legal reasoning)
  - Contexte 200K tokens (contrats longs)
  - Moins d'hallucinations que GPT sur textes complexes
  - Pricing: $3 input / $15 output per 1M tokens

**Fallback 1: OpenAI GPT-4.1**
- **Modèle:** GPT-4.1 (1M contexte)
- **Quand l'utiliser:** Claude API down ou timeout
- **Pricing:** $2/$8 (moins cher, contexte plus grand)

**Fallback 2: Mistral Large**
- **Modèle:** Mistral Large 2
- **Quand l'utiliser:** Client RGPD-first, données sensibles
- **Avantage:** Souveraineté EU, hosting France

**Pattern de Fallback:**
```
Call Primary (Claude)
    ↓ Timeout/Error
Call Fallback 1 (GPT-4.1)
    ↓ Timeout/Error
Call Fallback 2 (Mistral)
    ↓ Error
Return Error to User
```

### 3.2 Backend Language - Pourquoi Python

**Comparaison Python vs Node.js pour ce use case:**

| Critère | Python | Node.js | Gagnant |
|---------|--------|---------|---------|
| PDF Parsing juridique | pdfplumber, marker mature | pdf-parse abandonné | Python |
| OCR qualité | marker (IA layout) | Tesseract bindings faibles | Python |
| NLP custom | spacy, transformers | Limité | Python |
| LLM ecosystem | SDK natifs tous providers | Moins mature | Python |
| Async/Sync mix | AsyncIO + sync libs | Natif async | Égal |
| Dev speed MVP | Rapide avec FastAPI | Rapide avec Express | Égal |

**Verdict:** Python pour l'écosystème PDF/NLP/LLM supérieur.

**Framework:** FastAPI (pas Django)
- Justification: Async first, OpenAPI auto, Pydantic validation

### 3.3 Intégration LLM - SDK Natif vs LangChain

**Option A: Anthropic SDK Natif** ← RECOMMANDÉ
- **Avantages:** Contrôle total, moins de dépendances, debug facile
- **Inconvénients:** Code plus verbeux pour patterns avancés
- **Cas d'usage:** Ce projet (besoins directs, pas de routing complexe)

**Option B: LangChain**
- **Avantages:** Abstractions prêtes, intégration multi-provider fluide
- **Inconvénients:** Overhead, versions pas toujours à jour, debugging opaque
- **Cas d'usage:** Routing LLM complexe, agents autonomes

**Décision:** SDK natif Anthropic + pattern fallback manuel.

### 3.4 Queue System - Pourquoi Celery

**Alternatives considérées:**
- **RQ (Redis Queue):** Plus simple mais moins features (retry, monitoring)
- **Bull (Node.js):** Nécessite worker Node (on reste Python)
- **AWS SQS:** Vendor lock-in, pas pour MVP

**Choix:** Celery + Redis
- Mature, documenté, intégration Python parfaite
- Retry avec backoff, monitoring Flower, scheduling

### 3.5 Frontend Framework - Next.js 15

**Pourquoi pas Vue/Svelte/Angular:**
- **Next.js 15:** App Router, React Server Components, API Routes
- **Vercel hosting:** CI/CD intégré, edge functions
- **Ecosystème:** shadcn/ui, Tailwind massivement adoptés

**Version:** 15.x (App Router obligatoire, pas Pages Router)

---

## 📊 4. PATTERNS ARCHITECTURAUX

### 4.1 Async Processing Pattern

**Problème:** Analyse PDF + LLM = 10-60 secondes (blocking HTTP = timeout)

**Solution:** Queue asynchrone

**Flux:**
1. Client POST /contracts/upload → reçoit immédiatement `contract_id`
2. API enqueues job Celery → retourne 202 Accepted
3. Worker traite en background (PDF → LLM → Scoring)
4. Client poll GET /contracts/{id}/status ou WebSocket/SSE
5. Job terminé → notification client

**Avantages:**
- Pas de timeout HTTP
- Scalable (ajouter workers)
- Résilient (retry si échec)

### 4.2 Retry Pattern avec Circuit Breaker

**Problème:** LLM APIs peuvent être indisponibles

**Solution:** Retry exponentiel + Circuit Breaker

**Stratégie:**
- Retry 3x avec backoff (1s, 2s, 4s)
- Si 3 échecs consécutifs → Circuit Open (arrête d'appeler pendant 30s)
- Fallback vers provider alternatif
- Monitoring alertes si circuit souvent ouvert

### 4.3 PII Sanitization Pattern

**Problème:** Données sensibles (SIRET, emails) dans contrats

**Solution:** Anonymisation avant envoi LLM

**Flux:**
1. Extraction texte PDF
2. Détection PII (regex + NER)
3. Remplacement par placeholders `[PARTY_A]`, `[EMAIL_1]`
4. Envoi au LLM
5. Stockage mapping hashé en DB
6. Reconstruction PII dans résultat final (si besoin)

**Avantage:** Données sensibles jamais envoyées à LLM tiers (RGPD)

### 4.4 Structured Output Pattern

**Problème:** LLM retourne texte libre → parsing difficile

**Solution:** Forcer format JSON via:
- **Anthropic:** System prompt + exemple + validation Pydantic
- **OpenAI:** `response_format={"type": "json_object"}`

**Structure de sortie standardisée:**
```json
{
  "metadata": { "parties": [], "type": "", "dates": {} },
  "risks": [{ "clause": "", "severity": "high|medium|low", "explanation": "" }],
  "scores": { "equity": 0-100, "clarity": 0-100 },
  "recommendations": [""]
}
```

### 4.5 Multi-Tenant Pattern (Future)

**Architecture pour scaling multi-entreprise:**
- Row-level security PostgreSQL
- Organisation ID dans chaque table
- Isolation des données par tenant
- Quota/rate limiting par organisation

---

## 🗄️ 5. MODÈLE DE DONNÉES

### Schéma Conceptuel

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Contract     │       │    Analysis     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ user_id (FK)    │──┘    │ contract_id(FK) │
│ password_hash   │  │    │ filename        │       │ status          │
│ org_id (FK)     │  │    │ storage_path    │       │ results (JSONB) │
│ created_at      │  │    │ file_size       │       │ score_equity    │
└─────────────────┘  │    │ mime_type       │       │ score_clarity   │
                     │    │ status          │       │ created_at      │
                     │    │ created_at      │       └─────────────────┘
                     │    └─────────────────┘
                     │              │
                     │              ▼
                     │    ┌─────────────────┐
                     └────┤  Organization   │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ name            │
                          │ plan (free|pro) │
                          └─────────────────┘
```

### Types de Stockage

| Donnée | Type | Solution | Justification |
|--------|------|----------|---------------|
| **Métadonnées** | Structuré | PostgreSQL | ACID, relations, JSONB flexible |
| **Fichiers PDF** | Blob | Supabase S3 | Signatures URL, EU region |
| **Résultats analyse** | Semi-structuré | PostgreSQL JSONB | Requêtes JSON, index GIN |
| **Sessions/Cache** | Key-value | Redis | TTL, performance |
| **Queue jobs** | Message | Redis | Broker Celery |

---

## 🔐 6. SÉCURITÉ & RGPD

### Menaces Identifiées

| Menace | Niveau | Mitigation |
|--------|--------|------------|
| **Data leakage** | Critique | Encryption at rest (AES-256), in transit (TLS 1.3) |
| **PII exposée** | Critique | Anonymisation avant LLM, mapping hashé |
| **Accès non autorisé** | Haut | JWT court durée, RBAC, row-level security |
| **Injection** | Moyen | Validation Pydantic, pas de SQL raw |
| **DDoS** | Moyen | Rate limiting Redis, Cloudflare (option) |

### Conformité RGPD

| Exigence | Implémentation |
|----------|----------------|
| **Droit à l'oubli** | Endpoint DELETE + purge S3 automatique |
| **Portabilité** | Export JSON complet des données user |
| **Consentement** | Checkbox explicite signup, log consentement |
| **Minimisation** | Pas de stockage texte extrait > 90 jours |
| **Sécurité** | Encryption, audit logs, penetration testing |
| **DPO** | Contact privacy@ (à créer) |

---

## 💰 7. COÛTS & SCALING

### Architecture 100 analyses/mois (MVP)

| Poste | Solution | Coût/mois |
|-------|----------|-----------|
| **Frontend** | Vercel Hobby | €0 |
| **Backend** | Railway Starter | €5 |
| **Database** | Supabase Free (500MB) | €0 |
| **Storage** | Supabase Free (1GB) | €0 |
| **Redis** | Upstash Free | €0 |
| **LLM API** | Claude Sonnet (~$3) | €3 |
| **Total** | | **~€8** |

### Architecture 2000 analyses/mois (Scale)

| Poste | Solution | Coût/mois |
|-------|----------|-----------|
| **Frontend** | Vercel Pro | €20 |
| **Backend** | Railway Pro | €20 |
| **Database** | Supabase Pro (50GB) | €70 |
| **Storage** | ~20GB utilisés | €1 |
| **Redis** | Upstash Pro | €10 |
| **LLM API** | Mix Claude/GPT (~$40) | €36 |
| **Monitoring** | Sentry + Logtail | €30 |
| **Total** | | **~€187** |

### Seuils de Rentabilité

| Volume | Coût Infra | Coût LLM | Total | Revenus (€49/analyse) | Profit |
|--------|-----------|----------|-------|-----------------------|--------|
| 100 | €5 | €3 | €8 | €4,900 | €4,892 |
| 500 | €30 | €15 | €45 | €24,500 | €24,455 |
| 2000 | €121 | €36 | €157 | €98,000 | €97,843 |

**Conclusion:** Rentable dès la première analyse payante.

---

## 📅 8. ROADMAP DÉVELOPPEMENT

### Phase 1: Foundation (2-3 jours)
**Objectif:** Infrastructure opérationnelle
- Setup repos GitHub
- Docker Compose local (Postgres, Redis)
- FastAPI structure de base
- Authentification JWT
- Premier endpoint /health

### Phase 2: Core Backend (4-5 jours)
**Objectif:** Upload et analyse fonctionnels
- Upload PDF → Supabase Storage
- Celery worker configuration
- PDF parsing (marker/PyPDF)
- Intégration SDK Anthropic
- Analyse async complète

### Phase 3: Frontend (3-4 jours)
**Objectif:** Interface utilisateur
- Next.js 15 + shadcn/ui setup
- Auth (login/register)
- Upload drag-and-drop
- Dashboard résultats
- Visualisation risques

### Phase 4: Polish (2-3 jours)
**Objectif:** Production-ready
- Retry/fallback LLM
- Tests E2E (Playwright)
- Security audit
- Performance optimization
- Documentation API

### Phase 5: Launch (1-2 jours)
**Objectif:** Mise en prod
- Deploy Railway + Vercel
- Monitoring Sentry
- Landing page Stripe
- Analytics

**Total:** ~15-20 jours de développement concentré

---

## ✅ CHECKLIST VALIDATION ARCHITECTURE

**Avant de commencer le développement, vérifier:**

- [ ] Compris: Python FastAPI + Celery + PostgreSQL
- [ ] Compris: Next.js 15 frontend séparé
- [ ] Validé: SDK Anthropic natif (pas LangChain)
- [ ] Validé: Pattern async avec queue Celery
- [ ] Validé: Multi-provider fallback (Claude → GPT → Mistral)
- [ ] Validé: PII anonymization avant envoi LLM
- [ ] Validé: RGPD compliance planifiée
- [ ] Validé: Budget ~€8-187/mois selon volume

---

## 🎯 RÉSUMÉ EXÉCUTIF

**Architecture choisie:**
- **Backend:** Python FastAPI, async, Celery workers
- **Frontend:** Next.js 15, App Router, Vercel
- **LLM:** Anthropic Claude (primary) + OpenAI GPT (fallback)
- **Integration:** SDK natif Anthropic (pas d'abstraction)
- **Pattern:** Queue asynchrone pour traitement long
- **Sécurité:** PII anonymization, encryption, RGPD
- **Budget:** €8/mois (MVP) → €187/mois (2000 analyses)

**Prochaine étape:** Lancer Phase 1 (Foundation) ?