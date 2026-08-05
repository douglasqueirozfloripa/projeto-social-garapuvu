# Desafio Churn em Python — Guia Final (Aula 31)

Projeto **completo e testado** que prevê churn de clientes e serve de **guia final** da
trilha de Data Science. Mostra, num só lugar, a **diversidade de testes** que o Python
oferece — incluindo **leitura e escrita de arquivos** (um diferencial da linguagem) e
testes de **performance, latência e carga (rampa de uso)**.

> **Status:** 23 testes passando (validado). O modelo é um *baseline por regras* com
> **F1 ≈ 0,70** — o desafio "para ir além" é superar isso com scikit-learn.

## Como rodar
```bash
cd "Desafio Churn - Python"
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest                       # roda TODOS os testes
pytest -m "not carga"        # só os rápidos (pula carga/stress)
pytest -m performance        # só os de tempo/latência
pytest -m carga              # só os de carga/rampa
pytest --cov=src             # com relatório de cobertura
```

## Tipos de teste demonstrados
| Arquivo | Tipo de teste | O que mostra |
|---------|---------------|--------------|
| `test_dados.py` | Unitário + **parametrizado** + leitura de arquivo | Lê o CSV real e valida schema/faixas; vários casos inválidos de uma vez |
| `test_limpeza.py` | Unitário + parametrizado + **fixtures** | Padroniza e converte tipos |
| `test_arquivos.py` | **Arquivos (I/O)** — o diferencial | Escreve e lê JSON, CSV e TXT (ida e volta) usando `tmp_path` |
| `test_mock.py` | **Mock / monkeypatch** | Troca a fonte de dados por uma falsa, sem tocar no disco |
| `test_modelo.py` | **Métrica com limiar** | F1 do modelo deve ser ≥ 0,60 (jeito de testar ML) |
| `test_performance.py` | **Performance / latência** | Cada previsão < 1 ms; lote inteiro < 1 s |
| `test_carga.py` | **Carga / stress + rampa** | 50 lotes concorrentes e rampa 250 → 2.500 → 25.000 previsões |

## Estrutura
```
Desafio Churn - Python/
  src/  dados.py  limpeza.py  modelo.py  processamento.py  arquivos.py  relatorio.py
  tests/  test_dados  test_limpeza  test_arquivos  test_mock  test_modelo  test_performance  test_carga
  clientes.csv   requirements.txt   pytest.ini   conftest.py
```

## Por que "arquivos" é um diferencial
Em Data Science você vive lendo e gravando arquivos (CSV, JSON, logs, modelos). O Python
faz isso com poucas linhas — e o pytest tem o `tmp_path`, que cria uma pasta temporária
só para o teste. Assim você testa **ida e volta** (gravar e ler de novo) sem sujar o projeto.

## O desafio (para ir além)
1. Troque o baseline por regras por um modelo de **scikit-learn** (RandomForest) e **supere o F1 ≈ 0,70**.
2. Sirva o modelo por uma **API FastAPI** (`POST /prever`) e escreva o teste do endpoint.
3. Rode tudo no **CI (GitHub Actions)** a cada push.
4. Faça a versão **no-code** no **Altair AI Studio** (pasta `Desafio Churn - RapidMiner`).
