# Roteiro do Apresentador — Módulo 4 (Data Science e Testes)

Conteúdo detalhado para estudar: cada bloco é a mesma nota gravada no slide correspondente (.pptx).

## Aula 27 — Introdução: Data Science e Testes

### Slide 1 — MÓDULO 4 · AULA 27
Data Science ('ciência de dados') é a área que combina programação, estatística e conhecimento do negócio para extrair informação útil de dados e apoiar decisões. Um cientista/analista de dados coleta dados, limpa, explora, cria modelos e comunica resultados. Neste módulo o foco é a QUALIDADE: como garantir que os dados e os modelos estão corretos. Isso importa mais em dados do que em software comum porque o erro é silencioso — não trava a tela, apenas produz um número errado no qual alguém confia. Vamos do zero, com analogias; ninguém precisa ser especialista.

### Slide 2 — O que vamos ver hoje
Roteiro em uma frase cada: o que é Data Science e suas etapas; as ferramentas (Python, pandas, scikit-learn, Altair AI Studio, SQL, visualização); o que é Big Data e a nuvem de dados (Snowflake); onde a área é usada no mercado; por que testar; e um exemplo prático de testar o próprio dado com pandera. Ideia-guia do módulo: 'dado ruim = decisão ruim'.

### Slide 3 — O que é Data Science?
Data Science segue um ciclo. COLETA: reunir dados de fontes como bancos (SQL), APIs, planilhas, logs e sensores. LIMPEZA/PREPARAÇÃO: tratar valores faltantes, duplicados, formatos inconsistentes e outliers — costuma consumir uns 80% do tempo do projeto. ANÁLISE EXPLORATÓRIA: estatística descritiva (médias, distribuições), correlações e gráficos para entender os dados. MODELAGEM: criar um modelo que aprende padrões. Há aprendizado SUPERVISIONADO, quando temos a resposta certa nos dados históricos — dividido em classificação (prever uma categoria, ex.: cancela sim/não) e regressão (prever um número, ex.: valor de venda) — e NÃO-SUPERVISIONADO, sem resposta, como clusterização (agrupar clientes parecidos). COMUNICAÇÃO: transformar o resultado em gráficos, dashboards e recomendações. Um MODELO, na prática, é uma função que aprende a relação entre as FEATURES (as variáveis de entrada, o 'X') e o ALVO (o que se quer prever, o 'y'); você mostra milhares de exemplos rotulados e ele generaliza para casos novos.

### Slide 4 — Ferramentas do ecossistema
Explique cada ferramenta com substância. PYTHON: linguagem interpretada, fácil de ler, com o maior ecossistema de bibliotecas de dados — virou o padrão da área. PANDAS: biblioteca que traz o DataFrame (uma tabela com linhas e colunas, como uma aba de Excel) e a Series (uma coluna); permite filtrar, agrupar (groupby), juntar tabelas (merge) e ler/gravar CSV, Excel e SQL com uma linha. NUMPY está por baixo, cuidando de cálculos numéricos rápidos. JUPYTER NOTEBOOK: um documento interativo feito de 'células' de código e texto, onde você roda um pedaço por vez e vê o resultado (gráfico, tabela) na hora — ótimo para explorar; o Google COLAB é um Jupyter gratuito na nuvem, sem instalar nada, até com GPU. SCIKIT-LEARN: a principal biblioteca de Machine Learning do Python; tem algoritmos prontos (árvore de decisão, random forest, regressão logística, KNN), a divisão treino/teste (train_test_split) e as métricas; o padrão de uso é model.fit(treino) para treinar e model.predict(novo) para prever. ALTAIR AI STUDIO (antigo RapidMiner): faz tudo isso de forma VISUAL, arrastando 'operadores' (blocos), sem escrever código. SQL: linguagem para consultar bancos (SELECT, WHERE, JOIN), vista no Bônus B1. MATPLOTLIB/SEABORN/POWER BI: para gráficos e dashboards. Ninguém precisa dominar tudo hoje — este slide é o mapa.

### Slide 5 — Big Data e a nuvem de dados
BIG DATA é quando o volume, a velocidade ou a variedade dos dados excede o que um único computador/planilha aguenta. Os 3 Vs: VOLUME (terabytes/petabytes — não cabe na memória RAM de um PC), VELOCIDADE (dados chegando o tempo todo, quase em tempo real) e VARIEDADE (texto, imagem, JSON, tabelas — formatos diferentes); alguns autores somam Veracidade (confiabilidade) e Valor. Quando o dado é grande demais, usamos computação DISTRIBUÍDA (dividir o trabalho entre vários computadores — é o que o Apache Spark faz) e guardamos os dados na NUVEM. Um DATA WAREHOUSE é um armazém de dados organizado para análise; um DATA LAKE guarda dados brutos de qualquer formato. A SNOWFLAKE é um data warehouse na nuvem (SaaS) muito usado: você não gerencia servidor, ela SEPARA armazenamento de processamento (então escala cada um sob demanda), consulta-se com SQL e paga-se pelo uso. Google BIGQUERY é semelhante (serverless); DATABRICKS junta Spark e notebooks. O processo de trazer dados para lá chama-se ETL/ELT (extrair, transformar, carregar). Analogia: se seus dados cabem num armário (planilha), Big Data é um galpão na nuvem que cresce quando precisa — e validar a qualidade em escala fica ainda mais crítico.

