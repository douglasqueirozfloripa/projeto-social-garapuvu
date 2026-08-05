# Teste do MODELO por MÉTRICA COM LIMIAR (como em Data Science: não é 'passou/falhou').
from src import dados, modelo

def test_baseline_atinge_f1_minimo(caminho_csv):
    linhas = dados.carregar(caminho_csv)
    m = modelo.avaliar(linhas)
    # O baseline por regras deve ter um F1 razoável. O desafio "para ir além"
    # é superar este número com um modelo de scikit-learn.
    assert m["f1"] >= 0.60, f"F1 baixo demais: {m}"

def test_cliente_alto_risco_preve_sim(cliente_alto_risco):
    assert modelo.prever_regra(cliente_alto_risco) == "Sim"

def test_cliente_baixo_risco_preve_nao(cliente_baixo_risco):
    assert modelo.prever_regra(cliente_baixo_risco) == "Nao"
