# CLÉS API NÉCESSAIRES - TESTS JOUR J

**Date:** 5 Février 2026  
**Session:** Tests finaux avant lancement  
**Status:** En attente des clés

---

## 🔑 CLÉS REQUISES POUR LES TESTS

### 1. **ANTHROPIC API KEY** (OBLIGATOIRE)

**Usage:** Analyse des contrats avec Claude  
**Endpoint:** `https://api.anthropic.com/v1/messages`  
**Modèle utilisé:** `claude-sonnet-4-5-20250929`  
**Coût estimé tests:** ~2-3€ (5 contrats × 3 appels)

**Format:** `sk-ant-api03-...`

**Permissions nécessaires:**
- Messages API ✓
- Web Search Tool (beta) ✓

---

### 2. **BRAVE SEARCH API KEY** (OBLIGATOIRE)

**Usage:** Recherche sources juridiques Légifrance  
**Endpoint:** `https://api.search.brave.com/res/v1/web/search`  
**Coût estimé tests:** Gratuit (2000 requêtes/mois)

**Format:** `BSAMv1...`

**Paramètres utilisés:**
- `country=FR`
- `search_lang=fr`
- `freshness=pm` (past month)

---

### 3. **CLÉS OPTIONNELLES** (Non bloquantes pour tests)

| Clé | Usage | Requis? |
|-----|-------|---------|
| **OPENAI_API_KEY** | Fallback GPT-5 si Claude down | ❌ Non (optionnel) |
| **SENDGRID_API_KEY** | Envoi emails notifications | ❌ Non (optionnel) |
| **SENTRY_DSN** | Monitoring erreurs | ❌ Non (optionnel) |

---

## 📝 CHECKLIST CLÉS JOUR J

**Avant les tests:**
- [ ] Recevoir clé Anthropic (variable: `ANTHROPIC_API_KEY`)
- [ ] Recevoir clé Brave (variable: `BRAVE_API_KEY`)
- [ ] Injecter dans `.env` temporaire
- [ ] Vérifier connexions API

**Pendant les tests:**
- [ ] Tester 5 contrats avec recherche web
- [ ] Valider scores confiance
- [ ] Vérifier citations sources

**Après les tests:**
- [ ] Supprimer clés du fichier .env
- [ ] Nettoyer historique terminal
- [ ] Révoquer clés temporaires (si possible)

---

## 🔒 SÉCURITÉ - PROTOCOLE JOUR J

### 1. **Injection Temporaire**
```bash
# Méthode sécurisée (pas dans git)
export ANTHROPIC_API_KEY="sk-ant-..."
export BRAVE_API_KEY="BSAM..."

# Ou fichier .env.local (non versionné)
cp .env .env.local
# Éditer .env.local avec les clés
# Ne JAMAIS commiter .env.local
```

### 2. **Nettoyage Post-Tests**
```bash
# Supprimer traces
unset ANTHROPIC_API_KEY
unset BRAVE_API_KEY
rm .env.local
history -c  # Nettoyer historique bash
```

### 3. **Vérification Aucune Fuite**
```bash
# Vérifier pas de clés dans git
git log --all --source --remotes --grep="ANTHROPIC"
git log --all --source --remotes --grep="BRAVE"

# Vérifier pas dans fichiers
grep -r "sk-ant" . --exclude-dir=.git || echo "OK"
grep -r "BSAMv1" . --exclude-dir=.git || echo "OK"
```

---

## 💰 COÛT ESTIMÉ TESTS

| Service | Unité | Qté estimée | Coût total |
|---------|-------|-------------|------------|
| Anthropic Claude | /1M tokens | ~50K tokens | ~$0.50 |
| Brave Search | /1000 req | ~20 requêtes | $0 (free tier) |
| **TOTAL** | | | **~0.50€** |

---

## 🎯 SCÉNARIO TEST JOUR J

1. **09:00** - Recevoir clés de Guillaume
2. **09:05** - Injecter clés temporairement
3. **09:10** - Test API healthcheck
4. **09:15** - Test contrat 1 (prestation déséquilibrée)
5. **09:30** - Test contrat 2 (CGV e-commerce)
6. **09:45** - Test contrat 3 (licence américaine)
7. **10:00** - Test contrat 4 (travail abusif)
8. **10:15** - Test contrat 5 (franchise)
9. **10:30** - Analyse résultats (scores, sources, temps)
10. **10:45** - Rapport final
11. **11:00** - Suppression clés + nettoyage

---

## 📧 RAPPEL À ENVOYER À GUILLAUME

**Objet:** Clés API pour tests AI Contract Guardian - 5 février

**Message:**
```
Salut Guillaume,

Pour les tests de demain (5 fév), j'aurai besoin des clés API suivantes :

1. **ANTHROPIC_API_KEY** (Claude pour l'analyse)
   → Format: sk-ant-api03-...
   → Coût estimé: ~0.50€ pour 5 tests

2. **BRAVE_API_KEY** (Recherche web Légifrance)
   → Format: BSAMv1...
   → Gratuit (2000 req/mois)

Les clés seront :
- ✅ Utilisées uniquement pendant les tests (~2h)
- ✅ Stockées temporairement (pas dans git)
- ✅ Supprimées immédiatement après
- ✅ Jamais partagées ou loggées

Merci !
Sage
```

---

*Document créé le 4 février 2026*  
*Dernière mise à jour: 22h15*