### Slide 6 — Problemas reais de Data Science no mercado
Data Science resolve problemas concretos; explique como cada um funciona. CHURN (cancelamento): é uma CLASSIFICAÇÃO binária — o modelo aprende, pelo histórico, a prever se um cliente vai cancelar (sim/não), para a empresa agir antes com retenção; será nosso desafio final. FRAUDE: detecção de anomalias em tempo real; classes muito desbalanceadas (fraude é rara), o que exige métricas além da acurácia. CRÉDITO: prever inadimplência (score) para conceder ou não empréstimo; área muito regulada, precisa ser explicável. DEMANDA/VENDAS: previsão por SÉRIES TEMPORAIS (usa o passado para estimar o futuro), para não faltar nem sobrar estoque. RECOMENDAÇÃO: sugerir itens (Netflix, Spotify, e-commerce) por 'filtragem colaborativa' (quem gostou disso também gostou daquilo) ou por conteúdo. ANÁLISE DE SENTIMENTO: usa PLN (processamento de linguagem natural) para classificar textos (avaliações, comentários) como positivos ou negativos. Note que a maioria são problemas de classificação ou regressão — a mesma caixa de ferramentas do desafio.

### Slide 7 — Por que testar em Data Science?
POR QUE TESTAR em Data Science? Pelo princípio 'garbage in, garbage out': se entra dado errado, sai conclusão errada, por mais bonito que fique o gráfico. Testamos TRÊS coisas. O CÓDIGO: as funções que leem, limpam e transformam os dados fazem exatamente o que prometem? (é o teste unitário, com pytest). O DADO: está completo, no formato certo, dentro das faixas esperadas, sem duplicatas? (é a validação de dados, com pandera/Great Expectations). O MODELO: acerta o suficiente segundo uma métrica? não está 'colando' (data leakage)? é justo? Diferente de um sistema web, onde o bug aparece na tela, em dados o erro costuma ser SILENCIOSO — o pipeline roda 'com sucesso' e entrega um número errado. Exemplo clássico: um campo que trata centavos como reais mostra a empresa 100 vezes mais rica; o relatório fica lindo e a decisão é péssima. E modelos podem estar 'confiantemente errados' — dar uma probabilidade alta para algo falso. Por isso testar dado e modelo é tão sério quanto testar código.

### Slide 8 — Testando o DADO com pandera (exemplo)
Este é o gancho central do módulo: além do CÓDIGO, testamos o DADO em si. O PANDERA é uma biblioteca Python de validação de DataFrames: você declara um 'schema' com as colunas esperadas e as regras de cada uma, e ele confere o DataFrame inteiro. No exemplo: idade tem que ser inteiro entre 0 e 120 (Check.in_range), e-mail precisa casar com um padrão que tenha @ (Check.str_matches), salário tem que ser >= 0 (Check.ge), e cidade não pode ser nula (nullable=False). Ao rodar schema.validate(df), se algum valor viola a regra, o pandera lança um erro apontando a coluna e a linha; com lazy=True, ele junta TODOS os problemas de uma vez. Isso normalmente roda na ENTRADA do pipeline (quando um novo arquivo chega) e no CI, barrando dado ruim antes de treinar ou gerar relatório. A diferença para o teste de código é o alvo: aqui a 'entrada' que testamos são os próprios dados, não uma função. E não precisa saber programar muito — são regras de bom senso viradas em verificação automática. Veremos a fundo, com uma segunda ferramenta, na Aula 29.

### Slide 9 — Teste comum × teste em Data Science
A maior mudança de mentalidade do módulo. No software TRADICIONAL o comportamento é DETERMINÍSTICO: a mesma entrada gera sempre a mesma saída, então o teste compara o resultado com um valor esperado fixo (passou/falhou). Em Machine Learning o resultado é PROBABILÍSTICO: o modelo 'acerta X% das vezes' e depende dos dados, que mudam com o tempo. Por isso avaliamos por MÉTRICAS com um LIMIAR, não por igualdade exata. Principais métricas de classificação: ACURÁCIA (% de acertos — engana quando as classes são desbalanceadas), PRECISÃO (dos que o modelo disse 'sim', quantos eram mesmo), RECALL (dos que eram 'sim', quantos o modelo pegou) e F1 (equilíbrio entre precisão e recall, de 0 a 1). Um teste de modelo vira algo como 'assert f1 >= 0.75'. Também lidamos com NÃO-DETERMINISMO fixando a semente aleatória (random_state/seed) para reproduzir o mesmo resultado, e com DRIFT (o dado de produção muda e a performance cai com o tempo). Para quem vem de QA tradicional, é aqui que a cabeça muda.

