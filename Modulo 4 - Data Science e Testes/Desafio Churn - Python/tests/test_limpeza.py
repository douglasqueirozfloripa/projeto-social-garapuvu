# Testes UNITÁRIOS e PARAMETRIZADOS da limpeza/preparação.
import pytest
from src import limpeza

@pytest.mark.parametrize("entrada,esperado", [
    (" basico ", "Basico"),
    ("PREMIUM", "Premium"),
    ("padrao", "Padrao"),
])
def test_padroniza_plano(entrada, esperado):
    assert limpeza.padroniza_plano(entrada) == esperado

def test_para_numerico_converte_tipos_e_alvo(cliente_alto_risco):
    out = limpeza.para_numerico(cliente_alto_risco)
    assert out["tempo_casa_meses"] == 2
    assert out["valor_mensal"] == 150.0
    assert out["cancelou"] == 1          # 'Sim' vira 1

def test_prepara_lista(cliente_alto_risco, cliente_baixo_risco):
    out = limpeza.prepara([cliente_alto_risco, cliente_baixo_risco])
    assert len(out) == 2
    assert out[1]["cancelou"] == 0       # 'Nao' vira 0
