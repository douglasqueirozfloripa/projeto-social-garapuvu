# relatorio.py — Junta tudo: carrega, valida, avalia o modelo e SALVA um relatório.
from . import dados, modelo, arquivos

def gerar(caminho_csv, caminho_saida_json):
    """Pipeline completo: lê o CSV, valida, avalia o baseline e grava as métricas em JSON."""
    linhas = dados.carregar(caminho_csv)
    dados.validar(linhas)
    metricas = modelo.avaliar(linhas)
    arquivos.salvar_json(metricas, caminho_saida_json)
    return metricas
