# Testes de LEITURA DE ARQUIVO + VALIDAÇÃO (unit + parametrizado).
import pytest
from src import dados

def test_carregar_le_o_csv(caminho_csv):
    linhas = dados.carregar(caminho_csv)
    assert len(linhas) == 250                 # o arquivo tem 250 clientes
    assert set(linhas[0].keys()) == set(dados.COLUNAS)

def test_validar_dataset_correto(caminho_csv):
    linhas = dados.carregar(caminho_csv)
    assert dados.validar(linhas) is True

def test_validar_vazio_falha():
    with pytest.raises(ValueError):
        dados.validar([])

@pytest.mark.parametrize("campo,valor", [
    ("plano", "Ouro"),          # plano inexistente
    ("cancelou", "Talvez"),     # alvo inválido
    ("valor_mensal", "0"),      # valor <= 0
    ("chamados_suporte", "-1"), # negativo
])
def test_validar_linha_invalida_falha(cliente_baixo_risco, campo, valor):
    linha = dict(cliente_baixo_risco)
    linha[campo] = valor
    with pytest.raises(ValueError):
        dados.validar([linha])
