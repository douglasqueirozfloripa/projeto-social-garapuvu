# modelo.py — Um modelo BASELINE por regras (sem bibliotecas), para o desafio rodar
# na hora. O desafio "para ir além" é bater este F1 com um modelo de scikit-learn.

def pontua_risco(linha):
    """Score de risco de churn a partir dos sinais do cliente (quanto maior, mais risco)."""
    t = int(linha["tempo_casa_meses"])
    ch = int(linha["chamados_suporte"])
    v = float(linha["valor_mensal"])
    u = float(linha["uso_gb"])
    return (t < 12) * 2 + (t < 6) + ch + (v > 100) + (u < 5)

def prever_regra(linha, limiar=4):
    """Prevê 'Sim' (vai cancelar) se o risco atingir o limiar; senão 'Nao'."""
    return "Sim" if pontua_risco(linha) >= limiar else "Nao"

def avaliar(linhas, limiar=4):
    """Calcula precisão, recall e F1 do baseline sobre dados rotulados (coluna cancelou)."""
    tp = fp = fn = tn = 0
    for l in linhas:
        pred = prever_regra(l, limiar)
        real = l["cancelou"]
        if pred == "Sim" and real == "Sim":
            tp += 1
        elif pred == "Sim":
            fp += 1
        elif real == "Sim":
            fn += 1
        else:
            tn += 1
    precisao = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precisao * recall / (precisao + recall) if (precisao + recall) else 0.0
    return {
        "precisao": round(precisao, 3), "recall": round(recall, 3), "f1": round(f1, 3),
        "tp": tp, "fp": fp, "fn": fn, "tn": tn, "total": len(linhas),
    }
