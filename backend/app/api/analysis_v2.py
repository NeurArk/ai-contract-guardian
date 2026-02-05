"""API endpoints pour l'analyse contractuelle v2 (avec conformité FR).

Ce module expose les nouveaux endpoints d'analyse avec:
- Recherche de sources juridiques
- Score de confiance
- Disclaimer obligatoire
"""

from typing import Any, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlmodel import col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user_id
from app.core.legal_search import search_legal_sources
from app.db.session import get_db
from app.models import Contract, Analysis
from app.services.analysis_enhanced import analyze_contract_enhanced, verify_analysis_quality
from app.prompts.legal_analysis import get_disclaimer

router = APIRouter(prefix="/analysis/v2", tags=["analysis-v2"])


@router.post("/contracts/{contract_id}/analyze", response_model=dict[str, Any])
async def analyze_contract_v2(
    contract_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Lance une analyse contractuelle améliorée avec sources juridiques.

    Cette version v2 inclut:
    - Recherche automatique sur Légifrance et sources officielles
    - Score de confiance calculé
    - Citation obligatoire des articles de loi
    - Disclaimer légal
    - Vérification anti-hallucination

    Args:
        contract_id: ID du contrat à analyser
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données

    Returns:
        Analyse complète avec métadonnées de confiance

    Raises:
        HTTPException: Si contrat non trouvé ou erreur d'analyse
    """
    # Récupère le contrat
    result = await db.execute(
        select(Contract).where(
            col(Contract.id) == contract_id,
            col(Contract.user_id) == current_user_id,
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé",
        )

    # Vérifie que le statut permet l'analyse
    if contract.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce contrat a déjà échoué lors d'une analyse précédente",
        )

    # Récupère le texte du contrat (à adapter selon votre stockage)
    # Note: Supposons que vous avez une méthode pour extraire le texte
    contract_text = await _extract_contract_text(contract)

    if not contract_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'extraire le texte du contrat",
        )

    # Met à jour le statut
    contract.status = "processing"
    await db.commit()

    try:
        # Lance l'analyse améliorée
        analysis_result = await analyze_contract_enhanced(
            contract_text=contract_text,
            contract_id=str(contract_id),
            use_web_search=True,
        )

        # Vérifie la qualité de l'analyse
        quality_check = await verify_analysis_quality(analysis_result)

        # Ajoute les infos de qualité
        analysis_result["_quality_check"] = quality_check

        # Crée l'entrée Analysis en base
        analysis = Analysis(
            contract_id=contract_id,
            status="completed",
            results=analysis_result,
            score_equity=analysis_result.get("scores_globaux", {}).get("equilibre"),
            score_clarity=analysis_result.get("scores_globaux", {}).get("clarte"),
        )
        db.add(analysis)

        # Met à jour le contrat
        contract.status = "completed"
        await db.commit()
        await db.refresh(analysis)

        # Ajoute l'ID de l'analyse au résultat
        analysis_result["_analysis_id"] = str(analysis.id)
        analysis_result["_contract_id"] = str(contract_id)

        return analysis_result

    except Exception as e:
        # En cas d'erreur, met à jour le statut
        contract.status = "failed"
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse: {str(e)}",
        )


@router.get("/contracts/{contract_id}/analysis", response_model=dict[str, Any])
async def get_analysis_v2(
    contract_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Récupère l'analyse v2 d'un contrat.

    Args:
        contract_id: ID du contrat
        current_user_id: ID de l'utilisateur
        db: Session de base de données

    Returns:
        Analyse complète avec score de confiance
    """
    # Vérifie que le contrat appartient à l'utilisateur
    result = await db.execute(
        select(Contract).where(
            col(Contract.id) == contract_id,
            col(Contract.user_id) == current_user_id,
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat non trouvé",
        )

    # Récupère l'analyse
    result = await db.execute(select(Analysis).where(col(Analysis.contract_id) == contract_id))
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune analyse trouvée pour ce contrat",
        )

    # Retourne les résultats
    results = analysis.results or {}

    # S'assure que le disclaimer est toujours présent
    if not results.get("disclaimer"):
        results["disclaimer"] = get_disclaimer()

    return {
        "analysis_id": str(analysis.id),
        "contract_id": str(contract_id),
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "score_equity": analysis.score_equity,
        "score_clarity": analysis.score_clarity,
        "results": results,
    }


@router.post("/search-sources", response_model=dict[str, Any])
async def search_legal_sources_endpoint(
    clause_type: str,
    keywords: list[str] | None = None,
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Endpoint pour tester la recherche de sources juridiques.

    Args:
        clause_type: Type de clause (pénalité, résiliation, etc.)
        keywords: Mots-clés supplémentaires
        current_user_id: ID de l'utilisateur (authentification)

    Returns:
        Sources juridiques trouvées
    """
    try:
        results = await search_legal_sources(
            clause_type=clause_type,
            keywords=keywords or [],
            max_results=10,
        )
        return cast(dict[str, Any], results)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur recherche: {str(e)}",
        )


@router.get("/disclaimer")
async def get_legal_disclaimer() -> dict[str, str]:
    """Retourne le disclaimer légal complet.

    Returns:
        Texte du disclaimer
    """
    return {
        "disclaimer": get_disclaimer(),
        "version": "1.0",
        "last_updated": "2026-02-04",
    }


# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================


async def _extract_contract_text(contract: Contract) -> str | None:
    """Extrait le texte d'un contrat.

    À adapter selon votre méthode de stockage (PDF, DOCX, etc.)

    Args:
        contract: Objet Contract

    Returns:
        Texte extrait ou None
    """
    # TODO: Implémenter l'extraction selon votre stockage
    # Pour l'instant, retourne un placeholder

    # Exemple si vous stockez le texte en base:
    # return contract.extracted_text

    # Exemple si vous devez lire un fichier:
    # from app.core.pdf_parser import extract_text_from_pdf
    # return await extract_text_from_pdf(contract.file_path)

    return "Texte du contrat à extraire"
