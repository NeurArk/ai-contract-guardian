"""Analysis tasks.

Ce module contient les tâches Celery pour l'analyse des contrats.
"""

import asyncio
from uuid import UUID

from celery import Task
from celery.exceptions import MaxRetriesExceededError
from sqlalchemy import select

from app.celery_app import celery_app
from app.models import Contract, Analysis, AnalysisStatus, ContractStatus
from app.services.text_extractor import extract_text


class DatabaseTask(Task):
    """Tâche Celery avec accès à la base de données."""
    
    _db_session = None
    
    def after_return(self, *args, **kwargs):
        """Ferme la session DB après l'exécution."""
        if self._db_session:
            asyncio.run(self._db_session.close())
            self._db_session = None


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def analyze_contract(self: Task, contract_id: str) -> dict:
    """Tâche d'analyse d'un contrat.
    
    Cette tâche:
    1. Extrait le texte du contrat
    2. Envoie le texte à Claude pour analyse
    3. Stocke les résultats en base de données
    
    Args:
        contract_id: ID du contrat à analyser (UUID string)
        
    Returns:
        Les résultats de l'analyse
    """
    import asyncio
    
    return asyncio.run(_analyze_contract_async(self, contract_id))


async def _analyze_contract_async(task: Task, contract_id: str) -> dict:
    """Version asynchrone de l'analyse de contrat."""
    from app.db.session import AsyncSessionLocal
    from app.services.claude_service import analyze_contract_with_claude
    
    async with AsyncSessionLocal() as db:
        try:
            # Récupère le contrat
            result = await db.execute(
                select(Contract).where(Contract.id == UUID(contract_id))
            )
            contract = result.scalar_one_or_none()
            
            if not contract:
                raise ValueError(f"Contrat {contract_id} non trouvé")
            
            # Récupère ou crée l'analyse
            result = await db.execute(
                select(Analysis).where(Analysis.contract_id == UUID(contract_id))
            )
            analysis = result.scalar_one_or_none()
            
            if not analysis:
                analysis = Analysis(contract_id=UUID(contract_id))
                db.add(analysis)
            
            # Met à jour le statut
            analysis.status = AnalysisStatus.PROCESSING
            contract.status = ContractStatus.PROCESSING
            await db.commit()
            
            # Extrait le texte du contrat
            try:
                contract_text = extract_text(contract.file_path, contract.file_type)
            except Exception as e:
                raise ValueError(f"Erreur d'extraction du texte: {e}")
            
            # Analyse avec Claude
            try:
                results = await analyze_contract_with_claude(contract_text)
            except Exception as e:
                # Si pas de clé API, on simule une analyse pour les tests
                if "non configurée" in str(e):
                    results = _generate_mock_analysis(contract_text)
                else:
                    raise
            
            # Met à jour l'analyse avec les résultats
            analysis.status = AnalysisStatus.COMPLETED
            analysis.results = results
            analysis.score_equity = results.get("score_equity")
            analysis.score_clarity = results.get("score_clarity")
            
            contract.status = ContractStatus.COMPLETED
            
            await db.commit()
            
            return {
                "contract_id": contract_id,
                "status": "completed",
                "score_equity": analysis.score_equity,
                "score_clarity": analysis.score_clarity,
            }
            
        except Exception as exc:
            # Met à jour le statut d'erreur
            try:
                result = await db.execute(
                    select(Analysis).where(Analysis.contract_id == UUID(contract_id))
                )
                analysis = result.scalar_one_or_none()
                if analysis:
                    analysis.status = AnalysisStatus.FAILED
                    analysis.error_message = str(exc)
                
                result = await db.execute(
                    select(Contract).where(Contract.id == UUID(contract_id))
                )
                contract = result.scalar_one_or_none()
                if contract:
                    contract.status = ContractStatus.FAILED
                
                await db.commit()
            except Exception:
                pass
            
            # Retry si possible
            try:
                task.retry(exc=exc, countdown=60)
            except MaxRetriesExceededError:
                return {
                    "contract_id": contract_id,
                    "status": "failed",
                    "error": str(exc),
                }
            
            raise


def _generate_mock_analysis(contract_text: str) -> dict:
    """Génère une analyse simulée pour les tests sans clé API.
    
    Args:
        contract_text: Texte du contrat
        
    Returns:
        Résultats d'analyse simulés
    """
    # Analyse simple basée sur la longueur et le contenu
    text_lower = contract_text.lower()
    
    # Détecte des termes à risque
    risk_terms = ["pénalité", "résiliation", "exclusivité", "non concurrence", "garantie"]
    detected_risks = []
    
    for term in risk_terms:
        if term in text_lower:
            detected_risks.append({
                "severity": "medium",
                "description": f"Clause contenant '{term}' détectée",
                "clause": f"Mention de {term} dans le contrat"
            })
    
    if not detected_risks:
        detected_risks = [
            {
                "severity": "low",
                "description": "Aucun risque majeur détecté dans cette analyse automatique",
                "clause": "Général"
            }
        ]
    
    # Scores basés sur la complexité
    text_length = len(contract_text)
    if text_length < 1000:
        clarity_score = 85
        equity_score = 75
    elif text_length < 5000:
        clarity_score = 70
        equity_score = 65
    else:
        clarity_score = 60
        equity_score = 60
    
    return {
        "summary": f"Contrat de {text_length} caractères analysé. Analyse automatique sans IA (mode test).",
        "risks": detected_risks[:3],
        "recommendations": [
            "Faire relire le contrat par un juriste pour validation finale",
            "Vérifier que toutes les clauses essentielles sont présentes"
        ],
        "key_clauses": [
            {
                "name": "Clause principale",
                "content": "Objet du contrat",
                "importance": "critical"
            }
        ],
        "unfair_terms": [],
        "score_equity": equity_score,
        "score_clarity": clarity_score,
        "missing_clauses": [],
    }
