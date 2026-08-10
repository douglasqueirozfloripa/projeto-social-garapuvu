# Testes de Performance com k6 — FreelaAvalia 360

> **Aula 8 — Ferramentas, Performance e Planning Poker** · Projeto Social Garapuvu 2026

Subprojeto de **teste de performance** da API do FreelaAvalia 360, feito com **[k6](https://k6.io)** (Grafana k6). Aqui você aprende, na prática, a diferença entre smoke, carga, rampage e spike, o que é um **quality gate** e como criar **métricas e asserts customizados**.

---

## 1. Sobre o projeto

O que testamos é a **API** do FreelaAvalia 360 (o backend em `../backend`), que roda por padrão em `http://localhost:3001`. Os scripts exercitam os endpoints reais da aplicação: `/health`, `/usuarios` (cadastro), `/login`, `/contratos` (listar e criar), etc.

Objetivo pedagógico: mostrar **como uma ferramenta de performance funciona** e como transformar requisitos não-funcionais (tempo de resposta, taxa de erro) em critérios automáticos que **aprovam ou reprovam** um build.

### Atenção: este backend NÃO tem banco de dados

⚠️ Leia isto antes de interpretar qualquer número deste projeto.

O backend é **Node.js + Express puro**, e guarda tudo em **arrays na memória do
processo** (`../backend/src/repositorio.js`). Não há Postgres, MySQL, MongoDB,
SQLite, Prisma, ORM, nem arquivo de migração — a única dependência de produção do
backend é o `express`. É uma decisão **didática**, para a aula focar em teste e
não em infraestrutura.

Três consequências que mudam a leitura dos resultados:

| | Aqui (memória) | Numa app com banco real |
|---|---|---|
| **Onde o tempo é gasto** | CPU: parse do JSON, laços em JavaScript, serialização da resposta | normalmente **na query**: I/O de disco/rede, pool de conexões, locks, plano de execução |
| **Ordem de grandeza** | respostas em **poucos ms** (o `p(95)<500` dos scripts é folgado de propósito) | dezenas a centenas de ms; os mesmos thresholds reprovariam |
| **Volume de dados** | zera a cada reinício do backend | acumula — e é justamente aí que aparece a degradação por volume |

Portanto:

- **Os números daqui não estimam a performance de uma versão com banco.** Ao
  plugar um banco de verdade, os thresholds precisam ser **recalibrados** — e
  gargalos novos vão aparecer (N+1, falta de índice, conexões esgotadas).
- **Um teste de carga sozinho não enxerga degradação por volume**, porque cada
  bateria começa com a base vazia. Para investigar isso é preciso **popular a
  base antes** de medir — foi o que fizemos no experimento da [seção 12](#12-experimento-do-relatório-do-k6-para-a-otimização-do-backend).
- **"Otimizar a query" neste projeto** significa otimizar as buscas em array do
  repositório. Não é SQL, mas o raciocínio é o mesmo — inclusive a solução, que
  foi criar **índices**. É a versão didática do problema real.
- **Reinicie o backend depois de alterá-lo** (`cd ../backend && npm start`): o
  processo no ar mantém o código *e* os dados antigos em memória.

> A troca do armazenamento em memória por **persistência real** está listada como
> próximo passo no `../README.md` do projeto. Quando isso acontecer, esta seção e
> os thresholds dos scripts precisam ser revisitados.

### Estrutura

```
performance-k6/
├── README.md                 ← este arquivo
├── run.sh                    ← roda o k6 já com o .env carregado (o k6 não lê .env sozinho)
├── .env / .env.example       ← TEMA do relatório e BASE_URL da API
├── assets/                   ← SVGs de fundo do relatório (versões clara e escura)
├── lib/
│   ├── helpers.js            ← funções compartilhadas (cadastrar, login, criar projeto...)
│   ├── report.js             ← gera o RELATÓRIO HTML a partir do resumo do k6
│   └── tokens.js             ← design tokens de cor (temas do relatório)
├── smoke.js                  ← teste de fumaça (a API está de pé?)
├── load.js                   ← teste de carga com RAMPAGE (picos alto e baixo)
├── spike.js                  ← teste de PICO abrupto (aguenta e recupera?)
├── custom-quality-gate.js    ← métricas + quality gate customizados + asserts
├── gate-exigente.js          ← SIMULAÇÃO DE FALHA: gate apertado, reprova de propósito
└── reports/                  ← relatórios gerados (HTML + JSON) — fora do git
```

---

## 2. Pré-requisitos

**A API precisa estar rodando** antes de disparar os testes:

```bash
cd ../backend
npm install
npm start          # sobe a API em http://localhost:3001
```

Deixe esse terminal aberto e rode o k6 em **outro** terminal.

---

## 3. Instalação do k6

O k6 é um binário único (escrito em Go). Ele **não** é instalado via `npm` — escolha o seu sistema:

| Sistema | Comando |
|---|---|
| **macOS** (Homebrew) | `brew install k6` |
| **Windows** (winget) | `winget install k6 --source winget` |
| **Windows** (Chocolatey) | `choco install k6` |
| **Linux** (Debian/Ubuntu) | `sudo gpg -k && sudo apt-get install k6` (após adicionar o repositório oficial) |
| **Qualquer um** (Docker) | `docker run --rm -i grafana/k6 run - < smoke.js` |

Verifique a instalação:

```bash
k6 version
```

> Documentação oficial de instalação: https://grafana.com/docs/k6/latest/set-up/install-k6/

---

## 4. Como rodar

```bash
k6 run smoke.js                 # começa SEMPRE por aqui (valida o ambiente)
k6 run load.js                  # carga com rampage
k6 run spike.js                 # pico abrupto
k6 run custom-quality-gate.js   # quality gate customizado
k6 run gate-exigente.js         # SIMULAÇÃO DE FALHA (reprova de propósito, exit ≠ 0)

# Apontar para outro ambiente (sem editar código):
k6 run -e BASE_URL=https://staging.seu-dominio.dev load.js

# Salvar um resumo em JSON (para anexar em relatório/CI):
k6 run --summary-export=resultado.json load.js
```

Cada execução também grava um **relatório HTML** em `reports/<nome-do-teste>.html`
— veja a [seção 8.1](#81-relatório-em-html).

### 4.1. As quatro combinações (tema × quality gate)

Duas variáveis independentes: o **tema** de cores (via env `TEMA`) e o **quality
gate** (via qual script você roda). Combinando:

- **Quality gate default (passa/verde):** `custom-quality-gate.js` — fluxo de negócio com thresholds calibrados para **passar**.
- **Quality gate customizado simulando falhas (reprova/vermelho):** `gate-exigente.js` — o **mesmo** fluxo sob um SLA agressivo; reprova de propósito e retorna **exit code ≠ 0**.
- **Tema default:** não passar `TEMA` (cai em `garapuvu`).
- **Tema Joaquina:** `-e TEMA=joaquina`.

> Pré-requisito: a API precisa estar no ar (`cd ../backend && npm start`).

| | Tema default (garapuvu) | Tema Joaquina |
|---|---|---|
| **Gate default (verde)** | **(a)** | **(c)** |
| **Gate custom simulando falhas (vermelho)** | **(b)** | **(d)** |

```bash
# (a) tema default + quality gate default  → relatório VERDE
k6 run custom-quality-gate.js
#     abre: reports/custom-quality-gate.html   (tema garapuvu)

# (b) tema default + quality gate custom simulando falhas  → relatório VERMELHO (exit ≠ 0)
k6 run gate-exigente.js
#     abre: reports/gate-exigente.html   (tema garapuvu)

# (c) tema Joaquina + quality gate default  → relatório VERDE
k6 run -e TEMA=joaquina custom-quality-gate.js
#     abre: reports/custom-quality-gate.html   (tema joaquina)

# (d) tema Joaquina + quality gate custom simulando falhas  → relatório VERMELHO (exit ≠ 0)
k6 run -e TEMA=joaquina gate-exigente.js
#     abre: reports/gate-exigente.html   (tema joaquina)
```

Observações:

- Em **(b)** e **(d)** o k6 encerra com **status ≠ 0** e o `gate-exigente.js` pode ser **abortado no meio** pelo `abortOnFail` — é o comportamento esperado (mostra o gate barrando o build). O relatório HTML é gerado do mesmo jeito.
- O `-e TEMA=` vale para **qualquer** script (também `smoke.js`, `load.js`, `spike.js`).
- Alternativa ao `-e TEMA=joaquina`: rodar pelo wrapper `./run.sh <script>.js`, que carrega o `.env`. O k6 **não** lê o `.env` por conta própria (veja a seção "Escolher o tema").

---

## 5. Rampage: simulando picos altos e baixos

**Rampage** é a variação **gradual** do número de usuários virtuais (VUs) ao longo do tempo. No k6 isso é feito com o executor `ramping-vus` e uma lista de **stages** — cada stage diz *"em X tempo, chegue a Y usuários"*. O k6 interpola linearmente entre os alvos, criando as rampas de subida e descida.

Em `load.js`:

```js
stages: [
  { duration: "30s", target: 20 },  // ↗ pico BAIXO (manhã)
  { duration: "1m",  target: 20 },  // → patamar estável
  { duration: "30s", target: 100 }, // ↗ PICO ALTO (horário de pico)
  { duration: "1m",  target: 100 }, // → sustenta o pico
  { duration: "30s", target: 10 },  // ↘ VALE (fim do dia)
  { duration: "20s", target: 0 },   // ↘ ramp-down
]
```

Visualmente, o número de usuários desenha esta curva:

```
VUs
100 |            ______
    |           /      \
 20 |    ______/        \
    |   /                \___
  0 |__/                     \__
      manhã   pico alto     vale
```

- **Pico baixo**: valida o comportamento em uso normal.
- **Pico alto**: mostra se a app aguenta o horário de maior movimento.
- **Vale / ramp-down**: verifica se os recursos são liberados quando o tráfego cai (memória, conexões).

O **`spike.js`** é um caso especial de rampage: em vez de subir suave, ele **salta** (10 → 300 VUs em 10s) para simular um evento repentino e checar a **recuperação** depois do pico.

Tipos de teste de performance cobertos:

| Script | Tipo | Pergunta que responde |
|---|---|---|
| `smoke.js` | Smoke | A API está de pé e o caminho principal funciona? |
| `load.js` | Carga / Rampage | Como ela se comporta no dia a dia, incluindo o pico? |
| `spike.js` | Spike | Aguenta um susto repentino e se recupera? |
| `custom-quality-gate.js` | Carga + métricas de negócio | O fluxo de negócio está dentro do acordado? |
| `gate-exigente.js` | Carga sob SLA agressivo | E quando **não** está? (simulação de reprovação) |

---

## 6. Quality gate: mudando a configuração

No k6, o **quality gate** (portão de qualidade) é o bloco `thresholds` dentro de `options`. Se **qualquer** threshold falhar, o k6 encerra com **código de saída ≠ 0** — o que faz o passo **reprovar no CI/CD** automaticamente.

Exemplo (em `load.js`):

```js
export const options = {
  thresholds: {
    http_req_failed:   ["rate<0.02"],                 // < 2% de erros
    http_req_duration: ["p(95)<800", "p(99)<1500"],   // p95 < 800ms E p99 < 1.5s
    checks:            ["rate>0.99"],                 // > 99% dos checks passam
  },
};
```

**Como MUDAR o gate** — basta editar esses valores:

- Mais **rígido**: diminua o tempo (`p(95)<500`) ou a taxa de erro (`rate<0.01`).
- Mais **tolerante**: aumente (`p(95)<1200`, `rate<0.05`) — típico em spike.
- **Por endpoint**: use tags. Ex.: só a rota crítica precisa ser rápida:

```js
thresholds: {
  "http_req_duration{tipo:critico}": ["p(95)<1000"],
}
// ...e marque a requisição com a tag:
http.post(url, corpo, { headers, tags: { tipo: "critico" } });
```

Sintaxe rápida dos alvos: `p(95)` = percentil 95, `avg` = média, `max` = máximo, `rate` = proporção (0 a 1), `count` = total.

---

## 7. Custom quality gate e asserts customizados

Às vezes o que importa não é uma métrica de HTTP, e sim uma métrica **de negócio**. O arquivo `custom-quality-gate.js` mostra o passo a passo.

**a) Crie métricas customizadas** (importadas de `k6/metrics`):

```js
import { Trend, Rate, Counter } from "k6/metrics";

const fluxoNegocioDuracao = new Trend("fluxo_negocio_duracao", true); // tempo do fluxo
const loginSucesso        = new Rate("login_sucesso");                 // % de sucesso
const projetosCriados     = new Counter("projetos_criados");           // total criado
```

| Tipo | Para que serve | Exemplo |
|---|---|---|
| `Trend` | distribuição de valores (min/avg/p95/max) | duração de um fluxo |
| `Rate` | proporção verdadeiro/falso | % de logins bem-sucedidos |
| `Counter` | soma acumulada | nº de projetos criados |
| `Gauge` | último valor observado | tamanho de uma fila |

**b) Alimente as métricas** durante o teste:

```js
loginSucesso.add(okLogin);                       // true/false → o k6 calcula a %
projetosCriados.add(1);                           // incrementa o contador
fluxoNegocioDuracao.add(Date.now() - inicio);     // registra a duração
```

**c) Defina o gate sobre elas** (é o *custom quality gate*):

