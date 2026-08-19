# Aula 09 — Testes unitários e a ilusão dos 100% de cobertura

**Projeto Social Garapuvu 2026 · Módulo 1 · Fundamentos CTFL**
Instrutor: Douglas Adriano Queiroz

---

## A pergunta da aula

> "A cobertura do nosso projeto está em 100%. Então está tudo testado, né?"

Não. E este projetinho existe para você **provar isso rodando o código**, não só ouvindo falar.

Aqui você vai encontrar **9 arquivos JavaScript com defeitos reais em todos eles** e uma suíte de testes que:

- passa 100% dos casos ✅
- atinge **100% de statements, 100% de branches, 100% de functions e 100% de lines** ✅
- e **não pega nenhum dos defeitos** ❌

Depois você vai ver o caminho de saída: uma segunda suíte que chega a **100% de cobertura com 98,57% de score de mutação** — e, principalmente, **o que precisou mudar no código** para isso acontecer.

---

## Tecnologias usadas

Tudo aqui é padrão de mercado, gratuito, e roda com um `npm install`.

| Camada | Ferramenta | Versão | Para que serve neste projeto |
|--------|-----------|--------|------------------------------|
| Linguagem / runtime | **Node.js** | 22.x | Roda o JavaScript fora do navegador. O código é CommonJS puro (`require`/`module.exports`), sem bundler |
| Framework de teste unitário | **Jest** | 29.7 | Escreve e roda os testes (`describe`, `it`, `expect`); `it.each` para tabela de casos, `jest.fn()` para dublês, `resolves`/`rejects` para assíncrono |
| Motor de cobertura | **Istanbul**, embutido no Jest | 6.x | Instrumenta o código, conta comandos/ramos/funções executados e gera relatório em texto e HTML |
| Teste de mutação | **Stryker Mutator** (`@stryker-mutator/core`) | 8.7 | Altera o código de propósito e mede quantas alterações a suíte detecta |
| Ponte Stryker ↔ Jest | **@stryker-mutator/jest-runner** | 8.7 | Faz o Stryker rodar a suíte Jest contra cada mutante |

**Por que Jest e não Vitest/Mocha?** Jest é o que mais aparece em vaga de QA no Brasil, junta runner + asserção + mock + cobertura numa peça só, e é o mesmo framework do `bug-report-garapuvu/` do curso. Vitest ou Mocha + Chai + c8 resolveriam igual — o conceito da aula não muda.

