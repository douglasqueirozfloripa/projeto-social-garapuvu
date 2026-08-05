# arquivos.py — Leitura e ESCRITA de arquivos (um diferencial do Python).
# JSON para relatórios de métricas; CSV para as previsões.
import csv
import json

def salvar_json(obj, caminho):
    """Salva um dicionário como JSON legível."""
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def ler_json(caminho):
    """Lê um arquivo JSON e devolve o objeto."""
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)

def salvar_csv(linhas, caminho):
    """Salva uma lista de dicionários como CSV (usa as chaves da 1ª linha como cabeçalho)."""
    if not linhas:
        raise ValueError("nada para salvar")
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(linhas[0].keys()))
        writer.writeheader()
        writer.writerows(linhas)

def ler_csv(caminho):
    """Lê um CSV e devolve uma lista de dicionários."""
    with open(caminho, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))