```js
thresholds: {
  fluxo_negocio_duracao: ["p(95)<2000"],  // 95% dos fluxos em < 2s
  login_sucesso:         ["rate>0.98"],   // > 98% de sucesso
  projetos_criados:      ["count>50"],    // ao menos 50 no teste
}
```

**d) Asserts customizados** com `check()` — inclusive validando o **corpo JSON** (não só o status):

```js
const okProj = check(proj, {
  "projeto criado → 201":     (r) => r.status === 201,
  "projeto veio com id":      (r) => r.json("id") !== undefined,
  "status inicial = aberto":  (r) => r.json("status") === "aberto",
  "destaque começa desligado":(r) => r.json("destaque") === false,
});
```

> **`check` vs `threshold`:** o `check` é um *assert* de uma iteração (registra passou/falhou) — sozinho **não reprova** o teste. Quem reprova é o `threshold`. Por isso a dupla comum é: `checks: ["rate>0.99"]` no gate + vários `check()` no código.

**e) Abortar quando degrada** — não adianta martelar um sistema já caído:

```js
"http_req_duration{tipo:critico}": [
  { threshold: "p(95)<1000", abortOnFail: true, delayAbortEval: "10s" },
]
```

Se o p95 da rota crítica passar de 1s, o teste é **abortado** (após 10s de aquecimento).

