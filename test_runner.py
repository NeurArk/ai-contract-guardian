#!/usr/bin/env python3
"""Test rapide AI Contract Guardian - 5 contrats"""

import os
import json
import asyncio
from datetime import datetime

# Configuration des clés API (à fournir via variables d'environnement)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
BRAVE_API_KEY = os.getenv("BRAVE_API_KEY")

if not ANTHROPIC_API_KEY:
    raise RuntimeError(
        "ANTHROPIC_API_KEY manquante. Exécutez: export ANTHROPIC_API_KEY=..."
    )

# Installation des dépendances si nécessaire
import subprocess
subprocess.run(['pip3', 'install', '-q', 'anthropic', 'httpx'], check=False)

from anthropic import AsyncAnthropic

# Initialisation client
client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

# Liste des contrats à tester
CONTRACTS = [
    ("contrat-prestation-desequilibre.txt", "Pénalité abusive 15%/jour"),
    ("CGV-ecommerce.txt", "Droit rétractation 7j"),
    ("licence-logiciel-americain.txt", "Juridiction Californie"),
    ("contrat-travail-abusif.txt", "48h/semaine + non-concurrence"),
    ("contrat-franchise.txt", "Exclusivité 500m"),
]

SYSTEM_PROMPT = """Tu es un expert juridique français spécialisé en droit des contrats pour TPE/PME.

MISSION: Analyser le contrat fourni et identifier:
1. Les clauses abusives ou déséquilibrées
2. Les risques juridiques majeurs
3. Les points de vigilance spécifiques au droit français

FORMAT DE RÉPONSE (JSON strict):
{
  "risques": [
    {
      "clause": "description de la clause",
      "probleme": "explication du risque",
      "severite": "CRITIQUE/HAUTE/MOYENNE/FAIBLE",
      "recommandation": "action corrective suggérée"
    }
  ],
  "score_conformite": 0-100,
  "resume": "Synthèse en 2 phrases"
}

RÈGLES:
- Base-toi sur le Code civil français (articles 1101 et suivants)
- Mentionne les articles pertinents
- Sois précis et actionnable"""

async def analyze_contract(file_path, description):
    """Analyse un contrat avec Claude."""
    print(f"\n{'='*60}")
    print(f"📄 TEST: {description}")
    print(f"Fichier: {file_path}")
    print('='*60)
    
    # Lecture du contrat
    with open(file_path, 'r', encoding='utf-8') as f:
        contract_text = f.read()
    
    print(f"Longueur: {len(contract_text)} caractères")
    print("⏳ Analyse en cours avec Claude...")
    
    start_time = datetime.now()
    
    try:
        response = await client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            temperature=0.1,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Analyse ce contrat et identifie les risques juridiques:\n\n{contract_text}"
            }]
        )
        
        duration = (datetime.now() - start_time).total_seconds()
        
        # Extraction JSON
        content = response.content[0].text
        
        # Cherche le JSON dans la réponse
        try:
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(content[json_start:json_end])
            else:
                result = {"erreur": "Pas de JSON trouvé", "raw": content}
        except json.JSONDecodeError:
            result = {"erreur": "JSON invalide", "raw": content[:500]}
        
        print(f"✅ Analyse terminée en {duration:.1f}s")
        print(f"🎯 Score conformité: {result.get('score_conformite', 'N/A')}/100")
        print(f"⚠️  Risques identifiés: {len(result.get('risques', []))}")
        
        # Affiche les risques
        for i, risque in enumerate(result.get('risques', [])[:3], 1):
            print(f"\n  {i}. [{risque.get('severite', '?')}] {risque.get('clause', 'N/A')[:60]}...")
        
        return {
            "success": True,
            "duration": duration,
            "result": result,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens
        }
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return {"success": False, "error": str(e)}

async def main():
    """Lance tous les tests."""
    print("🚀 AI CONTRACT GUARDIAN - TESTS JOUR J")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔑 API Anthropic: {'✅ Configurée' if ANTHROPIC_API_KEY else '❌ Manquante'}")
    print(f"🔑 API Brave: {'✅ Configurée' if BRAVE_API_KEY else '⚠️ Non configurée'}")
    
    results = []
    
    for filename, description in CONTRACTS:
        file_path = f"test-contracts/{filename}"
        result = await analyze_contract(file_path, description)
        results.append({"contract": filename, **result})
    
    # Rapport final
    print("\n" + "="*60)
    print("📊 RAPPORT FINAL")
    print("="*60)
    
    success_count = sum(1 for r in results if r.get('success'))
    total_duration = sum(r.get('duration', 0) for r in results if r.get('success'))
    total_input = sum(r.get('input_tokens', 0) for r in results)
    total_output = sum(r.get('output_tokens', 0) for r in results)
    
    print(f"\n✅ Tests réussis: {success_count}/{len(CONTRACTS)}")
    print(f"⏱️  Durée totale: {total_duration:.1f}s")
    print(f"📝 Tokens entrée: {total_input}")
    print(f"📝 Tokens sortie: {total_output}")
    print(f"💰 Coût estimé: ${(total_input * 3 + total_output * 15) / 1_000_000:.3f}")
    
    # Sauvegarde résultats
    with open('test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n💾 Résultats sauvegardés: test_results.json")

if __name__ == "__main__":
    asyncio.run(main())
