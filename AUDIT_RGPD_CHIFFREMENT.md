# AUDIT RGPD & CHIFFREMENT - AI Contract Guardian

**Date:** 4 Février 2026  
**Auditeur:** Sage  
**Status:** Pré-lancement - Vérification conformité RGPD

---

## 📋 RÉSUMÉ EXÉCUTIF

| Domaine | Statut | Priorité | Action requise |
|---------|--------|----------|----------------|
| **Chiffrement transit** | 🟡 Partiel | Haute | Vérifier TLS 1.3 |
| **Chiffrement repos** | 🔴 Non implémenté | CRITIQUE | Implémenter AVANT launch |
| **Anonymisation données** | 🟡 Partiel | Haute | Vérifier PII detection |
| **Droits utilisateurs** | 🟢 Implémenté | - | Endpoint delete account |
| **Durée conservation** | 🟢 Configuré | - | 90 jours configuré |
| **Registre traitement** | 🔴 Non créé | CRITIQUE | Créer AVANT launch |
| **DPO** | 🟡 À désigner | Moyenne | Selon volume données |

**🔴 ALERTE:** 3 points critiques doivent être résolus AVANT le lancement.

---

## 🔒 CHIFFREMENT - ÉTAT ACTUEL

### 1. Chiffrement en Transit (TLS/HTTPS)

**✅ Ce qui existe:**
- FastAPI avec HTTPS support natif
- Headers sécurité (HSTS prévu dans `security_middleware.py`)

