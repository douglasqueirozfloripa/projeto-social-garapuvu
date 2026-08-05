# Testes de ESCRITA e LEITURA de arquivos (o diferencial) — usa tmp_path do pytest.
from src import arquivos

def test_json_ida_e_volta(tmp_path):
    caminho = tmp_path / "metricas.json"       # arquivo temporário só deste teste
    dado = {"f1": 0.81, "total": 250}
    arquivos.salvar_json(dado, caminho)
    assert caminho.exists()
    assert arquivos.ler_json(caminho) == dado  # o que gravou é igual ao que leu

def test_csv_ida_e_volta(tmp_path):
    caminho = tmp_path / "previsoes.csv"
    linhas = [{"id": "1", "churn": "Sim"}, {"id": "2", "churn": "Nao"}]
    arquivos.salvar_csv(linhas, caminho)
    lido = arquivos.ler_csv(caminho)
    assert lido == linhas

def test_ler_arquivo_linha_a_linha(tmp_path):
    caminho = tmp_path / "notas.txt"
    caminho.write_text("linha 1\nlinha 2\nlinha 3\n", encoding="utf-8")
    linhas = caminho.read_text(encoding="utf-8").splitlines()
    assert linhas == ["linha 1", "linha 2", "linha 3"]
