# processamento.py — Processa lotes de clientes. Usado nos testes de performance e carga.
from .modelo import prever_regra

def processa_lote(linhas):
    """Prevê o churn para uma lista de clientes. Retorna a lista de previsões."""
    return [prever_regra(l) for l in linhas]
