# Teste com MOCK (monkeypatch): troca a fonte de dados por uma falsa, sem tocar no disco.
from src import dados, relatorio

def test_gerar_relatorio_com_dados_falsos(tmp_path, monkeypatch, cliente_alto_risco, cliente_baixo_risco):
    # substitui dados.carregar por uma versão que devolve um dataset controlado
    monkeypatch.setattr(dados, "carregar", lambda _caminho: [cliente_alto_risco, cliente_baixo_risco])
    saida = tmp_path / "rel.json"
    metricas = relatorio.gerar("qualquer.csv", saida)   # o caminho é ignorado pelo mock
    assert saida.exists()
    assert metricas["total"] == 2
    # o alto risco é 'Sim' e foi previsto 'Sim' -> 1 verdadeiro positivo
    assert metricas["tp"] == 1
