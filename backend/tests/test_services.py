import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.analysis_enhanced import analyze_contract_enhanced


@pytest.mark.asyncio
async def test_analyze_contract_basic():
    """Test basique du service d'analyse."""
    contract_text = """
    CONTRAT DE TEST
    
    Article 1: Pénalités de retard
    En cas de retard de paiement, une pénalité de 15% par jour sera appliquée.
    """
    
    # Mock du client Anthropic
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"risques": [{"clause": "Pénalité 15%", "severite": "CRITIQUE"}], "score_conformite": 20}')]
    mock_response.usage.input_tokens = 1000
    mock_response.usage.output_tokens = 500
    
    with patch('app.services.analysis_enhanced.anthropic_client.messages.create', new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_response
        
        result = await analyze_contract_enhanced(contract_text, use_web_search=False)
        
        assert result is not None
        assert "risques" in result
        mock_create.assert_called_once()
