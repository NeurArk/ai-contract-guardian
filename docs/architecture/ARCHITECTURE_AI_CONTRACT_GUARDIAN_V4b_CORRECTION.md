# ARCHITECTURE_AI_CONTRACT_GUARDIAN_V4b.md

**CORRECTION:** Ce fichier corrige l'erreur de temporalité de la V4  
**Date recherche:** 4 Février 2026 - 19:40 CET  
**Source:** Web search fresh (past day)

---

## ⚠️ CORRECTIONS MAJEURES par rapport à V4

### Erreur corrigée #1: Versions OpenAI obsolètes

**❌ V4 disait:** GPT-4.1 comme fallback
**✅ Réalité (4 fév 2026):**
- **GPT-5.2** est la version actuelle (OpenAI a fait 40% perf upgrade hier 3 fév)
- GPT-4, GPT-4o, GPT-4.1 sont obsolètes (retirés ChatGPT 13 fév 2026)

### Versions LLM ACTUELLES (vérifiées 4 fév 2026)

| Provider | Version | Contexte | Prix Input/Output | Source |
|----------|---------|----------|-------------------|--------|
| **OpenAI** | **GPT-5.2** | 1M+ tokens | À vérifier exact | EONMSK News, 3 fév 2026 |
| **OpenAI** | GPT-5.2-Codex | 1M+ tokens | À vérifier exact | EONMSK News, 3 fév 2026 |
| **Anthropic** | Claude Sonnet 4.5 | 200K | $3/$15 | Stable |
| **Anthropic** | Claude Sonnet 5 | 200K? | $3/$15? | Release imminente (cette semaine) |
| **Mistral** | Large 2 | 128K | $2/$6 | Stable EU |

### Stratégie corrigée

```
TIER 1 (Primary): Claude Sonnet 4.5 (stable, testé)
                  → Migrer vers Sonnet 5 dès release

TIER 2 (Fallback): GPT-5.2 (OpenAI, contexte massif)
                   → PAS GPT-4.1 (obsolète)

TIER 3 (RGPD): Mistral Large 2 (souveraineté EU)
```

---

## 🔍 LEÇON APRISE

**Erreur:** Architecture basée sur info non fraîche (GPT-4.1 mentionné alors que GPT-5.2 existe depuis hier)

**Cause:** Pas de vérification date avant recherche

**Solution mise en place:**
1. ✅ `AGENT_INSTRUCTIONS.md` - Règles vérification date obligatoire
2. ✅ Cron "auto-correction-nocturne" - Scan quotidien à 3h du matin
3. ✅ Checklist pré-recherche dans tous les skills

---

*Ce fichier remplace la section "Choix LLM" de l'architecture V4*