### Slide 10 — Quando o dado (ou o modelo) engana
Falhas reais mostram o custo de não testar dado e modelo. VIÉS (bias): em 2018 uma grande empresa de tecnologia abandonou uma IA que triava currículos porque ela aprendeu, com o histórico majoritariamente masculino, a penalizar currículos de mulheres — ninguém testou justiça/viés nos dados de treino. Lição: verifique se o modelo é justo entre grupos e se os dados de treino não carregam preconceitos históricos. DATA LEAKAGE (vazamento de dados): acontece quando informação que o modelo não teria no mundo real 'vaza' para o treino — por exemplo, uma coluna que só existe depois do desfecho, ou processar/normalizar os dados ANTES de separar treino e teste. O modelo então parece excelente na avaliação e fracassa na vida real. Analogia da prova: estudar com o próprio gabarito — tira 10 no simulado e zera na prova real. Como evitar: separe treino/teste ANTES de qualquer transformação, use pipelines do scikit-learn e desconfie de acurácia perto de 100%. Esses erros são invisíveis SEM teste — e viram decisão errada de verdade.

### Slide 11 — Resumão da aula
Fechamento. Três ideias para a turma levar: (1) 'dado ruim = decisão ruim' — a qualidade do dado limita a qualidade da conclusão; (2) em Data Science testamos três coisas: o código, o DADO e o modelo; (3) avaliamos modelos por métricas com limiar, não por 'passou/falhou'. Ponte para a próxima aula: 'na Aula 28 começamos a testar de verdade, com o pytest, as funções que preparam os dados'.

### Slide 12 — Glossário da aula
Passe rápido pelo glossário: são os termos e siglas que apareceram na aula. Diga que não é para decorar agora — é uma página de consulta. Leia 2 ou 3 que você acha que geram mais dúvida e siga.

### Slide 13 — Referências e para aprofundar
Mostre onde aprofundar: aponte 1 ou 2 referências e diga que os links completos estão no Guia de Estudos do módulo. Encerre convidando a turma a praticar no material indicado.


## Aula 28 — Testes com Python (pytest)

### Slide 1 — MÓDULO 4 · AULA 28
O PYTEST é o framework de testes mais usado em Python. Ele descobre os testes automaticamente, roda todos com um comando, mostra mensagens de erro muito claras (ele 'reescreve' o assert para exibir os valores que compararam) e tem recursos como fixtures e marcadores. É mais simples que o unittest da biblioteca padrão. Aqui estamos na BASE da pirâmide de testes: escrevemos muitos testes pequenos e rápidos (rodam em milissegundos) sobre as funções que limpam e transformam os dados. Ao fim da aula, o objetivo é que todos consigam ler e escrever um teste simples.

### Slide 2 — O que vamos ver hoje
Roteiro: a convenção do pytest e como se escreve um teste (arquivos e funções com o prefixo test_, e a palavra 'assert'); como testar funções de limpeza de dados; o que são fixtures (dados de teste reutilizáveis) e por que ajudam; e boas práticas específicas de testar dados.

### Slide 3 — pytest: testes simples em Python
Como o pytest funciona. Convenção: arquivos começam com test_ (ex.: test_limpeza.py) e as funções de teste também (def test_...). Dentro da função usamos 'assert' seguido de uma condição — se ela for verdadeira, o teste PASSA; se for falsa, FALHA e o pytest mostra os valores envolvidos. Para rodar, basta o comando 'pytest' no terminal, que encontra e executa tudo; 'pytest -v' mostra cada teste, e 'pytest -k nome' roda só os que casam com um nome. Cada teste segue o padrão AAA: Arrange (prepara os dados), Act (chama a função) e Assert (verifica o resultado). Analogia da cozinha: provar cada ingrediente antes de juntar tudo — se um está salgado demais, você descobre na hora, não no prato final.

### Slide 4 — Exemplo: testar uma função de limpeza
Leia o código com calma. Em cima está a função remover_precos_invalidos, que recebe um DataFrame e devolve só as linhas com preço maior que zero e não vazio (usa notna() para descartar nulos e o filtro > 0). Embaixo, o teste: 'arrange' cria um mini-DataFrame com preços [10, 0, -5, None, 20]; 'act' chama a função; 'assert' confere que sobraram exatamente [10, 20] — ou seja, o zero, o negativo e o nulo foram removidos. A ideia central de todo teste unitário: dada uma ENTRADA conhecida, você espera uma SAÍDA exata. Um bônus: o teste vira documentação viva — quem ler entende, sem rodar, o que a função deve fazer e quais casos ela trata.

