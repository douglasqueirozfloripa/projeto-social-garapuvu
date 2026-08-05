# Testes de PERFORMANCE e LATÊNCIA — medem tempo e comparam com um orçamento (budget).
import time
import pytest
from src import dados, modelo, processamento

@pytest.mark.performance
def test_latencia_de_uma_previsao(cliente_alto_risco):
    """Cada previsão deve ser rápida (latência baixa)."""
    inicio = time.perf_counter()
    for _ in range(1000):
        modelo.prever_regra(cliente_alto_risco)
    media_ms = (time.perf_counter() - inicio) / 1000 * 1000  # ms por previsão
    assert media_ms < 1.0, f"latência média alta: {media_ms:.4f} ms"

@pytest.mark.performance
def test_throughput_do_lote(caminho_csv):
    """Processar o dataset inteiro deve levar bem menos de 1 segundo."""
    linhas = dados.carregar(caminho_csv)
    inicio = time.perf_counter()
    resultado = processamento.processa_lote(linhas)
    duracao = time.perf_counter() - inicio
    assert len(resultado) == len(linhas)
    assert duracao < 1.0, f"lote demorou {duracao:.3f}s"
