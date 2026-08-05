# Desafio Churn — Template Altair AI Studio (antigo RapidMiner)

Caminho **no-code** do Desafio Final da trilha de Data Science: prever quais clientes vão
**cancelar (churn)** de forma visual, sem escrever código.

> **Nota:** o **Altair AI Studio** é o antigo **RapidMiner** (a Altair comprou o RapidMiner em
> 2022; a Siemens comprou a Altair em 2025). O motor é o mesmo — o arquivo `.rmp` abre igual.

## Arquivos desta pasta
- `Desafio_Churn_Template.rmp` — o processo (pipeline) pronto para importar.
- `clientes.csv` — dataset de exemplo (250 clientes) para rodar na hora.

## 1) Instalar o Altair AI Studio no Mac
1. Baixe o instalador (arquivo `.dmg`) do Altair AI Studio para macOS no site da Altair.
2. Abra o `.dmg`: aparece o ícone **AI Studio** e uma seta para a pasta **Applications**.
   **Arraste o ícone "AI Studio" para a pasta Applications** (é assim que se instala no Mac).
3. Abra o **Launchpad** (ou a pasta Aplicativos) e clique em **AI Studio** para abrir.
   - Se o macOS bloquear ("desenvolvedor não identificado"): vá em **Ajustes do Sistema →
     Privacidade e Segurança → Abrir mesmo assim**.
4. Na primeira vez, o AI Studio pede login/criar uma conta Altair (gratuita) e cria um
   **repositório local** — pode aceitar o padrão.

## 2) Importar o arquivo do case (o processo .rmp)
1. No AI Studio, menu **File → Import Process...**
2. Escolha o arquivo `Desafio_Churn_Template.rmp` desta pasta.
   - (Alternativa: arraste o `.rmp` direto para a área branca de **Process**.)
3. O pipeline aparece com os operadores já ligados (1 a 7).

## 3) Apontar o dataset e rodar
1. Clique no operador **"1 - Ler clientes.csv"**.
2. No painel **Parameters → csv_file**, clique na pasta e selecione o `clientes.csv`
   (o caminho completo da sua máquina).
3. Clique em **Run** (o botão ▶ azul no topo).
4. Vá na aba **Results**:
   - **"7 - Desempenho (F1)"** mostra o **F1** (meta do desafio: **F1 ≥ 0,75**) e a matriz de confusão.
   - **"5 - Árvore de Decisão"** mostra o modelo aprendido (a árvore).

## O que o pipeline faz
Ler CSV → tratar faltantes (limpeza) → definir o alvo `cancelou` → dividir 70/30 (seed fixa)
→ treinar Árvore de Decisão → aplicar no teste → medir desempenho (F1, acurácia, precisão, recall).

## Colunas do clientes.csv
`id, tempo_casa_meses, plano, valor_mensal, uso_gb, chamados_suporte, cancelou`

## Para ir além
- Troque a **Árvore de Decisão** por **Naive Bayes** ou **Random Forest** e compare o F1.
- Use **Cross Validation** no lugar do split simples.
- Para dados reais, baixe o **Telco Customer Churn** (Kaggle) e aponte o "Ler CSV" para ele.