### Slide 5 — Fixtures: dados de teste reutilizáveis
FIXTURE é um preparo reutilizável de dados/estado para os testes. Você marca uma função com o decorador @pytest.fixture e ela devolve algo pronto (por exemplo, um DataFrame de exemplo); qualquer teste que peça esse nome como parâmetro recebe o valor automaticamente (é 'injeção de dependência'). Fixtures têm ESCOPO (function por padrão — recriada a cada teste; module ou session — criada uma vez e compartilhada), o que evita repetição e mantém os testes isolados. O pytest ainda oferece fixtures prontas, como tmp_path (uma pasta temporária exclusiva do teste, ótima para testar leitura/escrita de arquivo) e monkeypatch (para trocar funções). Fixtures comuns ficam num arquivo conftest.py, visível a todos os testes. Analogia da 'mise en place' da cozinha: deixar os ingredientes lavados e cortados na tigela antes de cozinhar.

### Slide 6 — Exemplo: fixture + teste de transformação
Neste exemplo, a fixture 'dados' devolve um DataFrame com bairros bagunçados: ' Centro ' (com espaços), 'trindade' (minúsculo) e 'CENTRO' (maiúsculo). O teste chama a função de normalização e confere que o resultado vira ['Centro', 'Trindade', 'Centro']. Aproveite para explicar por que isso importa: padronizar texto — remover espaços com strip(), acertar maiúsculas/minúsculas — é uma das MAIORES fontes de bug em dados, porque o computador trata 'Centro', ' centro ' e 'CENTRO' como três valores diferentes; isso quebra agrupamentos, contagens e junções (um relatório mostraria três bairros onde há um). Também dá para usar @pytest.mark.parametrize para rodar o mesmo teste com vários valores de entrada de uma vez.

### Slide 7 — Boas práticas de teste unitário em dados
Boas práticas de teste unitário em dados. (1) TESTE AS BORDAS: nulos, string vazia, zero, negativos e tipos errados — é onde o dado quebra na vida real. (2) DADOS MÍNIMOS: use uma amostra pequena e clara que represente o caso, não a base inteira (testes ficam rápidos e legíveis). (3) RESULTADO EXATO: compare célula a célula com a saída esperada, não 'mais ou menos'. (4) DETERMINISMO: fixe a semente aleatória (random_state) sempre que houver sorteio, para o teste dar o mesmo resultado toda vez. Some a isso: um teste deve verificar uma coisa por vez e ter nome que descreva o cenário. Reforce que 'testar as bordas' é o que captura a maioria dos bugs.

### Slide 8 — Resumão da aula
Fechamento. Recapitule: o pytest usa arquivos/funções com prefixo test_ e a palavra assert; testes de unidade provam as funções de limpeza e transformação; fixtures preparam e reaproveitam dados de teste (e tmp_path serve para arquivos); sempre teste as bordas, compare o resultado exato e fixe a seed. Ponte: 'na Aula 29 saímos do código e passamos a testar o DADO em si, com pandera e Great Expectations'.

### Slide 9 — Glossário da aula
Passe rápido pelo glossário: são os termos e siglas que apareceram na aula. Diga que não é para decorar agora — é uma página de consulta. Leia 2 ou 3 que você acha que geram mais dúvida e siga.

### Slide 10 — Referências e para aprofundar
Mostre onde aprofundar: aponte 1 ou 2 referências e diga que os links completos estão no Guia de Estudos do módulo. Encerre convidando a turma a praticar no material indicado.


## Aula 29 — Qualidade e Validação de Dados

### Slide 1 — MÓDULO 4 · AULA 29
Nesta aula testamos o DADO, não o código. A ideia central: assim como declaramos o que uma função deve fazer, declaramos as REGRAS que o dado precisa cumprir (tipos, faixas, obrigatoriedade, unicidade) e uma ferramenta verifica automaticamente; se um valor quebra a regra, ela acusa a linha. Isso é o coração da qualidade em Data Science, porque a maioria dos erros de análise não está no gráfico nem no modelo — está num dado ruim que entrou sem ser conferido.

### Slide 2 — O que vamos ver hoje
Roteiro: as dimensões da qualidade de dados; a ideia de que 'validar o dado é testar o dado'; duas ferramentas para isso (pandera e Great Expectations), com exemplo de cada e uma comparação; a alternativa visual (Altair AI Studio) e o histórico da ferramenta; e um caso real de dado ruim que passou batido e causou estrago.

### Slide 3 — As dimensões da qualidade de dados
As dimensões que definem 'dado de qualidade', com o que verificar em cada. COMPLETUDE: não faltam valores onde eram obrigatórios (ex.: cliente sem CPF). UNICIDADE: não há duplicatas onde deveria ser único (ex.: o mesmo pedido contado duas vezes). VALIDADE: os valores estão no formato e na faixa esperados (idade entre 0 e 120; e-mail com @; data real). CONSISTÊNCIA: os dados batem entre si e entre tabelas (o total confere com a soma das partes; o status não é 'cancelado' e 'ativo' ao mesmo tempo). ATUALIDADE (ou 'frescor'): o dado está atualizado o suficiente para a decisão (uma cotação de ontem pode não servir hoje). ACURÁCIA: o dado corresponde à realidade (aquele CEP existe? o nome está certo?). Quando alguém fala 'qualidade de dados', está falando destas dimensões — e cada uma vira uma checagem automática.

