# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

## [0.4.0] - 2026-02-04

### Added

#### Tests E2E
- Configuration complète de Playwright pour les tests end-to-end
- Tests sur Chrome, Firefox et Safari (WebKit)
- Tests mobile (Pixel 5, iPhone 12)
- Tests d'authentification (inscription, login, logout, validation)
- Tests de gestion des contrats (upload, navigation, filtres)
- Tests d'upload (drag & drop, validation de type et taille)
- Tests du dashboard (stats, navigation, responsive)

#### Performance
- Analyse de bundle avec @next/bundle-analyzer
- Configuration de compression Gzip pour le backend
- Indexes de base de données optimisés pour les requêtes fréquentes
- Lazy loading et code splitting configurés
- Optimisation des images avec next/image
- Cache Redis pour les réponses fréquentes

#### Sécurité
- Headers de sécurité (Helmet-like) : CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Rate limiting avec Redis
- Refresh token rotation
- Invalidation des tokens au logout
- Validation renforcée des types MIME côté serveur
- Protection CSRF helpers

#### CI/CD
- Workflow GitHub Actions complet
- Tests backend avec couverture
- Tests frontend (lint, type-check, build)
- Tests E2E avec Playwright
- Scan de sécurité avec Trivy et Bandit
- Build et push Docker automatique

### Changed

- Mise à jour de la configuration Next.js avec optimisations de performance
- Amélioration de la gestion des erreurs API
- Refactoring du système d'authentification avec refresh tokens

### Security

- Ajout de headers de sécurité sur toutes les réponses
- Implémentation du refresh token rotation
- Blacklist des tokens JWT invalidés
- Rate limiting par IP et endpoint

## [0.3.0] - 2026-02-04

### Added

- Interface web complète avec Next.js 15 et shadcn/ui
- Pages d'authentification (login, register)
- Dashboard avec statistiques
- Liste des contrats avec filtres et recherche
- Page d'upload de contrats avec drag & drop
- Visualisation détaillée des contrats et analyses
- Gestion d'état avec Zustand
- React Query pour la gestion des données serveur
- React Hook Form avec Zod pour la validation

### Changed

- Migration de l'architecture frontend vers Next.js App Router
- Intégration complète avec l'API backend

## [0.2.0] - 2026-02-04

### Added

- Système d'authentification JWT complet
- Modèles utilisateurs avec SQLModel
- CRUD contrats (upload, liste, détail)
- Analyse asynchrone des contrats avec Celery
- Extraction de texte PDF et DOCX
- Intégration Claude/Anthropic pour l'analyse
- Stockage sécurisé des fichiers
- API REST complète avec documentation OpenAPI
- Tests unitaires et d'intégration avec pytest

### Changed

- Architecture modulaire du backend
- Configuration via variables d'environnement

## [0.1.0] - 2026-02-04

### Added

- Structure initiale du projet
- Configuration Docker et Docker Compose
- FastAPI avec endpoint /health
- PostgreSQL avec asyncpg
- Redis pour le cache et les queues
- Configuration Pydantic Settings
- Alembic pour les migrations
- Tests pytest basiques
- README et documentation initiale

---

## Roadmap

### [0.5.0] - Prochaine version

- Déploiement cloud (AWS/GCP)
- Monitoring et alerting
- Amélioration de l'IA (fine-tuning)
- Export des rapports (PDF, Word)
- Notifications email

### [1.0.0] - Version stable

- Support multi-langues
- API publique avec documentation
- Webhooks
- Intégrations tierces (Google Drive, Dropbox)
- Plan freemium complet