---

## 7.1. Simulando a REPROVAÇÃO — `gate-exigente.js`

Testes que só passam ensinam metade da história. Um quality gate só prova que
funciona quando você o vê **barrando** alguma coisa — e é fácil demais montar um
gate frouxo que nunca reclama de nada. O `gate-exigente.js` existe para gerar,
sob demanda, o relatório vermelho: o mesmo fluxo de negócio do
`custom-quality-gate.js`, submetido a um **SLA agressivo**, como se um cliente
premium tivesse contratado tempos de resposta de gente grande sem a infra de
gente grande.

```bash
k6 run gate-exigente.js     # espere exit code ≠ 0 e HTML em vermelho
open reports/gate-exigente.html
```

### Os três caminhos da falha

A reprovação é **deliberada** e vem por três mecanismos diferentes — de
propósito, para o relatório mostrar os três tipos lado a lado:

| # | Mecanismo | No script | O que ensina |
|---|---|---|---|
| 1 | **Threshold de tempo** | `http_req_duration: ["p(95)<2", "p(99)<3"]` | requisito não-funcional que a app não entrega sob 50 VUs |
| 2 | **Assert de negócio** | check `"projeto traz prazo de entrega"` | requisito **não implementado** aparece como assert vermelho, não como erro de rede |
| 3 | **Threshold com `abortOnFail`** | `http_req_duration{tipo:critico}` | o gate **interrompe** a execução no meio, em vez de martelar um sistema degradado |

O detalhe mais instrutivo é o **(2)**. O check cobra o campo `prazo` na resposta
de `POST /contratos` — campo que a API realmente não devolve, porque a
funcionalidade não existe. Não é um teste "quebrado": é exatamente assim que um
requisito acordado e não entregue se manifesta numa suíte de performance. Como o
gate exige `checks: ["rate==1.00"]`, esse único assert derruba o build sozinho.

### Resultado real de uma execução

```
requisições .... 3600        p(95) .......... 8.10 ms
erros .......... 0%          checks ......... 80%
quality gate ... REPROVADO   →  exit code 99
```

Repare em dois pontos:

- **Taxa de erro 0%.** Nenhuma requisição falhou — a API respondeu tudo com
  sucesso. O build foi barrado por **lentidão e por requisito faltando**, não por
  indisponibilidade. Gate bom reprova sem precisar que nada caia.
- **Duração real ~12s, não os 45s configurados.** O `abortOnFail` cortou a
  execução assim que o p(95) da rota crítica estourou. No HTML isso aparece no
  cabeçalho (`duração 12s`) — é o gate economizando tempo de pipeline.

O relatório vermelho abre com uma caixa **"Por que o build foi barrado"**,
listando cada threshold violado com *esperado × obtido* e cada assert que falhou,
com a contagem. Sem isso, num relatório com dezenas de métricas, o motivo da
reprovação se perde.

### `exit code 99` — o número que trava o CI

Quando um threshold é violado, o k6 sai com **99** (não 1). Qualquer runner de CI
trata "≠ 0" como falha, então o pipeline reprova sozinho — sem `if`, sem script
de parsing, sem ninguém lendo log. Compare:

```bash
k6 run custom-quality-gate.js ; echo $?   # → 0    build segue
k6 run gate-exigente.js       ; echo $?   # → 99   build barrado
```

### Este script NÃO afeta os outros testes

Ponto importante: **as `options` do k6 são por script**. Cada arquivo `.js`
exporta o seu próprio bloco `options` com os seus próprios `thresholds`, e o k6
carrega **um script por execução**. Não existe configuração global de gate neste
projeto — o `gate-exigente.js` não tem como vazar o SLA apertado dele para o
`smoke.js`, o `load.js`, o `spike.js` ou o `custom-quality-gate.js`.

Os quatro testes originais mantêm exatamente os thresholds que sempre tiveram.
Bateria completa, com a API no ar:

| Script | Gate | Exit code |
|---|---|---|
| `smoke.js` | APROVADO | 0 |
| `custom-quality-gate.js` | APROVADO | 0 |
| `spike.js` | APROVADO | 0 |
| `load.js` | APROVADO | 0 |
| `gate-exigente.js` | **REPROVADO** | **99** |

A única coisa que os cinco scripts compartilham em `options` é
`summaryTrendStats: TREND_STATS` — e isso **não é um gate**: apenas pede ao k6
que calcule também o `p(99)` no resumo final, para o relatório conseguir exibir o
valor obtido ao lado do esperado. Sem essa linha, um threshold `p(99)<1500`
continua sendo avaliado normalmente (o k6 usa os dados brutos), mas a coluna
"Obtido" do HTML mostraria *"não coletado"*.

**A coluna "Falhas"** ao lado de "Obtido" traduz a porcentagem em números
absolutos — `80%` de checks vira `1200 de 6000`, que é o que você leva para a
conversa com o time. Ela só aparece para métricas do tipo **`rate`**, as únicas
que contam observação por observação; em `trend` (percentis) e `counter` o resumo
do k6 não guarda quantas observações estouraram o limite, então mostra `—`.

> Detalhe que engana muita gente: numa `Rate` do k6, `passes` é a contagem de
> valores `true`. Como em **`http_req_failed`** o `true` significa *"a requisição
> falhou"*, ali o lado ruim é `passes` — nas outras rates (`checks`, rates suas)
> o lado ruim é `fails`. O relatório já trata essa inversão.

> **Cuidado ao interpretar uma bateria inteira.** Se **todos** os testes
> reprovarem de uma vez com **100% de erro** e `p(95) = 0 ms`, o problema quase
> nunca é a aplicação: é a API que caiu ou não subiu. Confira com
> `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health` antes de
> acreditar no relatório.

---

## 8. Lendo o resultado

Ao final, o k6 imprime um resumo no terminal. Os campos que mais importam:

- `http_req_duration` → `avg`, `p(95)`, `p(99)`, `max` (tempo de resposta).
- `http_req_failed` → taxa de requisições com erro.
- `checks` → % de asserts que passaram.
- suas métricas customizadas (`fluxo_negocio_duracao`, `login_sucesso`, ...).
- ✓/✗ ao lado de cada **threshold** — um ✗ significa **gate reprovado** (saída ≠ 0).

---

## 8.1. Relatório em HTML

Terminal some quando você fecha a janela — relatório fica. Todo teste aqui gera
um **HTML autocontido** (CSS embutido, sem CDN, abre offline e dá para anexar em
e-mail, evidência de release ou artefato de CI).

```bash
k6 run smoke.js
open reports/smoke.html # macOS (Linux: xdg-open · Windows: start)
```

> A pasta `reports/` já vem no repositório (com um `.gitkeep`) porque **o k6 não
> cria diretórios**: se ela não existir, o teste roda mas a gravação falha com
> `no such file or directory`. Se apagar a pasta, recrie com `mkdir -p reports`.

Cada execução grava dois arquivos, sempre com o nome do teste:

| Arquivo | Para quê |
|---|---|
| `reports/smoke.html` | leitura humana — veredito, KPIs, gráfico, tabelas |
| `reports/smoke.json` | leitura de máquina — o resumo cru, para CI/histórico |

O HTML usa as **cores do Projeto Garapuvu** (verde-escuro, verde, lima, amarelo
e coral) — banner, cartões e tabelas seguem a identidade visual, o que fica
bacana de mostrar em aula. Ele traz, nesta ordem: **veredito do quality gate**
(APROVADO/REPROVADO no topo), **cartões de KPI** (requisições, req/s, taxa de
erro, p95, média, checks, VUs de pico, iterações), a **tabela de thresholds**
com *esperado × obtido × falhas*, o **gráfico de distribuição** do tempo de resposta
(min → med → p90 → **p95** → max), a **tabela de checks**, as **métricas
customizadas** separadas das padrão e, por fim, um **glossário "Entendendo cada
métrica"**: um cartão por métrica com a explicação em português, o *ponto a
analisar* e um **link para a documentação oficial** (veja a seção 8.2).