### Slide 4 — Validar o dado é testar o dado
Validar o dado é o mesmo raciocínio de testar código, aplicado à entrada. Escrevemos 'expectativas' sobre o dado — schema (quais colunas e de que tipo), faixas de valor, campos obrigatórios, unicidade — e as verificamos AUTOMATICAMENTE a cada nova carga de dados, não só uma vez. Há duas filosofias: 'schema-on-write' (validar antes de gravar, barrando na entrada) e 'schema-on-read' (validar ao ler). O ponto de aplicar isso no início do pipeline é 'falhar cedo': é melhor a carga parar com um erro claro do que um dado corrompido seguir e contaminar relatórios e modelos. Analogia do inspetor na porta do armazém: ele confere cada caixa que chega (peso, lacre, validade); caixa fora do padrão não entra.

### Slide 5 — Exemplo: schema com pandera
PANDERA é uma biblioteca Python que valida DataFrames do pandas de forma declarativa. Você cria um DataFrameSchema descrevendo cada Column: o tipo (int, str, float), se aceita nulo (nullable) e as regras (Check). No exemplo: id é inteiro e ÚNICO (unique=True), bairro é string NÃO nula, preço é float MAIOR que zero (Check.gt(0)), e nota é inteiro ENTRE 1 e 5 (Check.in_range(1,5)). Ao chamar schema.validate(df), se algo viola a regra ele lança um SchemaError apontando a coluna e a linha; com lazy=True ele reúne todos os erros de uma vez, em vez de parar no primeiro. Dá para 'coagir' tipos (coerce=True) e criar checagens personalizadas. É leve, roda rápido, integra com o pytest e cabe direto no CI — ótimo para o dia a dia dentro do código.

### Slide 6 — Exemplo: as mesmas regras com Great Expectations
GREAT EXPECTATIONS (GE) resolve o mesmo problema, porém é uma plataforma mais completa. Você declara 'Expectations' (expectativas) cujos nomes já dizem o que verificam: expect_column_values_to_be_unique (ser único), expect_column_values_to_not_be_null (não ser nulo), expect_column_values_to_be_between (estar entre dois valores). Um conjunto delas forma uma 'Expectation Suite'; um 'Checkpoint' roda a suíte sobre um lote de dados. O grande diferencial é o relatório visual automático, o DATA DOCS, uma página que mostra, de forma amigável, o que passou e o que falhou — ótimo para compartilhar com quem não é técnico. O GE se conecta a bancos, Spark, Snowflake e ferramentas de orquestração (como o Airflow), sendo forte em pipelines de produção. Os nomes autoexplicativos tornam as regras legíveis até para áreas de negócio.

### Slide 7 — pandera × Great Expectations
Quando usar cada uma. PANDERA: leve e declarativa, escrita em Python, ideal DENTRO do código e do CI, para checagens rápidas de DataFrames no dia a dia; curva de aprendizado curta. GREAT EXPECTATIONS: mais robusta e completa, gera os relatórios visuais (Data Docs), roda sobre grandes volumes (bancos, Snowflake, Spark) e se integra a pipelines — melhor para governança de dados em produção e para envolver o negócio; em troca, exige mais configuração. Resumo prático: pandera para validar rápido no código; Great Expectations para validar dados em escala com relatório e histórico. Ambas transformam 'regras do dado' em verificação automática — a escolha é sobre tamanho do projeto e público.

### Slide 8 — Altair AI Studio: validação visual (sem código)
Para quem não programa, o ALTAIR AI STUDIO (antigo RapidMiner) permite fazer todo o fluxo de forma VISUAL. Você monta um 'processo' arrastando OPERADORES — blocos que fazem uma etapa cada: ler um CSV, tratar faltantes, definir o alvo, dividir treino/teste, treinar um modelo, medir desempenho — e liga a saída de um na entrada do outro. Os dados e modelos ficam num 'repositório' do projeto. No desafio final, em vez de escrever código, eles vão IMPORTAR um processo pronto (arquivo .rmp), apontar o CSV e clicar em Run. Analogia da esteira de fábrica: cada estação (operador) faz uma checagem no produto (o dado) antes de passar adiante; você vê o fluxo inteiro, visualmente.

