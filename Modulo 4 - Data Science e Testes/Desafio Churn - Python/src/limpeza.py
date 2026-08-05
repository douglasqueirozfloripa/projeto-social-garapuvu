# limpeza.py — Padronização e preparação das features (funções puras e testáveis).

def padroniza_plano(valor):
    """Tira espaços e padroniza a capitalização do plano. Ex.: ' basico ' -> 'Basico'."""
    return str(valor).strip().capitalize()

def para_numerico(linha):
    """Converte os campos de texto do CSV para números (o CSV vem tudo como string)."""
    return {
        "tempo_casa_meses": int(linha["tempo_casa_meses"]),
        "valor_mensal": float(linha["valor_mensal"]),
        "uso_gb": float(linha["uso_gb"]),
        "chamados_suporte": int(linha["chamados_suporte"]),
        "plano": padroniza_plano(linha["plano"]),
        "cancelou": 1 if linha["cancelou"] == "Sim" else 0,
    }

def prepara(linhas):
    """Prepara a lista de clientes para o modelo (converte tipos e o alvo)."""
    return [para_numerico(l) for l in linhas]