### Como funciona (e como customizar)

O k6 chama a função exportada **`handleSummary(data)`** no fim do teste. O que
ela devolve é um mapa `{ "caminho": conteúdo }` — o k6 grava cada chave como
arquivo; a chave especial `"stdout"` vai para o terminal. É só isso:

```js
import { relatorio } from "./lib/report.js";

export function handleSummary(data) {
  return relatorio(data, "smoke");   // → reports/smoke.html + reports/smoke.json
}
```

Toda a montagem do HTML está em [`lib/report.js`](lib/report.js) — sem
dependência externa, então funciona sem internet. Para mudar cores, adicionar
uma seção ou trocar quais KPIs aparecem, edite esse arquivo: `relatorio()` no
final é quem decide os arquivos de saída.

> **Por que não usar uma biblioteca pronta?** As mais conhecidas (ex.
> `k6-reporter` do jslib) são importadas por URL e exigem rede na hora de rodar.
> Escrever o nosso deixa o subprojeto offline-first e mostra que `handleSummary`
> é só uma função que devolve strings.

O `reports/` está no `.gitignore`: relatório é **artefato de execução**, não
código. Em CI, publique-o como artefato do build em vez de commitar.

---

## 8.2. Glossário de métricas (o que analisar e onde ler mais)

Este mesmo conteúdo aparece dentro do relatório HTML (seção *"Entendendo cada
métrica"*), com link para a documentação oficial em cada item.

#### As métricas que reprovaram vêm em VERMELHO e em primeiro lugar

Um glossário com ~15 cartões iguais não ajuda quem precisa entender *por que este
build específico foi barrado*. Por isso, quando o gate reprova, o glossário se
reorganiza sozinho:

- os cartões das métricas culpadas **sobem para o topo** e ficam com **borda,
  título e selo `✗ REPROVOU` em vermelho**;
- cada um ganha o bloco **"ESTA MÉTRICA REPROVOU O BUILD"**, listando *exigia
  `p(95)<2` · obteve **9.84 ms***, um item por threshold violado;
- no cartão de `checks`, entram junto os **asserts** que falharam, com a contagem
  (*"projeto traz prazo de entrega" falhou 1200 de 1200 vezes*);
- fecha com um parágrafo **"Para estudar:"** — a interpretação daquela falha
  específica, não a teoria genérica da métrica.

Rodando `k6 run gate-exigente.js`, os quatro cartões vermelhos são:

| Cartão | Por que reprovou | O que o texto de estudo ensina |
|---|---|---|
| `http_req_duration` | `p(95)<2` → 9.84 ms · `p(99)<3` → 28.08 ms | latência alta com **0% de erro**: a API respondeu tudo, só devagar — investigue o `http_req_waiting` (TTFB) |
| `checks` | `rate==1.00` → 80% | assert vermelho é **requisito faltando**, não lentidão; e o `check` sozinho não reprova — quem reprova é o threshold |
| `fluxo_negocio_duracao` | `p(95)<20` → 53.10 ms | o usuário sente a **soma** das três requisições, por isso estoura antes de cada uma isolada estourar |
| `projetos_criados` | `count>5000` → 0 | `Counter` baixo quase nunca é culpa da app: é meta incompatível com a duração, ou o teste foi **abortado** antes do fim |

Note que a `http_req_duration{tipo:critico}` **não** ganha cartão próprio: nomes
com chaves são recortes por *tag* da mesma métrica, não métricas novas. A falha
dela aparece dentro do cartão de `http_req_duration`, marcada com
*(escopo: `http_req_duration{tipo:critico}`)*.

E `http_req_failed` fica **verde** mesmo num relatório reprovado — é o contraste
mais didático da simulação: **build barrado com zero erro de requisição**.

### Métricas padrão do k6

| Métrica | O que mede | O que analisar |
|---|---|---|
| `http_reqs` | total de requisições HTTP | vazão (throughput); com a taxa, dá req/s |
| `http_req_duration` | tempo total da requisição (envio + espera + recebimento) | olhe **p(95)/p(99)**, não a média; compare com o SLA |
| `http_req_failed` | proporção de requisições com erro | termômetro de saúde; ideal **< 1%** |
| `http_req_waiting` | **TTFB** — espera do servidor após enviar o pedido | é o processamento no backend/DB; sobe com a carga = gargalo no servidor |
| `http_req_blocked` | tempo parado antes de iniciar (fila/DNS) | alto e crescente = pool de conexões esgotado |
| `http_req_connecting` | tempo de conexão TCP | costuma ser baixo; picos indicam rede/recusa de conexão |
| `http_req_tls_handshaking` | handshake TLS (HTTPS) | keep-alive reduz esse custo |
| `http_req_sending` / `http_req_receiving` | envio do request / recebimento da resposta | `receiving` alto = payload grande demais (paginar/comprimir) |
| `iterations` | fluxos completos executados | mais iterações = mais cenários exercitados |
| `iteration_duration` | duração da iteração (inclui `sleep`) | dimensiona VUs; não confunda com `http_req_duration` |
| `vus` / `vus_max` | usuários virtuais ativos / pico | deve seguir a curva de stages; cruze com o tempo de resposta |
| `data_sent` / `data_received` | bytes trafegados | estima banda e custo de rede |
| `checks` | % de asserts que passaram | correção funcional **sob carga**; ideal **> 99%** |
| `dropped_iterations` | iterações que não rodaram | se aparece, o sistema não deu conta do ritmo (saturação) |

### Métricas customizadas deste projeto

| Métrica | O que mede | O que analisar |
|---|---|---|
| `fluxo_negocio_duracao` | tempo fim-a-fim (cadastro → login → criar projeto) | experiência real do usuário; foque no **p(95)** |
| `login_sucesso` | taxa de logins bem-sucedidos | login falhando sob carga afasta usuário; alvo **> 98%** |
| `projetos_criados` | projetos criados com sucesso | confirma que a **escrita** aguentou a carga |

### Referências oficiais

- Métricas embutidas: https://grafana.com/docs/k6/latest/using-k6/metrics/reference/
- Métricas customizadas: https://grafana.com/docs/k6/latest/using-k6/metrics/create-custom-metrics/
- Thresholds (quality gate): https://grafana.com/docs/k6/latest/using-k6/thresholds/
- Checks (asserts): https://grafana.com/docs/k6/latest/using-k6/checks/
- Resumo de fim de teste (`handleSummary`): https://grafana.com/docs/k6/latest/results-output/end-of-test/

> **Percentil (p95/p99), na prática:** `p(95)=480ms` quer dizer que **95% das
> requisições foram mais rápidas que 480ms** e 5% foram mais lentas. É mais
> honesto que a média, porque não deixa os poucos casos lentos (que costumam ser
> os que mais irritam o usuário) desaparecerem no meio.

---

## 8.3. Design tokens e temas de cor

As cores do relatório ficam em **[`lib/tokens.js`](lib/tokens.js)** como *design
tokens* — os valores de marca guardados com nome, num lugar só. Trocar a
identidade visual vira trocar um mapa, em vez de caçar hex pelo código.

São **dois níveis** (padrão de mercado):

1. **Primitivos** — a paleta crua ("as tintas"): `verdeEscuro`, `verde`, `amarelo`… Não se usa direto na tela.
2. **Semânticos** — os *papéis* que a interface usa: `bg`, `card`, `txt`, `ok`, `erro`, `acento`… Cada papel **aponta** para um primitivo. O relatório só conhece os semânticos (as variáveis CSS `--bg`, `--verde`, `--amarelo`…).

Os "slots" (papéis) que **todo tema preenche**:

| Grupo | Slots |
|---|---|
| Marca | `verde-escuro` (primária forte), `verde` (primária), `lima` (secundária), `lima-claro`, `amarelo` (destaque), `amarelo-claro`, `coral` (ênfase/alerta forte) |
| Base | `bg` (fundo), `card`, `txt`, `suave` (texto secundário), `linha` (bordas), `titulo` (títulos de seção) |
| Estado | `ok`/`ok-bg`, `erro`/`erro-bg`, `acento` (gráficos), `alerta` |
| Fundo | `bg-image` (imagem de fundo da tela) |

### Claro ou escuro: o botão no cabeçalho

O relatório abre seguindo o **modo do sistema operacional**, e o cabeçalho traz
um botão que cicla entre três estados: **auto** (◐, segue o sistema) → **claro**
(☀) → **escuro** (☾). A escolha fica salva no navegador (`localStorage`).

Por dentro, o botão só troca o atributo `data-tema` do `<html>`; quem muda as
cores é o CSS de `lib/tokens.js`, que emite três regras — `:root` (claro como
base), `@media (prefers-color-scheme: dark)` e `:root[data-tema="escuro"]`. Por
isso **todo detalhe de cor precisa ser um slot**: um `@media` de modo escuro
solto no CSS não obedeceria ao botão.

### Escolher o tema (env)

O relatório lê o tema da variável de ambiente `TEMA`. Já vêm prontos:
`garapuvu` (padrão), `joaquina`, `oceano` e `uva`.

```bash
k6 run -e TEMA=joaquina load.js          # troca só nesta execução
```

O projeto traz um **`.env`** (já com `TEMA=joaquina` para você testar) e um
**`.env.example`** documentando as opções. Sem `TEMA`, cai no padrão `garapuvu`.

⚠️ **O k6 não lê o `.env` sozinho.** Ele não tem flag `--env-file`; o que ele faz
é herdar as variáveis já presentes no ambiente do shell
(`--include-system-env-vars`, ligado por padrão). Se você só criar o arquivo e
rodar `k6 run load.js`, o relatório sai no tema padrão (`garapuvu`) — é o sintoma
clássico de *"editei o `.env` e nada mudou"*.

Duas formas de fazer o `.env` valer:

```bash
./run.sh load.js                           # (recomendado) o wrapper carrega o .env
set -a; source .env; set +a; k6 run load.js  # na mão, se preferir
```

O **`run.sh`** existe só para isso: joga o `.env` no ambiente e repassa tudo para
o `k6 run`. Variável que você passa na linha continua vencendo o arquivo
(`TEMA=oceano ./run.sh load.js`), e flags do k6 passam direto
(`./run.sh -e TEMA=uva load.js`). Ele imprime o tema em uso antes de rodar, para
você não descobrir o engano só no fim.

### Criar um tema novo (o aluno no comando)

1. Em `lib/tokens.js`, copie um bloco de **primitivos** (ex.: `garapuvu`) e mude as cores.
2. Registre em `TEMAS` chamando `montarTema(PRIMITIVOS.seuTema, "Rótulo", "fundoClaroOpcional", "fundoEscuroOpcional")`.
3. Rode com `-e TEMA=seuTema`. Pronto — o relatório se re-veste sozinho.

Como todos os temas passam pela mesma fábrica `montarTema`, é impossível
esquecer um slot: o "contrato" de cores é garantido.

### Imagem de fundo

Cada tema pode ter uma **imagem de fundo** (slot `bg-image`). São SVGs leves e de
baixo contraste (para não atrapalhar a leitura), em **duas versões** — uma para o
modo claro e a mesma cena repintada para o escuro:

- `assets/bg-garapuvu.svg` / `assets/bg-garapuvu-dark.svg` — a garapuvú florida sobre colinas;
- `assets/bg-joaquina.svg` / `assets/bg-joaquina-dark.svg` — sol, mar e dunas da Praia da Joaquina.

Elas são embutidas no HTML como *data URI* (o relatório continua **self-contained**,
abre offline sem depender do arquivo). A versão escura existe porque usar o SVG
claro no modo escuro ficaria brilhante demais — e deixar `none`, como era antes,
fazia o fundo **desaparecer** para quem usa o sistema no escuro. Para criar a
sua, adicione os dois SVGs em `SVG_FUNDO` e passe os nomes no `montarTema`
(`montarTema(paleta, "Rótulo", "claro", "escuro")`).

---

## 9. Integração com CI (GitHub Actions)

Como o k6 devolve código ≠ 0 quando o gate falha, o CI reprova sozinho:

```yaml
# .github/workflows/perf.yml
name: performance
on: [workflow_dispatch]
jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Subir a API
        run: cd app/backend && npm ci && npm start &
      - name: Rodar smoke + carga
        uses: grafana/k6-action@v0.3.1
        with:
          filename: app/performance-k6/smoke.js
      - name: Publicar o relatório HTML
        if: always()                       # publica MESMO se o gate reprovar
        uses: actions/upload-artifact@v4
        with:
          name: relatorio-k6
          path: app/performance-k6/reports/
```

O `if: always()` é o detalhe que importa: quando o gate reprova, o passo do k6
falha — e é justamente aí que você mais quer o relatório para investigar.

---

## 10. Planning Poker (parte da Aula 8)

**Planning Poker** é uma técnica de **estimativa** ágil e colaborativa. O time estima o *esforço* de cada tarefa usando cartas com a sequência de **Fibonacci** (1, 2, 3, 5, 8, 13, 20, 40, ...) — a escala cresce porque, quanto maior a tarefa, maior a incerteza.

Como jogar, em 4 passos:

1. Apresenta-se a tarefa (ex.: *"criar o teste de rampage da API"*).
2. Cada pessoa escolhe uma carta **em segredo** (evita ancoragem).
3. Todos revelam **ao mesmo tempo**.
4. Se houver divergência grande (ex.: alguém 3, outro 13), quem votou nos extremos **explica o porquê** e o time joga de novo até convergir.

Exemplo aplicado a este subprojeto:

| Tarefa de teste | Estimativa (pontos) |
|---|---|
| Escrever o smoke test | 2 |
| Modelar o rampage (stages de pico) | 5 |
| Criar o quality gate customizado | 8 |
| Integrar no pipeline de CI | 5 |

A estimativa não é sobre "horas exatas", e sim sobre **tamanho relativo** e alinhamento do time sobre a complexidade.

---

## 11. Ligação com a CTFL

Performance é um **teste não-funcional** (CTFL, Cap. 2), ligado à característica de qualidade **eficiência de desempenho** (ISO 25010: tempo de resposta, uso de recursos, capacidade). O quality gate implementa **critérios de saída** e **avaliação de riscos** (Cap. 1 e 5): o build só passa se cumprir o acordado. Rodar isso no pipeline é **teste contínuo** dentro de CI/CD (Cap. 2).

---

## 12. Experimento: do relatório do k6 para a otimização do backend

> Registro do experimento feito em **10/08/2026**. Teste de performance que não
> vira mudança de código é só decoração — esta seção documenta o ciclo completo
> **medir → isolar → corrigir → medir de novo**, e fica aqui como exemplo do
> método. O que mudou de verdade foi o **backend**
> (`../backend/src/repositorio.js`); os scripts de carga não foram alterados.

### 12.1. Ponto de partida

Rodando os testes desta pasta, a pergunta natural apareceu: *dá para melhorar as
consultas do backend?* Como este backend **não tem banco de dados** (veja o aviso
na [seção 1](#atenção-este-backend-não-tem-banco-de-dados)), "otimizar a query" aqui
significa otimizar as buscas em array de `repositorio.js` (`find`, `filter`,
`some`) — o equivalente didático de uma consulta sem índice.

### 12.2. A hipótese errada (e por que isso importa)

O primeiro suspeito foi o middleware de log do `app.js`, que serializa o corpo da
requisição **e** da resposta em toda chamada. Parece caro. Medindo o custo real
por requisição:

```
console.log do middleware: 3.2 µs  (stdout → /dev/null)
                           5.0 µs  (stdout → arquivo)
```

**3 microssegundos** diante de respostas de milissegundos: irrelevante. O log
ficou como está.

> 🧭 **Lição.** Otimizar por intuição é chutar. Se você não mediu, não sabe qual é
> o gargalo — e a chance de reescrever a parte errada do código é alta.

### 12.3. Como medir sem se enganar

Duas medições diferentes, com propósitos diferentes:

1. **Isolada (sem HTTP)** — chama a função do repositório num laço e divide pelo
   número de execuções. Serve para *ver a curva*: como o custo cresce quando o
   volume cresce. Sem rede no meio, nada esconde o custo do algoritmo.
2. **End-to-end (com HTTP)** — sobe a app numa porta, popula dados e mede o
   endpoint de verdade. Serve para *dimensionar o impacto real*: quanto daquele
   custo o usuário sente.

O molde da medição isolada (rode de dentro de `../backend`):

```js
import * as repo from "./src/repositorio.js";

for (const N of [1000, 10000, 50000, 200000]) {
  repo.reset();
  for (let i = 0; i < N; i++)
    repo.criarUsuario({ nome: "P", email: `u${i}@t.dev`, papel: "freelancer", senha: "1234" });

  const VEZES = 2000;
  const t0 = process.hrtime.bigint();                       // hrtime: nanossegundos
  for (let i = 0; i < VEZES; i++) repo.acharUsuarioPorEmail("naoexiste@t.dev");
  const us = Number(process.hrtime.bigint() - t0) / 1000 / VEZES;
  console.log(`usuarios=${N}  ${us.toFixed(1)} µs por busca`);
}
```

Note o detalhe: buscamos um e-mail que **não existe**. É o pior caso do `find`
(percorre a lista inteira) e também o caso mais comum na prática — é exatamente o
que o cadastro faz para checar *"esse e-mail já está em uso?"*.

> Rodando isso **hoje** o resultado sai `0.0 µs` em todos os volumes: a
> otimização da seção 12.5 já está aplicada, e é assim que se parece uma busca
> O(1). Para reproduzir os números "antes", recupere a versão anterior do
> repositório com `git show <commit>:.../repositorio.js`.

### 12.4. O que estava lento

**a) Buscas lineares — O(n).** Dobrou o volume, dobrou o tempo:

| Busca | 1 000 usuários | 200 000 usuários |
|---|---|---|
| `acharUsuarioPorEmail` (cadastro e login) | 8 µs | **514 µs** |
| `acharUsuario(id)` (criação de projeto) | 6.5 µs | **616 µs** |

**b) `GET /contratos` — quadrático.** Este é o endpoint mais chamado no
`load.js`, e para **cada** projeto da lista ele varria as listas inteiras de
candidaturas e avaliações — trabalho N×(C+A):

| Projetos | Montar a resposta |
|---|---|
| 100 | 0.34 ms |
| 500 | 1.23 ms |
| 2 000 | 12.14 ms |
| 5 000 | **66.63 ms** |

Olhe a curva: **4× mais projetos → 10× mais tempo**. Essa é a assinatura de um
algoritmo quadrático. E é o tipo de problema que passa batido no dia a dia — com
os 10 projetos que existem em desenvolvimento, tudo responde na hora.

### 12.5. A correção: índices

Em `../backend/src/repositorio.js`, cada busca frequente ganhou um **índice**: um
`Map` (ou `Set`) que leva da chave direto ao objeto, em **O(1)**.

| Índice | Chave → valor | Resolve |
|---|---|---|
| `usuarioPorEmail` | e-mail → usuário | cadastro, login |
| `usuarioPorId` | id → usuário | criação de projeto, perfil |
| `contratoPorId` | id → projeto | todas as rotas `/contratos/:id` |
| `candidaturasPorContrato` | projeto → candidaturas | `GET /contratos` |
| `candidaturaExiste` (Set) | `"projeto:freelancer"` | checagem de duplicidade |
| `avaliacoesPorPara` / `avaliacoesPorContrato` | usuário / projeto → avaliações | reputação, `GET /contratos` |
| `notificacoesPorPara` | usuário → notificações | `GET /notificacoes/:id` |

É o mesmo papel que um índice cumpre num banco de dados — **e tem o mesmo
preço**: todo ponto que escreve precisa manter o índice em sincronia, senão o
atalho passa a mentir. Os arrays continuam sendo a fonte da verdade, para a ordem
de inserção que a API devolve não mudar.

### 12.6. Resultado

Isolado, o `GET /contratos` deixou de ser quadrático:

| Projetos | Antes | Depois | Ganho |
|---|---|---|---|
| 500 | 1.23 ms | 0.51 ms | 2.4× |
| 2 000 | 12.14 ms | 1.82 ms | 6.7× |
| 5 000 | 66.63 ms | 4.92 ms | **13.5×** |

E as buscas viraram tempo constante — 514 µs → **~0.05 µs** com 200 mil usuários.

End-to-end, via HTTP real, com 2 000 projetos cadastrados:

```
ANTES  →  GET /contratos: 18.3 ms/req
DEPOIS →  GET /contratos:  6.3 ms/req      (2.9× mais rápido)
```

### 12.7. Como sabemos que não quebrou nada

Otimização que muda comportamento não é otimização, é bug. As três verificações:

- **Nenhuma rota mudou** — a alteração ficou encapsulada no repositório; o
  `app.js` não foi tocado.
- **Os 84 testes do backend passam** sem nenhuma adaptação (`cd ../backend && npm test`).
- **Fluxo conferido por HTTP**, incluindo os caminhos de erro que dependem dos
  índices: e-mail duplicado → 400, candidatura duplicada → 400, e a retirada de
  candidatura voltando a lista de `candidatos` para vazia (prova de que o índice
  é atualizado na remoção, não só na inserção).

### 12.8. O que sobrou

Os 6.3 ms restantes **não são mais busca**: são montar e serializar 2 000 objetos
em JSON. Índice não resolve isso — a saída seria **paginação**
(`GET /contratos?pagina=1&tamanho=20`), que muda o contrato da API e exige mexer
no frontend. Ficou de fora de propósito, como próximo exercício: rode o
`load.js`, olhe o `p(95)`, e decida se o volume real do projeto justifica.

> ⚠️ **Reinicie a API depois de mexer no backend** (`cd ../backend && npm start`).
> O processo que já está no ar continua rodando o código antigo em memória, e o
> k6 mediria a versão errada. Reiniciar também zera os dados — bom para
> reprodutibilidade, e um limite a considerar: sem volume acumulado, o teste de
> carga não enxerga degradação por crescimento de base.