**❌ Ce qui manque:**
- Configuration TLS 1.3 explicite
- Certificats SSL ( Let's Encrypt en production)
- Redirection HTTP → HTTPS forcée

**Implémentation requise:**
```python
# À ajouter dans main.py ou nginx config
# TLS 1.3 minimum
ssl_protocols TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
```

### 2. Chiffrement au Repos (Données stockées) 🔴 CRITIQUE

**❌ NON IMPLÉMENTÉ - RISQUE ÉLEVÉ**

Les données suivantes ne sont PAS chiffrées:
- Fichiers PDF uploadés (stockage local `/tmp/uploads`)
- Résultats d'analyse en base de données
- Données utilisateurs (emails, metadata)

**Solution recommandée - BEFORE LAUNCH:**

```python
# backend/app/core/encryption.py (À CRÉER)

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class DataEncryption:
    """Service de chiffrement pour données sensibles."""
    
    def __init__(self, master_key: str):
        """Initialise avec clé maître depuis env."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=os.environ.get('ENCRYPTION_SALT').encode(),
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Chiffre une chaîne."""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted: str) -> str:
        """Déchiffre une chaîne."""
        return self.cipher.decrypt(encrypted.encode()).decode()
    
    def encrypt_file(self, file_path: Path) -> Path:
        """Chiffre un fichier."""
        with open(file_path, 'rb') as f:
            data = f.read()
        encrypted = self.cipher.encrypt(data)
        encrypted_path = file_path.with_suffix('.enc')
        with open(encrypted_path, 'wb') as f:
            f.write(encrypted)
        return encrypted_path

# Utilisation
encryption = DataEncryption(settings.ENCRYPTION_MASTER_KEY)

# Chiffrer résultat analyse avant stockage
encrypted_results = encryption.encrypt(json.dumps(analysis_results))

# Chiffrer fichier PDF
encrypted_file = encryption.encrypt_file(uploaded_pdf)
```

**Variables .env à ajouter:**
```bash
# Chiffrement
ENCRYPTION_MASTER_KEY=generate-with-openssl-rand-base64-32
ENCRYPTION_SALT=generate-random-salt-16-bytes
```

### 3. Anonymisation avant envoi LLM

**🟡 PARTIELLEMENT IMPLÉMENTÉ**

Existe dans `legal_search.py` mais PAS intégré dans le flux:
```python
# Détection PII (existe mais non utilisée)
PII_PATTERNS = {
    "siret": r"\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b0\d{9}\b",
}
```

**Implémentation manquante:**
- Anonymisation AVANT envoi à Claude API
- Remplacement des noms de parties par [PARTY_A], [PARTY_B]
- Hashage des données sensibles en DB

**À implémenter:**
```python
# backend/app/core/pii_anonymizer.py

import re
import hashlib
from typing import Tuple

class PIIAnonymizer:
    """Anonymise les données sensibles avant envoi LLM."""
    
    PATTERNS = {
        "email": (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL_{id}]"),
        "phone": (r"\b0\d{9}\b", "[PHONE_{id}]"),
        "siret": (r"\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b", "[SIRET_{id}]"),
        "siren": (r"\b\d{3}\s?\d{3}\s?\d{3}\b", "[SIREN_{id}]"),
        "amount": (r"\b\d{1,3}(?:\s?\d{3})*\s?(?:€|EUR|euros?)\b", "[MONTANT_{id}]"),
    }
    
    def anonymize(self, text: str) -> Tuple[str, dict]:
        """
        Anonymise le texte et retourne mapping pour reconstruction.
        
        Returns:
            (texte_anonymisé, mapping_hash→valeur_réelle)
        """
        mapping = {}
        anonymized = text
        
        for pii_type, (pattern, replacement_template) in self.PATTERNS.items():
            matches = re.finditer(pattern, anonymized, re.IGNORECASE)
            for i, match in enumerate(matches):
                original = match.group(0)
                # Hash pour mapping
                hash_key = hashlib.sha256(original.encode()).hexdigest()[:8]
                placeholder = replacement_template.format(id=hash_key[:4])
                
                mapping[placeholder] = original
                anonymized = anonymized.replace(original, placeholder, 1)
        
        return anonymized, mapping
```

---

## 📊 REGISTRE DES ACTIVITÉS DE TRAITEMENT (RAT) 🔴 CRITIQUE

**❌ NON CRÉÉ - OBLIGATION LÉGALE RGPD**

Article 30 RGPD: Obligation de tenir un registre des activités de traitement.

**Document à créer AVANT launch:**

```markdown
# REGISTRE DES ACTIVITÉS DE TRAITEMENT
**Responsable:** AI Contract Guardian / NeurArk  
**DPO:** [À désigner]  
**Date création:** 2026-02-05

## Traitement n°1: Analyse contractuelle

| Champ | Valeur |
|-------|--------|
| **Finalité** | Analyse automatisée de contrats pour TPE/PME |
| **Catégories données** | Données contractuelles, emails utilisateurs, métadonnées |
| **Catégories personnes** | Utilisateurs (chefs d'entreprise) |
| **Destinataires** | Prestataire IA (Anthropic), hébergeur (Hetzner) |
| **Transfert hors UE** | USA (Anthropic) - encadrement par DPA |
| **Durée conservation** | 90 jours puis suppression automatique |
| **Mesures sécurité** | Chiffrement AES-256, accès restreint, logs |
| **DPIA** | Oui - traitement à haut risque (IA) |

## Traitement n°2: Authentification

| Champ | Valeur |
|-------|--------|
| **Finalité** | Gestion des comptes utilisateurs |
| **Catégories données** | Email, hash mot de passe, logs connexion |
| **Durée conservation** | Durée du compte + 1 an |
```

---

## 👤 DROITS DES UTILISATEURS

### ✅ Implémenté
- **Droit d'accès:** Endpoint `/auth/me` existant
- **Droit de rectification:** À faire manuellement (pas d'endpoint)
- **Droit à l'effacement:** Endpoint DELETE à créer
- **Droit à la portabilité:** Export JSON à implémenter

### À compléter AVANT launch:

```python
# backend/app/api/users.py

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Supprime le compte utilisateur et toutes ses données (RGPD)."""
    
    # 1. Supprime les analyses
    await db.execute(
        delete(Analysis).where(Analysis.contract_id.in_(
            select(Contract.id).where(Contract.user_id == current_user_id)
        ))
    )
    
    # 2. Supprime les contrats
    await db.execute(
        delete(Contract).where(Contract.user_id == current_user_id)
    )
    
    # 3. Supprime l'utilisateur
    await db.execute(
        delete(User).where(User.id == current_user_id)
    )
    
    await db.commit()

@router.get("/me/export", response_model=dict)
async def export_data(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Exporte toutes les données personnelles (portabilité RGPD)."""
    
    # Récupère toutes les données
    user = await db.get(User, current_user_id)
    contracts = await db.execute(
        select(Contract).where(Contract.user_id == current_user_id)
    )
    analyses = await db.execute(
        select(Analysis).where(Analysis.contract_id.in_(
            [c.id for c in contracts.scalars().all()]
        ))
    )
    
    return {
        "user": user.dict(),
        "contracts": [c.dict() for c in contracts.scalars().all()],
        "analyses": [a.dict() for a in analyses.scalars().all()],
        "export_date": datetime.utcnow().isoformat(),
    }
```

---

## 📅 DURÉES DE CONSERVATION

| Type de donnée | Durée | Configuration | Status |
|----------------|-------|---------------|--------|
| Contrats (PDF) | 90 jours | ✅ `CONTRACT_RETENTION_DAYS=90` | Configuré |
| Analyses | 90 jours | ✅ Même paramètre | Configuré |
| Comptes inactifs | 2 ans | ❌ Non implémenté | À ajouter |
| Logs connexion | 1 an | ❌ Non implémenté | À ajouter |
| Données compta | 10 ans | ✅ Obligation légale | À prévoir |

**Cron de suppression automatique À IMPLÉMENTER:**
```python
# backend/app/tasks/cleanup.py

@app.task
def cleanup_expired_data():
    """Supprime les données expirées (RGPD)."""
    retention_days = settings.CONTRACT_RETENTION_DAYS
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
    
    # Supprime contrats expirés
    db.execute(
        delete(Contract).where(Contract.created_at < cutoff_date)
    )
    
    # Supprime analyses orphelines
    db.execute(
        delete(Analysis).where(Analysis.created_at < cutoff_date)
    )
```

---

## 🌐 TRANSFERTS HORS UE

### 1. Anthropic (États-Unis)

**Statut:** Transfert vers pays tiers (USA)  
**Fondement:** Clauses Contractuelles Types (CCT) + DPA (Data Processing Addendum)  
**Action requise:**
- ✅ Signer DPA avec Anthropic
- ✅ Mentionner dans politique confidentialité
- ✅ Informer utilisateurs

### 2. Hetzner (Allemagne)

**Statut:** UE (Allemagne) - Pas de transfert  
✅ Conforme

---

## ✅ CHECKLIST RGPD PRÉ-LANCEMENT

### 🔴 OBLIGATOIRES (bloquant)

- [ ] **Chiffrement au repos** implémenté (fichiers + DB)
- [ ] **Registre des traitements** créé et signé
- [ ] **DPA Anthropic** signé et archivé
- [ ] **Endpoint suppression compte** (`DELETE /users/me`)
- [ ] **Politique confidentialité** rédigée et publiée
- [ ] **Bannière cookies** (si cookies analytics)

### 🟡 IMPORTANTES (fortement recommandé)

- [ ] **Anonymisation PII** avant envoi LLM
- [ ] **Export données** (`GET /users/me/export`)
- [ ] **DPO désigné** (si > 5000 utilisateurs/an)
- [ ] **PIA** (Privacy Impact Assessment) réalisé
- [ ] **Sous-traitants** listés avec contrats

### 🟢 SECONDaires (post-launch OK)

- [ ] **Cookie consent** détaillé
- [ ] **Registre incidents** créé
- [ ] **Formation équipe** RGPD
- [ ] **Audit annuel** programmé

---

## 🎯 ACTIONS AVANT LANCEMENT

### Priorité 1 (Cette semaine)
1. **Implémenter chiffrement** `backend/app/core/encryption.py`
2. **Créer registre traitements** `REGISTRE_RGPD.md`
3. **Signer DPA Anthropic** (en ligne sur leur site)
4. **Ajouter endpoints RGPD** (delete, export)

### Priorité 2 (Avant première vente)
5. **Rédiger politique confidentialité** page dédiée
6. **Implémenter anonymisation PII**
7. **Configurer cron suppression auto**

---

## 💰 IMPACT BUDGET

| Action | Coût | Urgence |
|--------|------|---------|
| Chiffrement (dev) | 4-6h | 🔴 CRITIQUE |
| DPA Anthropic | Gratuit | 🔴 CRITIQUE |
| Politique confidentialité | 2h | 🔴 CRITIQUE |
| DPO externe (si besoin) | 500-2000€/an | 🟡 Moyenne |

---

## 📝 CONCLUSION

**3 points CRITIQUES bloquants pour le lancement:**

1. 🔴 **Chiffrement au repos NON IMPLÉMENTÉ**
   - Risque: Fuite données si accès serveur
   - Solution: Implémenter encryption.py

2. 🔴 **Registre traitements NON CRÉÉ**
   - Risque: Non-conformité RGPD, amende
   - Solution: Créer document REGISTRE_RGPD.md

3. 🔴 **DPA Anthropic NON SIGNÉ**
   - Risque: Transfert données illégal
   - Solution: Signer en ligne

**Délai estimé résolution:** 1-2 jours de dev

---

*Audit réalisé le 4 février 2026*  
*Prochaine révision: Post-implémentation chiffrement*