### Slide 9 — De RapidMiner a Altair AI Studio (a herança)
A 'herança' da ferramenta ajuda a não se perder com o nome. O que hoje se chama Altair AI Studio nasceu em 2001 na Universidade de Dortmund (Alemanha) com o nome YALE, criado por Ingo Mierswa e colegas; em 2007 virou RAPIDMINER, um dos softwares de mineração de dados mais populares do mundo, conhecido por permitir ciência de dados sem código. Em 2022 a ALTAIR (empresa de simulação e computação) comprou o RapidMiner e o integrou ao seu portfólio; em 2025 a SIEMENS comprou a Altair (por cerca de US$ 10 bilhões). Nessa reorganização, o produto passou a se chamar Altair AI Studio — mas o MOTOR é o mesmo, e os arquivos de processo (.rmp) continuam abrindo normalmente. Empresas fazem essas rebrandings após aquisições. Analogia da padaria de bairro comprada por uma rede: mudou a placa e o dono, o pão que você aprende a fazer é o mesmo.

### Slide 10 — Quando o dado ruim passou
O impacto de não validar. Sem checagem, um dado ruim gera relatório e decisão errada em silêncio — o pipeline roda 'com sucesso' e entrega um número falso. Dois erros clássicos: UNIDADE/FORMATO inconsistente — misturar reais e centavos, metros e pés, ou datas em formatos diferentes (01/02 é jan ou fev?) — distorce somas, médias e comparações; e DUPLICATAS/NULOS — registros repetidos inflam totais e faturamento, enquanto campos nulos quebram cálculos (uma média que encontra um nulo pode virar erro ou resultado sem sentido). Uma checagem simples de faixa, unicidade e completude na ENTRADA teria barrado tudo isso. Feche reforçando: o erro de análise quase sempre está no DADO, não no gráfico — e ele só aparece se você testar o dado.

### Slide 11 — Resumão da aula
Fechamento. Recapitule as dimensões de qualidade (completude, unicidade, validade, consistência, atualidade, acurácia); a ideia de validar o dado como se testa código; as duas ferramentas (pandera para o código, Great Expectations para escala com relatório); e o Altair AI Studio como opção visual. Regra de ouro: valide o dado a CADA carga e barre o dado ruim antes de usá-lo. Ponte: 'na Aula 30 automatizamos tudo isso — unitário, validação, API do modelo e interface — numa esteira'.

### Slide 12 — Glossário da aula
Passe rápido pelo glossário: são os termos e siglas que apareceram na aula. Diga que não é para decorar agora — é uma página de consulta. Leia 2 ou 3 que você acha que geram mais dúvida e siga.

### Slide 13 — Referências e para aprofundar
Mostre onde aprofundar: aponte 1 ou 2 referências e diga que os links completos estão no Guia de Estudos do módulo. Encerre convidando a turma a praticar no material indicado.


## Aula 30 — Automação: Unit, API e Interface

### Slide 1 — MÓDULO 4 · AULA 30
Esta aula é sobre AUTOMATIZAR os testes em Data Science, aplicando a pirâmide de testes (vista na Aula 9) ao mundo dos dados e dos modelos. O objetivo é que os testes 'rodem sozinhos, o tempo todo' — do dado ao dashboard — numa esteira de Integração Contínua (CI). Assim, a cada mudança no código ou nos dados, tudo é reconferido automaticamente e problemas aparecem em minutos, não em produção.

### Slide 2 — O que vamos ver hoje
Roteiro: a pirâmide de testes adaptada a DS; os níveis na prática; como testar a API que serve o modelo; como testar a interface/dashboards; e como o CI amarra tudo. Regra de ouro da pirâmide: muitos testes rápidos e baratos embaixo, poucos e lentos no topo.

### Slide 3 — A pirâmide de testes aplicada a Data Science
A PIRÂMIDE de testes organiza os tipos por quantidade e custo. Em software: muitos testes de UNIDADE na base (rápidos, isolam uma função), alguns de INTEGRAÇÃO no meio (peças funcionando juntas) e poucos E2E no topo (o sistema inteiro, lentos e frágeis). Em Data Science ela ganha um degrau extra na base: além dos testes de unidade das funções de limpeza (pytest), a VALIDAÇÃO DO DADO (pandera/Great Expectations). No meio fica a API do modelo (integração), e no topo a interface/E2E (o dashboard que o usuário vê). A forma de pirâmide não é estética: testes de base são baratos e você tem muitos; testes de topo são caros e instáveis, então poucos. Analogia da cozinha: provar cada ingrediente, depois o molho já misturado, e por fim o prato montado no prato do cliente.

### Slide 4 — Os níveis, na prática
Os quatro níveis, com o que se testa em cada. UNITÁRIO: uma função pura — dada uma entrada conhecida, sai a saída esperada (ex.: a função que converte 'Sim'/'Nao' em 1/0). VALIDAÇÃO DE DADO: schema, faixas, nulos e duplicados do dataset (pandera/GE), a cada carga. API DO MODELO: um POST envia os dados de um caso e recebe a previsão no formato certo, dentro da faixa e a tempo. INTERFACE/DASHBOARD: os filtros, totais e gráficos que o usuário vê batem com o dado real. Cada nível pega um tipo diferente de erro — por isso todos importam.

