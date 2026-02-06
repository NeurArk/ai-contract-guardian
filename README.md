# AI Contract Guardian

> API d'analyse contractuelle par Intelligence Artificielle pour TPE/PME

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.8-009688.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 Description

AI Contract Guardian est une solution d'analyse automatique de contrats destinée aux TPE/PME. L'application utilise l'intelligence artificielle (Claude/Anthropic) pour :

- Extraire les clauses importantes des contrats
- Identifier les risques potentiels
- Générer des résumés exécutifs
- Suggérer des points de négociation

## 🏗️ Architecture

```
ai-contract-guardian/
├── backend/              # API FastAPI
│   ├── app/              # Code source de l'application
│   │   ├── api/          # Endpoints REST
│   │   ├── core/         # Utilitaires (sécurité, config)
│   │   ├── models/       # Modèles SQLModel
│   │   └── db/           # Configuration DB
│   ├── tests/            # Tests pytest
│   ├── requirements.txt  # Dépendances
│   ├── Dockerfile        # Image Docker
│   └── pyproject.toml    # Configuration projet
├── docker-compose.yml    # Services Docker
└── README.md
```

### Stack Technique

- **Backend**: Python 3.12, FastAPI 0.115.8
- **Base de données**: PostgreSQL 16 (asyncpg)
- **Cache/File d'attente**: Redis 7
- **ORM**: SQLModel 0.0.22
- **Tests**: pytest, pytest-asyncio

## 🚀 Démarrage Rapide

### Prérequis

- Docker et Docker Compose
- Python 3.12 (pour le développement local)
- Git

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/NeurArk/ai-contract-guardian.git
   cd ai-contract-guardian
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos valeurs
   ```

3. **Lancer les services**
   ```bash
   docker-compose up -d
   ```

4. **Vérifier que tout fonctionne**
   ```bash
   curl http://localhost:8000/health
   # Réponse attendue: {"status": "ok", "version": "0.1.0"}
   ```

### Commandes Utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ données perdues)
docker-compose down -v

# Rebuild après modification
docker-compose up -d --build
```

## 🧪 Développement Local

### Sans Docker

1. **Créer un environnement virtuel**
   ```bash
   cd backend
   python3.12 -m venv venv
   source venv/bin/activate
   ```

2. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   # ou
   pip install -e ".[dev]"
   ```

3. **Lancer les services de base de données**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Démarrer l'application**
   ```bash
   uvicorn app.main:app --reload
   ```

### Tests

```bash
# Exécuter tous les tests
cd backend
pytest

# Avec couverture
pytest --cov=app --cov-report=html

# Tests spécifiques
pytest tests/test_health.py -v
```

## 📚 Documentation API

Une fois l'application lancée :

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Endpoints Disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Page d'accueil |
| GET | `/health` | Health check |

## 🔧 Configuration

### Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DEBUG` | Mode debug | `false` |
| `DATABASE_URL` | URL PostgreSQL | `postgresql+asyncpg://...` |
| `REDIS_URL` | URL Redis | `redis://redis:6379/0` |
| `SECRET_KEY` | Clé secrète JWT | *requis* |
| `ANTHROPIC_API_KEY` | Clé API Claude | *optionnel* |
| `RESEND_API_KEY` | Clé API Resend (email bienvenue) | *optionnel* |
| `RESEND_FROM` | Expéditeur Resend (email vérifié) | *optionnel* |
| `CORS_ORIGINS` | Origines CORS autorisées | `http://localhost:3000` |

## 🗺️ Roadmap

### Phase 1 ✅ (Courant)
- [x] Setup repository et structure
- [x] FastAPI avec endpoint /health
- [x] Docker Compose (PostgreSQL, Redis)
- [x] Configuration Pydantic Settings
- [x] Tests pytest

### Phase 2 (À venir)
- [ ] Authentification JWT
- [ ] Modèles utilisateurs
- [ ] Upload de documents

### Phase 3 (À venir)
- [ ] Intégration Anthropic Claude
- [ ] Extraction automatique de clauses
- [ ] Analyse des risques

### Phase 4 (À venir)
- [ ] Interface web (Next.js)
- [ ] Dashboard utilisateur
- [ ] Historique des analyses

### Phase 5 (À venir)
- [ ] Déploiement cloud
- [ ] CI/CD
- [ ] Monitoring

## 📝 License

MIT License - voir [LICENSE](LICENSE)

## 👥 Équipe

Développé par [NeurArk](https://github.com/NeurArk)

---

<div align="center">
  <sub>Construit avec ❤️ pour simplifier la vie des TPE/PME</sub>
</div>
