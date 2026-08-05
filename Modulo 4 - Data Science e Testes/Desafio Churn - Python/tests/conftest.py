# conftest.py — Fixtures compartilhadas pelos testes.
import os
import pytest

AQUI = os.path.dirname(__file__)
CAMINHO_CSV = os.path.join(AQUI, "..", "clientes.csv")

@pytest.fixture
def caminho_csv():
    """Caminho do dataset real (clientes.csv) para os testes de leitura de arquivo."""
    return CAMINHO_CSV

@pytest.fixture
def cliente_alto_risco():
    """Um cliente com forte sinal de churn (pouco tempo, muitos chamados, valor alto)."""
    return {"id": "1", "tempo_casa_meses": "2", "plano": "Premium", "valor_mensal": "150.0",
            "uso_gb": "3.0", "chamados_suporte": "5", "cancelou": "Sim"}

@pytest.fixture
def cliente_baixo_risco():
    """Um cliente fiel (muito tempo de casa, sem chamados, uso alto)."""
    return {"id": "2", "tempo_casa_meses": "60", "plano": "Basico", "valor_mensal": "40.0",
            "uso_gb": "30.0", "chamados_suporte": "0", "cancelou": "Nao"}