**Por que Stryker?** É a ferramenta de referência para teste de mutação em JavaScript/TypeScript, tem integração pronta com Jest e gera relatório HTML navegável. Os equivalentes em outras stacks: **PIT** (Java), **Stryker.NET** (C#), **Stryker4s** (Scala), **mutmut** ou **Cosmic Ray** (Python), **go-mutesting** (Go).

Depois do `npm install`, tudo roda offline: sem banco, sem rede, sem navegador.

---

## Como rodar

```bash
cd cobertura-garapuvu
npm install

npm run cobertura            # 1) a ilusão: 20 testes verdes, 100% de cobertura em src/
npm run realidade            # 2) a realidade: 32 testes que expõem os bugs
npm run robustez             # 3) a saída: 90 testes que blindam src/corrigido/
npm run mutacao              # 4) o juiz: mutação com a suíte fraca       -> 79,59%
npm run mutacao:corrigido    # 5) o juiz de novo: com as suítes fortes    -> 98,57%

npm test                     # roda as três suítes (142 testes)
npm run placar               # roda os quatro números de uma vez
```

Relatórios navegáveis depois de rodar: `coverage/index.html`, `reports/mutacao-ilusao/index.html`, `reports/mutacao-corrigido/index.html`.

---

## O placar, medido

| Métrica | `src/` julgado pela suíte **ilusão** | `src/corrigido/` julgado por **realidade + robustez** |
|---|---|---|
| Testes | 20 | 122 |
| Statements | **100%** (52/52) | **100%** (86/86) |
| Branches | **100%** (17/17) | **100%** (59/59) |
| Functions | **100%** (14/14) | **100%** (20/20) |
| Lines | **100%** (48/48) | **100%** (81/81) |
| **Score de mutação** | **79,59%** — 20 de 98 mutantes sobreviveram | **98,57%** — 3 de 210 sobreviveram |
| Defeitos encontrados | **nenhum** | todos |

As duas colunas têm exatamente o mesmo 100% de cobertura. A diferença só aparece na linha da mutação — e é aí que está a aula inteira.

---

## Como funciona o teste de mutação

### A ideia em uma frase

> Cobertura pergunta: *"o teste passou por essa linha?"*
> Mutação pergunta: *"se eu quebrar essa linha de propósito, algum teste reclama?"*

### O ciclo, passo a passo

1. **Copiar o código.** O Stryker faz uma cópia do projeto num diretório temporário (`.stryker-tmp`). Seu código original nunca é alterado.
2. **Gerar mutantes.** Ele percorre a árvore sintática (AST) de cada arquivo listado em `mutate` e aplica uma pequena alteração por vez. Cada versão alterada é **um mutante**. Neste projeto foram 210 mutantes em 9 arquivos.
3. **Rodar a suíte contra cada mutante.**
4. **Classificar o resultado:**

| Resultado | O que aconteceu | Significa |
|-----------|-----------------|-----------|
| 🟢 **Killed** (morto) | Pelo menos um teste falhou | Ótimo: a suíte percebeu a mudança |
| 🔴 **Survived** (sobreviveu) | Todos os testes passaram mesmo assim | **Buraco na suíte**: ninguém verifica esse comportamento |
| ⏱️ **Timeout** | O mutante travou (loop infinito, por exemplo) | Conta como detectado |
| ⚪ **No coverage** | Nenhum teste sequer executou aquela linha | Buraco de cobertura, antes de ser buraco de asserção |
| ⚠️ **Runtime / compile error** | O mutante nem rodou | **Descartado do cálculo** |

5. **Calcular o score:**

```
score de mutação = (killed + timeout) ÷ (mutantes válidos) × 100
```

Na versão corrigida deste projeto: `(206 + 1) ÷ 210 = 98,57%`.

### Que alterações a ferramenta faz

Os "mutadores" são operadores pequenos e realistas — exatamente os erros que uma pessoa comete:

| Mutador | Original | Mutante |
|---------|----------|---------|
| Aritmético | `a + b` | `a - b` |
| Relacional / igualdade | `x >= 240` | `x > 240` |
| Lógico | `a && b` | `a \|\| b` |
| Expressão condicional | `if (x > 0)` | `if (true)` / `if (false)` |
| Literal string | `'crítica'` | `''` |
| Literal booleano | `true` | `false` |
| Chamada de método | `.trim()` | *(removida)* |
| Regex | `/\s+/` | `/\s/` |
| Bloco | corpo da função | `{}` vazio |
| Array | `[...horas]` | `[]` |

A lista completa do StrykerJS está em <https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/>.

### A configuração deste projeto, linha por linha

Arquivo `stryker.corrigido.conf.json`:

```jsonc
{
  "packageManager": "npm",              // como instalar dependências no sandbox
  "reporters": ["clear-text",           // no terminal, com o diff de cada sobrevivente
                "progress",             // barra de progresso
                "html"],                // relatório navegável
  "testRunner": "jest",                 // usa @stryker-mutator/jest-runner
  "coverageAnalysis": "perTest",        // <- o pulo do gato, explicado abaixo
  "mutate": ["src/corrigido/*.js"],     // QUAIS ARQUIVOS são mutados
  "jest": {
    "projectType": "custom",
    "config": {                         // config Jest só para esta rodada:
      "testEnvironment": "node",
      "testMatch": [                    // QUAIS SUÍTES julgam os mutantes
        "<rootDir>/tests/realidade/**/*.test.js",
        "<rootDir>/tests/robustez/**/*.test.js"
      ]
    }
  },
  "htmlReporter": { "fileName": "reports/mutacao-corrigido/index.html" },
  "thresholds": { "high": 90, "low": 75, "break": null }  // cores do relatório
}
```

Quatro pontos que valem explicar em aula:

- **`mutate` e `testMatch` são independentes.** É essa separação que permite o experimento: o mesmo tipo de código julgado por suítes diferentes. `stryker.ilusao.conf.json` muta `src/*.js` e roda só `tests/ilusao` → **79,59%**. `stryker.corrigido.conf.json` muta `src/corrigido/*.js` e roda `realidade + robustez` → **98,57%**.
- **`coverageAnalysis: "perTest"`** faz o Stryker medir antes quais testes tocam quais linhas e, para cada mutante, rodar **só os testes que passam por aquela linha**. Sem isso a rodada seria muitas vezes mais lenta. É por isso que o relatório diz "Ran 10.55 tests per mutant on average" em vez dos 122 testes.
- **`thresholds.break: null`** significa que a rodada **não derruba o build**. Para transformar mutação em portão de CI, use `"break": 80` — mas leia antes a seção sobre a Lei de Goodhart.
- **`.stryker-tmp/` e `reports/` estão no `.gitignore`.** Nada disso vai para o repositório.

### Mutante equivalente: o limite da técnica

Alguns mutantes **não podem ser mortos**, porque a alteração não muda o comportamento observável. Exemplo real deste projeto:

```js
nome.trim().split(/\s+/).filter(Boolean)   // original
nome.split(/\s+/).filter(Boolean)          // mutante: .trim() removido
```

O `.filter(Boolean)` já descarta os pedaços vazios que o `trim()` evitaria. Os dois códigos produzem **o mesmo resultado para qualquer entrada** — nenhum teste consegue distingui-los, porque não há nada para distinguir.

Isso se chama **mutante equivalente**, e detectá-los automaticamente é um problema **indecidível** (equivale ao problema da parada). São exatamente os 3 sobreviventes que restam no `04-assercao-fraca.js`.

> **Consequência prática:** 100% de score de mutação normalmente é inatingível, e perseguir isso é desperdício. O número serve para você **abrir o relatório e olhar cada sobrevivente**, decidindo caso a caso se é buraco de teste, código redundante ou mutante equivalente.

### Nota: e em linguagens mais tipadas?

O comportamento do teste de mutação muda bastante quando existe um compilador no caminho. Vale saber, porque a maioria de vocês vai trabalhar com Java, C# ou TypeScript.

**1. O compilador mata uma família inteira de defeitos antes do teste rodar.**
Em Java, C# ou TypeScript com `strict`, passar `'200'` onde se espera um número é **erro de compilação**. Todo o Caso 01 deste projeto simplesmente não existiria. Em JavaScript puro isso só aparece em tempo de execução — quando aparece, porque a coerção costuma engolir em silêncio.

**Ressalva importante, e ela não é pequena:** a tipagem protege os **caminhos internos verificados pelo compilador**. Nas fronteiras o defeito volta idêntico:

- `JSON.parse()` devolve `any` no TypeScript — payload de API, `localStorage` e arquivo de configuração entram sem verificação nenhuma;
- `as Foo` (type assertion) é apagado em tempo de execução: não gera exceção se estiver errado;
- `any` desliga a checagem inteira;
- em Java e C#, desserialização (Jackson, Gson, `System.Text.Json`), reflection, `Object`/`dynamic`, casts e *type erasure* de generics produzem `ClassCastException` / `InvalidCastException` em runtime.

É exatamente por isso que existe validação em runtime mesmo em projeto tipado (Zod, io-ts, Bean Validation). **Guarda de contrato continua sendo necessária.**

**2. Mutante inválido é descartado — mas o mecanismo é diferente em cada ferramenta.**

- **Stryker + TypeScript:** com o plugin `@stryker-mutator/typescript-checker`, o mutante que não passa no type-check é marcado como `CompileError` e **sai do denominador** do score (a fórmula oficial é `detected ÷ válidos`). Sem o plugin, ele vai para execução normalmente.
- **PIT (Java):** o PIT **não compila mutante nenhum** — ele muta o *bytecode já compilado*, que já passou pelo type-check. Não existe "mutante que não compila"; o status análogo é `NON_VIABLE` (bytecode que a JVM não consegue carregar).

**3. O conjunto de mutadores é diferente, não menor.**
Em linguagem tipada não faz sentido mutar o tipo de um valor — mas o catálogo continua grande. O PIT tem 11 mutadores ativos por padrão: `CONDITIONALS_BOUNDARY`, `INCREMENTS`, `INVERT_NEGS`, `MATH`, `NEGATE_CONDITIONALS`, `VOID_METHOD_CALLS`, `EMPTY_RETURNS`, `FALSE_RETURNS`, `TRUE_RETURNS`, `NULL_RETURNS` e `PRIMITIVE_RETURNS` (o `REMOVE_CONDITIONALS`, muito citado, **não** é default — precisa ser ligado). Em JavaScript, a literatura acadêmica propõe operadores *extras*, específicos da linguagem: remover `var`, remover `this`, `parseInt` sem radix, `replace` sem a flag global, trocar `undefined` por `null`.

**4. E as exceções?**
Aqui vale desfazer um mal-entendido comum: **nem o Stryker nem o PIT têm um mutador específico de `throw` / `try` / `catch`.** O que acontece é indireto — `VOID_METHOD_CALLS` remove a chamada, `REMOVE_CONDITIONALS` faz o guard sempre passar, `BlockRemoval` esvazia um `catch`. O efeito é parecido, o operador não existe.

O que **é** particular de linguagem tipada: mutadores como `NULL_RETURNS` costumam ser mortos por `NullPointerException` mesmo quando **nenhum teste tem asserção específica** sobre aquilo. Na prática, é o crash que mata o mutante, não a verificação. *(Isso é observação de quem usa a ferramenta, não resultado publicado: existe estudo empírico mostrando que crashes contribuem muito para as mortes de mutantes — Du et al., ISSTA 2023 — mas não medindo esse operador em específico. A crítica publicada ao score do PIT é outra: mutantes redundantes, que morrem em bloco e inflam o número.)*

**5. Mutação vale mais a pena em linguagem dinâmica ou em tipada?**
**Não existe estudo comparativo claro** que responda isso — procurei e não achei. O que a literatura mostra é lateral: em linguagem dinâmica, gerar mutantes sem conhecer o tipo produz muitos *incompetent mutants*, triviais de matar (Abu Hashish, 2013); e em linguagem **compilada** dá para usar o próprio compilador para eliminar mutantes equivalentes e duplicados comparando binários — a técnica **TCE**, que remove cerca de 28% dos mutantes (Papadakis et al., ICSE 2015), sem análogo direto em JavaScript interpretado.

**Resumo honesto para levar:** em linguagem tipada, o compilador cobre os defeitos de tipo e o teste de mutação se concentra nos operadores de **valor, condição e retorno** — que é onde ele rende mais. Em JavaScript, ele acumula os dois papéis. Dizer que "mutação é mais útil em JS porque não há compilador" é uma opinião razoável, mas é opinião.

---

## O que ajustar no código para deixar as funções mais robustas

Esta seção é o entregável prático da aula. Cada item saiu de um **mutante que sobreviveu** — ou seja, de uma fraqueza que a cobertura de 100% não mostrou.

### Achados: o que a mutação encontrou e o que foi feito

| # | Sobrevivente | O que ele revelou | Ajuste aplicado |
|---|--------------|-------------------|-----------------|
| 1 | `typeof v === 'number' && Number.isFinite(v)` → `true && Number.isFinite(v)` | O `typeof` era **redundante**: `Number.isFinite` não faz coerção e já devolve `false` para `'5'`, `true`, `null`, `[]`, `{}` | Condição redundante removida em `01`, `03` e `08` |
| 2 | `if (descontoPercentual > 0)` → `if (true)` | O `if` era um **atalho inútil**: com desconto 0, a própria conta já devolve `valorBase` | `if` removido. Um ramo a menos = um teste a menos para manter |
| 3 | `.trim()` e `/\s+/` removidos sem quebrar nada | O código funcionava **por acidente**: pedaços vazios viravam `undefined` no `map` e sumiam no `join('')` | Adicionado `.filter(Boolean)`, deixando a intenção explícita |
| 4 | *(achado pela suíte de robustez, não pela mutação)* | `Math.round(1.005 * 100)` devolve **100**, não 101 — o erro do float não some ao multiplicar por 100, só muda de casa | Criada `paraCentavos()`, que normaliza com `toFixed(6)` antes de arredondar |

> O achado nº 4 merece destaque: ele apareceu na **segunda** correção do `08-numeros-e-igualdade.js`. A primeira versão "corrigida" já tinha 100% de cobertura e continuava errada em `1.005`. *Corrigido é sempre "corrigido até o próximo teste".*

### Checklist de robustez — para qualquer função, em qualquer projeto

**1. Guarda de contrato no topo da função.**
Valide tipo e faixa **antes** de calcular, e falhe alto: `throw new TypeError(...)`, não `return undefined`. Entrada errada sem guarda vira resultado errado em silêncio — e silêncio não aparece em relatório nenhum.

**2. Uma condição por motivo, sem redundância.**
Se `Number.isFinite(v)` já resolve, não escreva `typeof v === 'number' &&`. Condição redundante é ramo a mais para cobrir, teste a mais para manter, e mutante que sobrevive sem apontar bug nenhum.

**3. Mensagem de erro específica e testável.**
`throw new RangeError('descontoPercentual deve ser um número entre 0 e 100')` é muito melhor que `throw new Error('erro')` — e permite a asserção `.toThrow('...')`, que mata os mutantes de literal string.

**4. Erro nomeado para o que o chamador precisa tratar.**
Classes como `VoluntarioNaoEncontradoError` e `TurmaLotadaError` deixam quem chama distinguir "não achou" de "deu pau" sem comparar texto de mensagem.

**5. Função pura por padrão.**
Nunca mute o argumento recebido: `[...lista].sort(...)`, não `lista.sort(...)`. Nunca acumule em variável de módulo. Se precisar de estado, receba e devolva — não guarde.

**6. Trate a coleção vazia explicitamente.**
`if (lista.length === 0) return 0;` antes de qualquer divisão. Zero, um e muitos são três casos de teste distintos, sempre.

**7. Dinheiro nunca em float.**
Converta para inteiro (centavos) e normalize o ruído: `Math.round(Number((v * 100).toFixed(6)))`. E decida — e **documente no teste** — se o arredondamento é por item ou só no total.

**8. Comparação estrita, e `Object.is` quando `NaN` importa.**
`===` em vez de `==`. `Object.is(a, b)` quando `NaN === NaN` precisar ser verdadeiro.

**9. Assíncrono sempre com `await` no teste.**
`await expect(fn()).rejects.toThrow(...)`. Sem o `await`, o caso termina antes da rejeição e o teste passa verde por engano.

**10. Intenção explícita no lugar de acidente da linguagem.**
`.filter(Boolean)` em vez de confiar que `join('')` engole `undefined`. Código que só funciona por um detalhe da especificação da linguagem quebra na próxima refatoração.

### Como escrever o teste que mata o mutante

| Mutante | Como matar |
|---------|-----------|
| `x >= 240` → `x > 240` | Testar **exatamente** 239, 240 e 241 |
| `a && b` → `a \|\| b` | Testar cada operando isolado (tabela-verdade) |
| `if (cond)` → `if (true)` | Testar o caminho em que `cond` é falsa e o resultado muda |
| `'mensagem'` → `''` | Asserção com `.toThrow('mensagem exata')` |
| `a + b` → `a - b` | Usar valores em que soma e subtração diferem (evitar `0 + 0`) |
| `[...lista]` → `[]` | Verificar o **conteúdo** e o tamanho do retorno, não só que existe |
| `.sort((a,b) => b-a)` → `a-b` | Comparar o array inteiro com `toEqual([...])`, em ordem |
| Corpo da função → `{}` | Ter pelo menos uma asserção sobre o valor de retorno |

---

## Os 9 casos

| # | Arquivo | O que a cobertura não vê |
|---|---------|--------------------------|
| 01 | `01-tipos-inesperados.js` | Tipo inesperado: string, `null`, `undefined`, array e objeto entram na função e saem resultados errados **sem nenhum erro** |
| 02 | `02-condicoes-compostas.js` | Cobertura de **decisão** ≠ cobertura de **condição** (MC/DC): o `\|\|` no lugar do `&&` sobrevive |
| 03 | `03-valor-limite.js` | O defeito mora na fronteira: `>` em vez de `>=`. Testar 300 e 120 não encontra o bug que está em 240 |
| 04 | `04-assercao-fraca.js` | Teste sem oráculo: `toBeDefined()` executa a linha e não verifica nada |
| 05 | `05-efeito-colateral.js` | `sort()` ordena como texto e muta o array de quem chamou; estado de módulo acumula entre chamadas |
| 06 | `06-async.js` | Promise sem `await` no teste: o caso termina antes do erro acontecer |
| 07 | `07-loop-e-lista-vazia.js` | Loop rodado uma vez pinta a linha de verde; os bugs estão em zero e em muitos itens |
| 08 | `08-numeros-e-igualdade.js` | `0.1 + 0.2 !== 0.3`, coerção do `==`, e `NaN !== NaN` |
| 09 | `09-requisito-ausente.js` | **O código que não existe.** Requisito esquecido = zero linhas = 100% de cobertura |

---

## Caso 01 em detalhe — o clássico do JavaScript

O que o desenvolvedor escreveu:

```js
function calcularInscricao(valorBase, descontoPercentual) {
  if (descontoPercentual > 0) {
    return valorBase - valorBase * (descontoPercentual / 100);
  }
  return valorBase;
}
```

O que o teste verificou:

```js
expect(calcularInscricao(200, 10)).toBe(180);  // ✅
expect(calcularInscricao(200, 0)).toBe(200);   // ✅  -> 100% de cobertura
```

O que ninguém testou:

```js
calcularInscricao('200', 0)      // '200'  (string!) — o front vai concatenar depois
calcularInscricao(null, 10)      // 0      — inscrição de graça
calcularInscricao(undefined, 10) // NaN    — "R$ NaN" na tela
calcularInscricao([], 10)        // 0
calcularInscricao({}, 10)        // NaN
calcularInscricao(200, -50)      // 200    — desconto negativo ignorado
calcularInscricao(200, 150)      // -100   — o projeto paga o aluno
```

Nada disso lança erro. Em JavaScript, **tipo errado não é exceção — é resultado errado em silêncio**. Um formulário HTML devolve string por padrão; uma API devolve `null`; um campo opcional devolve `undefined`. Os três chegam nessa função todo dia.

---

## Por que 100% não é 100%

### 1. Cobertura mede o código que existe, não o requisito

Requisito esquecido não gera linha. Linha que não existe não pode ficar descoberta. **O relatório continua em 100%.** É o caso 09 — e é o furo mais caro dos nove, porque nenhuma ferramenta encontra: quem encontra é revisão de requisitos, teste estático e rastreabilidade requisito → caso de teste.

### 2. Cobertura mede execução, não verificação

O contador sobe quando a linha roda. Ele não sabe se você **olhou** o resultado. Um teste sem asserção — ou com asserção fraca, como `toBeDefined()` — cobre tudo e prova nada. É o caso 04, o de pior score de mutação na suíte fraca (25%).

### 3. Existem vários tipos de cobertura, e o fácil é o mais fraco

| Critério | O que exige | Força |
|----------|-------------|-------|
| Statement (comando) | cada comando executado 1x | fraca |
| Branch / decisão | cada decisão avaliada como V e F | média |
| Condição / MC/DC | cada condição atômica influenciando o resultado sozinha | forte |
| Caminho | todas as combinações de caminho | inviável na prática |

Quando alguém diz "100% de cobertura", quase sempre está falando do critério mais fraco da tabela. O caso 02 tem 100% de comando **e** de ramo com o operador lógico errado.

### 4. Cobertura não mede dados

A linha `total += valor` fica coberta com `valor = 10`. Continua coberta — e continua errada — com `0.1`, `-5`, `NaN`, `undefined` e `999999999999`. É o caso 08.

### 5. Cobertura não mede tempo, ordem nem estado

Concorrência, `await` esquecido, cache sujo, variável de módulo que sobrevive entre chamadas. São os casos 05 e 06. A linha roda; o problema está em **quando** e **quantas vezes**.

### 6. Cobertura não mede integração, ambiente nem o mundo real

100% de cobertura unitária não diz nada sobre: o banco fora do ar, a API que mudou o contrato, o fuso do servidor, o navegador do usuário, a rede lenta no 3G, a acessibilidade da tela, o desempenho com 10 mil registros. Por isso a **pirâmide de testes** desta aula tem mais de um andar.

---

## Onde isso encosta na CTFL 4.0

Esta aula não inventa nada: cada peça do projeto tem endereço no syllabus.

| Conceito do projeto | Onde está na CTFL 4.0 | O que o syllabus diz |
|---|---|---|
| "100% de cobertura não é software sem bug" | **1.3 — Princípios do teste** | 1º princípio: *"Testes mostram a presença de defeitos, não a sua ausência"*. 2º: *"Testes exaustivos são impossíveis"* |
| Caso 09 (requisito que não virou código) | **1.4.4 — Rastreabilidade entre a base de teste e os produtos de trabalho** | Cobertura precisa ser medida **contra a base de teste** (os requisitos), não só contra o código |
| Revisão pega o que ferramenta nenhuma pega | **Capítulo 3 — Teste estático** | Revisão e análise estática encontram defeitos **em requisitos**, antes de existir código para executar |
| Zero / um / muitos; válido / inválido | **4.2.1 — Particionamento de equivalência** | Dividir o domínio em partições e testar um representante de cada |
| Caso 03 (fronteira em 60 e 240) | **4.2.2 — Análise de valor limite** | Testar nas bordas das partições, onde os defeitos se concentram |
| Tabela-verdade do caso 02 | **4.2.3 — Teste por tabela de decisão** | Combinar condições sistematicamente, em vez de "no olho" |
| Cobertura de comandos | **4.3.1 — Teste e cobertura de comandos** | Percentual de comandos executáveis exercitados |
| Cobertura de ramos | **4.3.2 — Teste e cobertura de ramos** | Percentual de ramos exercitados. Mais forte que comandos — e ainda assim não basta |
| Por que caixa-branca não substitui caixa-preta | **4.3.3 — O valor do teste caixa-branca** | Cobertura estrutural mede **a suíte**, não a corretude do software |
| Cobertura como métrica de acompanhamento | **5.1 — Planejamento** e **5.3 — Monitoramento e controle** | Métricas de cobertura servem para monitorar e reportar progresso |
| Critérios de saída / Definição de Pronto | **5.1.5 — Critérios de entrada e de saída** | Cobertura pode **compor** os critérios de saída, junto com outros — nunca sozinha |

> **Honestidade sobre o escopo:** **teste de mutação não é conteúdo de prova da CTFL Foundation** — ele aparece no nível Advanced (Test Analyst / Technical Test Analyst). Está nesta aula porque é a forma mais direta de demonstrar, na prática, o que o syllabus afirma no princípio 1 — e porque o mercado usa.

---

## 100% de cobertura ≠ software sem bugs

Não é opinião: é um dos **sete princípios do teste** do syllabus CTFL 4.0 (seção 1.3):

> **"Testes mostram a presença de defeitos, não a sua ausência."**

E também:

> **"Testes exaustivos são impossíveis."** Uma função com dois parâmetros de 32 bits tem mais combinações de entrada do que dá para testar na vida de qualquer projeto.

Cobertura responde **"que parte do código meu teste visitou?"**.
Ela nunca responde **"meu software está correto?"**.

### E tem o efeito colateral: a Lei de Goodhart

> *"Quando uma medida vira meta, ela deixa de ser uma boa medida."*

Coloque "100% de cobertura" como meta obrigatória no CI e observe o que o time entrega em três sprints:

- testes que chamam a função e não verificam nada;
- `/* istanbul ignore next */` espalhado pelo código;
- testes escritos **depois**, copiando o valor esperado da saída do código (veja o caso 07 na suíte "ilusão": o teste documenta o bug como se fosse a regra);
- código com `if` removido "para melhorar a cobertura".

Por isso, na Aula 09, cobertura entra como **indicador de apoio**, nunca como KPI isolado. O que dá para acompanhar junto:

- **densidade de defeitos** por módulo e defeitos escapados para produção;
- **score de mutação** (mede a força da suíte, não o tamanho dela);
- rastreabilidade **requisito → caso de teste** (é o que pega o caso 09);
- tempo médio para detectar e corrigir (lead time de defeito).

E vale para a mutação também: se você transformar 100% de score de mutação em meta, o time vai gastar semanas perseguindo mutante equivalente — que, por definição, não pode ser morto.

---

## Então cobertura não serve para nada?

Serve — e muito. Só não serve para o que costumam usar.

**Cobertura é ótima lida ao contrário.** O número alto não prova nada; o número baixo **denuncia**. Abra `coverage/index.html` depois de `npm run cobertura` e olhe as linhas vermelhas: ali estão os tratamentos de erro que ninguém exercita, o `catch` que nunca rodou, a regra de negócio que entrou sem teste. É uma **lista de perguntas**, não um selo de qualidade.

Regra prática para levar para o time:

> Cobertura baixa é evidência forte de que falta teste.
> Cobertura alta **não** é evidência de que o teste é bom.

---

## Estrutura do projeto

```
cobertura-garapuvu/
├── src/                         # 9 arquivos com bugs (é aqui que a cobertura dá 100%)
│   ├── 01-tipos-inesperados.js
│   ├── ...
│   ├── 09-requisito-ausente.js
│   └── corrigido/               # as mesmas 9 funções, robustecidas
├── tests/
│   ├── ilusao/                  # 20 testes  — 100% de cobertura, 0 bugs encontrados
│   ├── realidade/               # 32 testes  — expõem o bug e validam a correção
│   └── robustez/                # 90 testes  — 100% de cobertura + 98,57% de mutação
├── docs/
│   └── exercicios.md            # roteiro de sala + desafios
├── slides/                      # material de apoio da aula (PDF)
├── jest.config.js               # coverageThreshold em 100 (o "portão" que não protege)
├── stryker.ilusao.conf.json     # mutação em src/ com a suíte fraca        -> 79,59%
├── stryker.corrigido.conf.json  # mutação em src/corrigido/ com as fortes  -> 98,57%
└── stryker.conf.json            # mutação em src/ com todas as suítes
```

Repare no `jest.config.js`: o `coverageThreshold` está em **100** para os quatro critérios. É exatamente o portão de qualidade que muitas equipes colocam no CI achando que ele garante software sem defeito. **Este projeto passa no portão com nove arquivos defeituosos dentro.**

---

## Leve daqui

- **Cobertura é um mapa de onde o teste passou, não um atestado de que o software funciona.**
- Todo relatório de cobertura tem um ponto cego do tamanho do requisito que você esqueceu de implementar.
- Em JavaScript, tipo errado quase nunca vira exceção — vira resultado errado em silêncio. Teste `null`, `undefined`, string, array, negativo, zero e valor gigante.
- Em linguagem tipada o compilador cobre boa parte disso — mas não nas fronteiras (`JSON.parse`, `any`, desserialização, reflection). Guarda de contrato continua sendo necessária.
- Teste o valor limite, não o meio do intervalo. O bug mora na fronteira.
- Se o seu teste não tem uma asserção específica, ele não é um teste: é um aquecimento.
- Teste de mutação mede a **força** da suíte. Use o relatório para olhar cada sobrevivente — não para perseguir o número.
- Métrica boa é métrica que você usa para **perguntar**, não para **comemorar**.

---

## Glossário da aula

| Termo | Significado |
|-------|-------------|
| **Teste unitário** | Testa a menor parte isolada do software (uma função, um módulo) |
| **Cobertura de código** | % do código executado durante os testes |
| **Cobertura de comandos** | Cada linha/comando executado ao menos uma vez |
| **Cobertura de ramos** | Cada decisão avaliada como verdadeira e como falsa |
| **MC/DC** | Modified Condition/Decision Coverage — cada condição atômica influencia o resultado de forma independente |
| **Oráculo de teste** | A fonte que diz qual é o resultado correto esperado |
| **Asserção** | A verificação em si (`expect(x).toBe(y)`) |
| **Teste de mutação** | Altera o código de propósito para ver se a suíte percebe |
| **Mutante** | Uma versão do código com uma alteração introduzida pela ferramenta |
| **Mutante morto (killed)** | Alteração que fez pelo menos um teste falhar — a suíte percebeu |
| **Mutante sobrevivente** | Alteração que nenhum teste detectou = buraco na suíte |
| **Mutante equivalente** | Alteração que não muda o comportamento observável — impossível de matar |
| **Score de mutação** | (mortos + timeouts) ÷ mutantes válidos × 100 |
| **Guarda de contrato** | Validação de tipo e faixa no topo da função, antes de qualquer cálculo |
| **Coerção de tipo** | Conversão automática de tipo do JavaScript (`'3' + 2 === '32'`) |
| **Valor limite** | Valor exatamente na fronteira de uma faixa (0, 1, 59, 60, 239, 240) |
| **Função pura** | Não muta a entrada nem guarda estado; mesma entrada, mesma saída |
| **Lei de Goodhart** | Quando uma medida vira meta, deixa de ser uma boa medida |

---

## Referências

- **BSTQB / ISTQB.** *Syllabus Certified Tester Foundation Level (CTFL) v4.0* — versão em português. Seções 1.3 (Princípios do teste), 1.4.4 (Rastreabilidade), capítulo 3 (Teste estático), 4.2 (Técnicas caixa-preta), 4.3 (Técnicas caixa-branca), 5.1 (Planejamento e critérios de saída), 5.3 (Monitoramento e controle).
- **ISTQB Glossary** — <https://glossary.istqb.org>
- **Jest** — documentação de cobertura: <https://jestjs.io/docs/configuration#collectcoverage-boolean>
- **Stryker Mutator** — <https://stryker-mutator.io>
- **Stryker — lista completa de mutadores:** <https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/>
- **Stryker — estados do mutante e cálculo do score:** <https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/>
- **PIT (Java) — mutadores:** <https://pitest.org/quickstart/mutators/>
- **Istanbul / nyc** — motor de cobertura usado pelo Jest: <https://istanbul.js.org>
- **MDN** — coerção e igualdade em JavaScript: <https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Equality_comparisons_and_sameness>
- **IEEE 754** — por que `0.1 + 0.2 !== 0.3`: <https://0.30000000000000004.com>
- Du et al. (ISSTA 2023), *To Kill a Mutant: An Empirical Study of Mutation Testing Kills* — sobre o papel dos crashes nas mortes de mutantes.
- Papadakis et al. (ICSE 2015), *Trivial Compiler Equivalence* — eliminação de mutantes equivalentes em linguagens compiladas.
- Mirshokraie & Mesbah (ICST 2013), *Efficient JavaScript Mutation Testing* — operadores de mutação específicos de JavaScript.
- **Goodhart, C.** (1975) — a formulação popular da lei é atribuída a Marilyn Strathern (1997), resumindo Goodhart.

---

*Projeto Social Garapuvu 2026 · Módulo 1 · Aula 09 — Pirâmide, Métricas e KPIs*
