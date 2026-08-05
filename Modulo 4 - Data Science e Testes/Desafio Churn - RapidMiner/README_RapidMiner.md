# Desafio Churn — Template RapidMiner

Este é o **caminho no-code** do Desafio Final da trilha de Data Science: prever quais
clientes vão **cancelar (churn)** usando o RapidMiner, sem escrever código.

## Arquivos
- `Desafio_Churn_Template.rmp` — o processo (pipeline) pronto para importar.
- `clientes.csv` — dataset de exemplo (250 clientes) para rodar na hora.

## Como usar (5 passos)
1. Abra o **RapidMiner Studio** (versão 9.10+ ou 10.x).
2. Menu **File → Import Process...** e escolha `Desafio_Churn_Template.rmp`
   (ou arraste o `.rmp` para a área de processo).
3. Clique no operador **"1 - Ler clientes.csv"** e, em *Parameters → csv_file*,
   aponte para o `clientes.csv` desta pasta (caminho completo da sua máquina).
4. Clique em **Run** (▶). 
5. Veja o resultado na aba **Results**: o operador **"7 - Desempenho (F1)"** mostra a
   nota **F1** (meta do desafio: **F1 ≥ 0,75**) e a matriz de confusão; a **Árvore de
   Decisão** mostra o modelo aprendido.

## O que o processo faz (pipeline)
1. **Ler** o CSV de clientes.
2. **Tratar faltantes** (limpeza/validação básica).
3. **Definir o alvo**: a coluna `cancelou` (Sim/Não) é o que o modelo prevê.
4. **Dividir** em 70% treino / 30% teste (seed fixa = reprodutível).
5. **Treinar** uma Árvore de Decisão.
6. **Aplicar** o modelo no teste e **medir o desempenho** (F1, acurácia, precisão, recall).

## Dados (colunas do clientes.csv)
`id, tempo_casa_meses, plano, valor_mensal, uso_gb, chamados_suporte, cancelou`

> Dica: para praticar com dados reais, baixe o **Telco Customer Churn** (Kaggle) e
> aponte o "Ler CSV" para ele — o pipeline funciona igual.

## Desafios extras (para ir além)
- Troque a **Árvore de Decisão** por **Naive Bayes** ou **Random Forest** e compare o F1.
- Use **Cross Validation** no lugar do split simples.
- Faça a limpeza de `plano` (padronizar texto) antes de treinar.
