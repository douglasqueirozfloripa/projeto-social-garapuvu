# dados.py — Carregar e VALIDAR o dataset de churn (leitura de arquivo + regras).
import csv

COLUNAS = ["id", "tempo_casa_meses", "plano", "valor_mensal", "uso_gb", "chamados_suporte", "cancelou"]
PLANOS = {"Basico", "Padrao", "Premium"}

def carregar(caminho):
    """Lê o clientes.csv e devolve uma lista de dicionários (uma linha = um cliente)."""
    with open(caminho, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def validar(linhas):
    """Valida o schema e as faixas. Lança ValueError se algo estiver errado."""
    if not linhas:
        raise ValueError("dataset vazio")
    for i, l in enumerate(linhas, start=2):  # 2 = primeira linha de dados (depois do cabeçalho)
        if set(l.keys()) != set(COLUNAS):
            raise ValueError(f"colunas inválidas na linha {i}")
        if l["plano"] not in PLANOS:
            raise ValueError(f"plano inválido na linha {i}: {l['plano']}")
        if l["cancelou"] not in {"Sim", "Nao"}:
            raise ValueError(f"cancelou deve ser Sim/Nao na linha {i}")
        if float(l["valor_mensal"]) <= 0:
            raise ValueError(f"valor_mensal deve ser > 0 na linha {i}")
        if int(l["chamados_suporte"]) < 0:
            raise ValueError(f"chamados_suporte não pode ser negativo na linha {i}")
    return True
