# Plan de Qualité - AI Contract Guardian

## Phase 1: Corrections Backend (Python)

### 1.1 Fix Imports Circulaires
- [ ] Analyser `models/__init__.py`
- [ ] Analyser `models/analysis.py` vs `models/contract.py`
- [ ] Déplacer imports dans fonctions si nécessaire
- [ ] Utiliser TYPE_CHECKING pour imports type-only

### 1.2 Tests Python
- [ ] Créer `tests/conftest.py` avec fixtures
- [ ] Tests API endpoints (auth, contracts, analysis)
- [ ] Tests models (User, Contract, Analysis)
- [ ] Tests services (analysis, security)

### 1.3 Lint & TypeCheck
- [ ] Installer flake8, mypy, black
- [ ] Configurer .flake8, mypy.ini
- [ ] Corriger toutes les erreurs

## Phase 2: Corrections Frontend (TypeScript)

### 2.1 Fix Imports
- [ ] Remplacer tous `radix-ui` par `@radix-ui/react-slot`
- [ ] Vérifier imports dans tous les fichiers UI

### 2.2 TypeCheck
- [ ] Configurer strict mode tsconfig.json
- [ ] Ajouter types manquants
- [ ] Corriger erreurs tsc

### 2.3 Lint
- [ ] Configurer ESLint avec Prettier
- [ ] Corriger tous les warnings

### 2.4 Tests
- [ ] Tests composants avec Vitest
- [ ] Tests E2E avec Playwright

## Phase 3: CI/CD

### 3.1 GitHub Actions
- [ ] Workflow CI Python
- [ ] Workflow CI TypeScript
- [ ] Workflow Docker Build

### 3.2 Docker Test
- [ ] docker-compose.test.yml
- [ ] Healthchecks

## Phase 4: Validation Finale

- [ ] Backend démarre sans erreur
- [ ] Frontend compile sans erreur
- [ ] Tests passent à 100%
- [ ] Lint/typecheck passent