### Slide 5 — Testar a API do modelo
Como um modelo 'vira' um serviço que outros sistemas usam: ele é servido por uma API (interface de programação). Com frameworks Python como FASTAPI ou Flask, criamos um endpoint, por exemplo POST /prever, que recebe os dados de um cliente em JSON, passa pelo modelo e devolve a previsão (ex.: {'churn': 'Sim', 'probabilidade': 0.82}). O FastAPI ainda valida automaticamente o formato da entrada (com o pydantic) e roda com o servidor uvicorn. O que testamos na API: status 200 quando dá certo; o FORMATO da resposta (tem o campo probabilidade?); a FAIXA (probabilidade entre 0 e 1); e os casos NEGATIVOS (dado faltando ou inválido deve retornar 400, não derrubar o servidor). Analogia da casa: o endpoint /prever é a porta — abre e entrega a previsão certa? tranca para pedido inválido? responde rápido? É exatamente o teste de API da Aula 14.

### Slide 6 — Exemplo: testar o endpoint de previsão
Leia o teste. Ele monta um cliente (tempo de casa, valor mensal, chamados), faz um POST em /prever e verifica duas coisas: o status é 200 e a probabilidade retornada está entre 0 e 1. O segundo teste envia um corpo vazio e espera o status 400 (requisição inválida). Repare na diferença para o teste tradicional: em ML não conferimos um valor exato de previsão (ela pode variar), e sim se está na FAIXA válida e se o comportamento com dado inválido é correto. Ferramentas: pytest com a biblioteca requests, ou o TestClient do próprio FastAPI, ou o Postman.

### Slide 7 — Interface, dashboards e CI
O topo da pirâmide e a esteira. INTERFACE/DASHBOARD (Power BI, Streamlit): conferir se filtros e totais mostrados batem com o dado de origem — um número errado num painel vira decisão errada. Um teste E2E (com Playwright, por exemplo) pode abrir o dashboard e validar um número-chave. CI (Integração Contínua): uma esteira, como o GitHub Actions, que a cada 'push' (envio de código) instala as dependências e roda pytest + a validação de dados; se algo falha, o build fica vermelho e barra a mudança. Em projetos de dados, ferramentas como o nbmake executam os notebooks Jupyter no CI para garantir que rodam do início ao fim, e o DVC versiona dados e modelos (como o Git faz com código). Analogia da esteira de qualidade da fábrica: nada sai para o cliente sem passar por todas as estações.

### Slide 8 — Resumão da aula
Fechamento. Recapitule os níveis: unitário + validação de dado (base), API do modelo (meio), interface/E2E (topo); o modelo servido por API é testado como qualquer API (status, formato, faixa, borda); e o CI roda tudo automaticamente a cada mudança. Ponte: 'na Aula 31 juntamos tudo no desafio final — construir e testar um pipeline de churn de ponta a ponta'.

### Slide 9 — Glossário da aula
Passe rápido pelo glossário: são os termos e siglas que apareceram na aula. Diga que não é para decorar agora — é uma página de consulta. Leia 2 ou 3 que você acha que geram mais dúvida e siga.

### Slide 10 — Referências e para aprofundar
Mostre onde aprofundar: aponte 1 ou 2 referências e diga que os links completos estão no Guia de Estudos do módulo. Encerre convidando a turma a praticar no material indicado.


## Aula 31 — Desafio Final (Data Science)

### Slide 1 — MÓDULO 4 · AULA 31
Aula final da trilha, com dois momentos: primeiro, como se testa um MODELO de verdade — que não é 'passou/falhou'; depois, o desafio final, prever churn (cancelamento), o problema mais clássico e valioso do mercado. É o projeto que fecha o módulo e que vira portfólio para o currículo.

### Slide 2 — O que vamos ver hoje
Roteiro: como testar modelos (métricas com limiar, data leakage, reprodutibilidade, drift); as boas práticas; e o desafio final — o contexto do churn, as tarefas, os entregáveis e como será avaliado.

### Slide 3 — Como testar um modelo de ML
Como testar um MODELO. Como ele não acerta 100%, testamos por LIMIAR sobre uma métrica. As principais métricas de classificação: ACURÁCIA (% de acertos, enganosa quando as classes são desbalanceadas), PRECISÃO, RECALL, F1 (equilíbrio entre precisão e recall, de 0 a 1) e AUC-ROC (capacidade de separar as classes). A MATRIZ DE CONFUSÃO mostra acertos e erros por classe (verdadeiros/falsos positivos e negativos). Um teste vira 'assert f1 >= 0,80'. Três cuidados essenciais: sem DATA LEAKAGE (separe treino e teste; nunca deixe informação da resposta ou do futuro entrar nas features); REPRODUTIBILIDADE (fixe a semente aleatória e versione dados e modelo — com DVC ou MLflow — para obter sempre o mesmo resultado); e DRIFT (em produção a distribuição dos dados muda com o tempo, 'data drift', ou a relação entre entrada e alvo muda, 'concept drift', e a performance cai — por isso monitora-se o modelo continuamente). Analogia da escola: a prova tem que ser diferente da lista de exercícios, senão o aluno só decorou.

