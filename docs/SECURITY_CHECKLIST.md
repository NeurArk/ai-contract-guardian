# Security Review Checklist (OWASP Top Risks)

Checklist actionable pour **AI Contract Guardian**. À réviser à chaque release.

## A01 — Broken Access Control
- [ ] Vérifier que **toutes** les routes sensibles sont protégées (auth + ownership).
- [ ] Valider les contrôles d’accès par ressource (ex: contrats: owner_id == user_id).
- [ ] Interdire l’énumération d’IDs (retours 404 génériques).
- [ ] S’assurer que `/api/v1/contracts/*` ne renvoie jamais d’objets d’autres users.

## A02 — Cryptographic Failures
- [ ] **SECRET_KEY** unique et robuste (env prod) + rotation planifiée.
- [ ] HTTPS forcé en prod (reverse proxy / load balancer).
- [ ] Vérifier chiffrement stockage (volumes/DB) si données sensibles.
- [ ] Ne jamais logger tokens/PII en clair.

## A03 — Injection
- [ ] Utiliser uniquement ORM/paramètres (pas de SQL brut non contrôlé).
- [ ] Valider et sanitizer les champs “libres” (inputs text, metadata).
- [ ] Vérifier les prompts/inputs envoyés aux LLMs (pas d’injection indirecte).

## A04 — Insecure Design
- [ ] Définir un modèle de menace minimal (auth, uploads, API externes).
- [ ] Limiter surface d’attaque: endpoints nécessaires seulement.
- [ ] Définir des limites (rate limit, taille upload, timeouts).

## A05 — Security Misconfiguration
- [ ] `DEBUG=False` en prod.
- [ ] CORS restreint (origins connus).
- [ ] Headers de sécurité activés (CSP, HSTS, X-Frame-Options, etc.).
- [ ] Supprimer routes de debug/tests en prod.

## A06 — Vulnerable & Outdated Components
- [ ] Audit dépendances (pip-audit / safety / npm audit).
- [ ] Mise à jour régulière des deps critiques.
- [ ] Verrouiller versions (requirements.txt / poetry.lock).

## A07 — Identification & Authentication Failures
- [ ] Rate limiting sur `/auth/login` et `/auth/register` (IP + email).
- [ ] Mots de passe forts + hashing (bcrypt/argon2) + policy.
- [ ] Tokens avec TTL court + refresh rotation.
- [ ] Option MFA/SSO à évaluer si besoin.

## A08 — Software & Data Integrity Failures
- [ ] Vérifier intégrité des uploads (extensions + size + type MIME).
- [ ] Signature/contrôle des artefacts de build (CI).
- [ ] Désactiver exécution de fichiers uploadés.

## A09 — Security Logging & Monitoring Failures
- [ ] Journaliser les events auth (login fail/success, reset, lockout).
- [ ] Alertes sur anomalies (pics de 401/429).
- [ ] Retention des logs et accès restreint.

## A10 — SSRF & External Service Risks
- [ ] Valider toute URL externe (allowlist si possible).
- [ ] Timeouts stricts pour appels API externes.
- [ ] Protéger clés API (env vars + vault).

---

## Points spécifiques projet
- [ ] **Uploads**: limiter extensions + taille + scan antivirus si possible.
- [ ] **LLM**: filtrer informations sensibles avant envoi à l’API.
- [ ] **RGPD**: suppression des données sur demande + rétention.
- [ ] **Backups**: rotation + test de restauration périodique.
