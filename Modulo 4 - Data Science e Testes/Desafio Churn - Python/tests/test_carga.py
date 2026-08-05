# Testes de CARGA / STRESS com RAMPA (aumento gradual do uso) e concorrência.
import time
from concurrent.futures import ThreadPoolExecutor
import pytest
from src import dados, processamento

@pytest.mark.carga
def test_carga_concorrente(caminho_csv):
    """Vários 'usuários' processando lotes ao mesmo tempo, sem erros."""
    linhas = dados.carregar(caminho_csv)
    def tarefa(_):
        return len(processamento.processa_lote(linhas))
    with ThreadPoolExecutor(max_workers=8) as pool:
        resultados = list(pool.map(tarefa, range(50)))  # 50 lotes concorrentes
    assert all(r == len(linhas) for r in resultados)
    assert len(resultados) == 50

@pytest.mark.carga
def test_rampa_de_uso(caminho_csv):
    """Rampa: aumenta a carga (250 -> 2.500 -> 25.000 previsões) e mede o tempo."""
    base = dados.carregar(caminho_csv)
    tempos = {}
    for fator in (1, 10, 100):
        lote = base * fator                      # replica o dataset para simular mais uso
        inicio = time.perf_counter()
        processamento.processa_lote(lote)
        tempos[len(lote)] = time.perf_counter() - inicio
    # sanidade: nenhum nível pode estourar um orçamento generoso
    for n, t in tempos.items():
        assert t < 3.0, f"{n} previsões levaram {t:.3f}s"
    # o sistema deve escalar de forma razoável (não explodir de forma não-linear)
    maior = max(tempos, key=lambda k: tempos[k])
    assert tempos[maior] < 3.0