### Slide 4 — Boas práticas de teste em Data Science
As boas práticas que evitam os erros mais comuns. FIXAR A SEED (random_state) para reproduzir resultados. SEPARAR treino/teste e avaliar sempre no que o modelo nunca viu (idealmente usar validação cruzada). EVITAR LEAKAGE: nada do alvo ou do futuro nas features; faça o pré-processamento dentro de um pipeline, depois do split. VALIDAR O DADO antes de treinar (pandera/GE) — lixo não entra. CHECAR VIÉS: o modelo é justo entre grupos (gênero, região)? DOCUMENTAR: registre os dados usados, a versão do modelo e as métricas no README, para outra pessoa reproduzir. São hábitos simples que separam um projeto amador de um profissional.

### Slide 5 — PROJETO QUE FECHA A TRILHA
Slide de transição: 'agora, o desafio que fecha a trilha'. Faça uma pausa para marcar a virada de tom — sai o conteúdo teórico e entra a mão na massa, o projeto que eles vão construir e apresentar.

### Slide 6 — O desafio: prever churn (cancelamento) de clientes
O desafio: prever quais clientes vão CANCELAR (churn) numa empresa de assinatura, a partir de um CSV com colunas como tempo de casa (meses), plano, valor mensal, uso, chamados ao suporte e o alvo 'cancelou' (Sim/Não). Por que churn é o caso mais clássico: reter um cliente costuma ser 5 a 25 vezes mais barato que conquistar um novo, então prever quem está prestes a sair — para agir com retenção — vale muito dinheiro. Tecnicamente é uma CLASSIFICAÇÃO binária, e as classes costumam ser desbalanceadas (menos gente cancela), por isso olhamos F1 e não só acurácia. Há DUAS trilhas para entregar: código (Python + pytest) OU visual (Altair AI Studio). Meta de qualidade: dados validados, testes verdes e F1 maior ou igual a 0,75. Para treinar com dado real, indique o dataset público 'Telco Customer Churn' no Kaggle.

### Slide 7 — As tarefas do desafio
As seis tarefas, na ordem de um pipeline real. (1) EXPLORAR e VALIDAR o CSV (schema, nulos, faixas — com pandera). (2) LIMPAR e preparar as features com funções pequenas e testáveis. (3) TREINAR e avaliar um modelo (scikit-learn), separando treino/teste com seed fixa e exigindo F1 >= 0,75. (4) SERVIR o modelo por uma API (FastAPI, POST /prever). (5) TESTAR tudo: unit (limpeza), validação de dado, métrica do modelo e endpoint da API. (6) AUTOMATIZAR no CI (GitHub Actions) para rodar a cada push. É a mesma lógica do Desafio de QA (Módulo 2), agora aplicada a dados.

### Slide 8 — A suíte de testes esperada
A estrutura de testes que se espera ver toda verde: test_limpeza.py (unitário das funções de preparação), test_dados.py (validação de schema/faixas com pandera), test_modelo.py (assert f1 >= 0.75) e test_api.py (o endpoint /prever — status, formato, borda). O comando 'pytest' roda os quatro conjuntos de uma vez, e o mesmo roda no CI a cada envio de código. Reforce: são quatro frentes de teste — limpeza, dado, modelo e API — que juntas cobrem o pipeline inteiro.

### Slide 9 — Entregáveis e avaliação
O que enviar e como será avaliado. ENTREGÁVEIS: o repositório (código Python OU o processo do Altair) com README explicando como rodar; um relatório de métricas com o F1 e a MATRIZ DE CONFUSÃO (a tabela que mostra, por classe, quantos acertou e errou — verdadeiros positivos, falsos positivos, etc.); os testes verdes no CI; evidência de qualidade do dado (validação barrando um dado inválido, sem leakage, seed fixa); a API respondendo com a previsão; e uma apresentação explicando as decisões. CRITÉRIO central: funciona, é testado e a métrica bate o limiar (F1 >= 0,75).

### Slide 10 — Resumão — e parabéns pela trilha!
Fechamento da trilha. Recapitule: modelo se testa por limiar de métrica e sem data leakage; reprodutibilidade se garante com seed e versionamento; o desafio percorre o caminho completo, do CSV bruto à API testada, com dados validados. Parabenize a turma: eles aprenderam a testar as TRÊS camadas — o código, o DADO e o modelo —, que é o tripé da qualidade em Data Science, e saem com um projeto real no portfólio.

### Slide 11 — Glossário da aula
Passe rápido pelo glossário: são os termos e siglas que apareceram na aula. Diga que não é para decorar agora — é uma página de consulta. Leia 2 ou 3 que você acha que geram mais dúvida e siga.

### Slide 12 — Referências e para aprofundar
Mostre onde aprofundar: aponte 1 ou 2 referências e diga que os links completos estão no Guia de Estudos do módulo. Encerre convidando a turma a praticar no material indicado.

