# Projeto Social Garapuvu 2026

Repositório do **Projeto Social Garapuvu 2026** — curso social e gratuito de **Qualidade de Software (QA)**,
da fundamentação teórica (CTFL 4.0) à automação de testes com IA, Data Science e projetos reais de código.

Aqui convivem duas coisas: o **material didático** (36 aulas em 6 módulos) e os **projetos de código**
construídos ao longo da trilha, cada um servindo de laboratório para um tipo diferente de teste.

- **Instrutor:** Douglas Queiroz — CTFL
- **Landing page:** [projeto-garapuvu](https://projeto-garapuvu.web.app) (Firebase Hosting)
- **Instagram:** [@projetogarapuvu](https://www.instagram.com/projetogarapuvu/)

**209 testes automatizados** distribuídos em 4 projetos, todos verdes na última execução local.

---

## Índice

- [Estrutura do repositório](#estrutura-do-repositório)
- [Trilha de aulas](#trilha-de-aulas)
- [Projetos de código](#projetos-de-código)
- [Testes e cobertura](#testes-e-cobertura)
- [Desafios e materiais de apoio](#desafios-e-materiais-de-apoio)
- [Design system](#design-system)

---

## Estrutura do repositório

```
projeto-social-garapuvu/
├── src/  index.html  vite.config.js       → Landing page do projeto (Vite + React + Firebase)
├── firebase.json  firestore.rules         → Hosting + Firestore (contador de visitantes)
├── dataconnect/                           → Schema e queries do Firebase Data Connect
│
├── Modulo 0 - Introdução/                 → Boas-vindas, preparação de ambiente, guia de estudos
├── Modulo 1 - Fundamentos CTFL/           → Aulas 01–10 (teoria CTFL 4.0)
├── Modulo 2 - Pratica em Testes/          → Aulas 11–20 (prática) + plano de teste
├── Modulo 3 - IA e GitHub Copilot/        → Aulas 21–26 (IA generativa aplicada a QA)
├── Modulo 4 - Data Science e Testes/      → Aulas 27–31 + Desafio Churn (Python e RapidMiner)
├── Modulo Bonus - Mercado/                → Aulas B1–B5 (SQL, mobile, bugs, segurança)
├── Projeto Pratico - App do Curso/        → Aula P0 — apresentação dos apps
├── Desafio Final/                         → Enunciado do desafio de automação
│
├── Meu Primeiro App - Freelancers 360/    → Projeto full-stack (FreelaAvalia 360)
├── catch-request-garapuvu/                → Ferramenta de captura e análise de requests
├── design/                                → Design system + tokens do Figma
└── syllabus_ctfl_4.0br.pdf                → Syllabus oficial CTFL 4.0 (PT-BR)
```

---

## Trilha de aulas

### Módulo 0 — Introdução
| Aula | Assunto |
|---|---|
| 00 | Boas-vindas e visão geral |
| 0.1 | Preparação do ambiente (Windows / macOS) |
| — | Guia de estudos e links |

### Módulo 1 — Fundamentos CTFL
| Aula | Assunto |
|---|---|
| 01 | Fundamentos de teste |
| 02 | Modelos ágeis, DevOps e CI/CD |
| 03 | Teste estático e revisões |
| 04 | Níveis e tipos de teste |
| 05 | Técnicas de teste |
| 06 | Acessibilidade, usabilidade e UX |
| 07 | Gerenciamento, planejamento e estimativas |
| 08 | Ferramentas, performance e Planning Poker |
| 09 | Pirâmide de testes, métricas e KPIs |
| 10 | Scrum e Kanban |

### Módulo 2 — Prática em Testes
| Aula | Assunto |
|---|---|
| 11 | Testes funcionais e rastreabilidade |
| 12 | Testes exploratórios |
| 13 | Testes automatizados E2E |
| 14 | Testes de API |
| 15 | Layout e cross-browser |
| 16 | Usabilidade e heurísticas de Nielsen |
| 17 | Meu primeiro app + deploy |
| 18 | GitHub, frameworks e boas práticas |
| 19 | Currículo, LinkedIn e portfólio |
| 20 | Simulados e certificação CTFL |

> Inclui `plano de teste/` com o **Plano de Teste** (exemplos da Aula 07) e a
> **Matriz de Rastreabilidade** do FreelaAvalia 360.

### Módulo 3 — IA e GitHub Copilot
| Aula | Assunto |
|---|---|
| 21 | Introdução à IA generativa |
| 22 | GitHub Copilot no VS Code |
| 23 | Programação assistida por IA |
| 24 | Testes automatizados com IA |
| 25 | IA para documentação e qualidade |
| 26 | Projeto prático: IA + testes E2E |

### Módulo 4 — Data Science e Testes
| Aula | Assunto |
|---|---|
| 27 | Introdução a Data Science e testes |
| 28 | Testes com Python e pytest |
| 29 | Qualidade e validação de dados |
| 30 | Automação: unit, API e interface |
| 31 | Desafio final de Data Science |

> Acompanha `Roteiro_do_Apresentador_Modulo4.md`, o guia de estudos do módulo e o
> **Desafio Churn** em duas versões (Python e RapidMiner/Altair AI Studio).

### Módulo Bônus — Mercado
| Aula | Assunto |
|---|---|
| B1 | SQL e validação de dados |
| B2 | Ferramentas de mercado |
| B3 | Testes mobile |
| B4 | Abertura e documentação de bugs |
| B5 | Segurança de software |

---

## Projetos de código

Quatro projetos, cada um cobrindo uma camada diferente da pirâmide de testes.

| Projeto | Stack | Ferramentas de teste | Onde |
|---|---|---|---|
| Landing page Garapuvu | Vite + React + Firebase | — (deploy) | raiz |
| FreelaAvalia 360 | Node/Express + React | Vitest, Supertest, RTL, Playwright | `Meu Primeiro App - Freelancers 360/app/` |
| Catch Request Garapuvu | HTML/JS puro | Playwright, ESLint security, Sonar, gitleaks | `catch-request-garapuvu/` |
| Desafio Churn | Python | pytest (unit, mock, I/O, performance, carga) | `Modulo 4 .../Desafio Churn - Python/` |

---

### 1. Landing page Garapuvu (raiz)

Site de divulgação e inscrição do projeto. Rastreia eventos via Firebase Analytics e
mantém um contador de visitantes no Firestore.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
firebase deploy    # publica no Firebase Hosting (projeto: projeto-garapuvu)
```

**Arquivos-chave:** `src/GarapuvuLanding.jsx`, `src/firebase.js`, `src/useVisitorCount.js`,
`firestore.rules`, `firebase.json`.

> Único projeto sem suíte automatizada — a validação é manual, via preview e deploy.

---

### 2. FreelaAvalia 360

Plataforma de freelancers com **avaliação 360°**: contratantes publicam projetos, freelancers
se candidatam, o contratante seleciona vendo a reputação de cada um e, ao final, **os dois se avaliam**.
É o projeto principal da trilha — construído com apoio do GitHub Copilot e usado como laboratório
das Aulas 13, 14, 17 e 26.

```
Meu Primeiro App - Freelancers 360/app/
├── backend/    → API Express (regras.js, repositorio.js, app.js) + Vitest/Supertest
├── frontend/   → React + Vite (mobile-first) + RTL + Playwright (e2e/)
├── docs/       → Guias de prompts do Copilot (v2 a v7)
├── demo/       → Build empacotada para demonstração
└── Makefile    → Atalhos para subir e testar tudo
```

```bash
cd "Meu Primeiro App - Freelancers 360/app"
make install     # instala backend + frontend
make dev         # sobe os dois (backend :3001, frontend :5173)
make test        # unit + integração + componente (Vitest)
make test-e2e    # E2E no navegador (Playwright)
make coverage    # relatórios de cobertura
```

Comandos por camada:

```bash
cd backend
npm test                  # 84 testes (unit + integração)
npm run test:unit         # só os marcados @unitario
npm run test:integracao   # só os marcados @integracao
npm run coverage          # cobertura (thresholds: 80% linhas / 70% branches)

cd ../frontend
npm test                  # 78 testes de componente (jsdom)
npm run test:report       # abre o relatório HTML do Vitest
npm run test:ui           # painel interativo do Vitest
npm run coverage          # cobertura (thresholds em 60%)
npm run e2e               # 6 testes E2E
npm run e2e:headed        # E2E com o navegador aberto
npm run e2e:ui            # painel interativo do Playwright
npm run e2e:report        # abre o relatório HTML do Playwright
```

Relatórios ficam em `frontend/relatorios/` (`vitest/`, `cobertura/`, `playwright/`) — todos
ignorados pelo Git.

**Máquina de estados do projeto:**

```
Publicado ──(seleciona candidato)──▶ Em aprovação ──(acordo fechado)──▶ Em andamento ──▶ Concluído
```

Detalhes de regra de negócio no [README do app](Meu%20Primeiro%20App%20-%20Freelancers%20360/app/README.md).

---

### 3. Catch Request Garapuvu

Ferramenta interna que **captura** requisições de rede, console, cookies, storage e erros de
qualquer página (via bookmarklet) e exporta tudo num JSON **criptografado (AES-256-GCM)** para
análise posterior. Usada nas aulas de segurança (B5) e performance.

```bash
cd catch-request-garapuvu
npm install
npm run install:browsers
npm run serve            # http://localhost:8000
npm test                 # 18 testes E2E (Playwright)
npm run test:coverage    # E2E + relatório de cobertura
npm run test:headed      # com navegador aberto e slowMo
npm run test:mobile      # Mobile Chrome + Mobile Safari
npm run audit:security   # lint + npm audit + gitleaks + SonarScanner
```

Fluxo: `src/garapuvu-processo-captura.html` (bookmarklets INICIAR/PARAR) →
`src/garapuvu-analisador-requests.html` (descriptografa e analisa). Aceita importar relatórios
do **OWASP ZAP**, **Lighthouse** e **PageSpeed** para enriquecer o diagnóstico.

Detalhes no [readme do projeto](catch-request-garapuvu/readme.md).

---

### 4. Desafio Churn (Python)

Projeto do Módulo 4 que prevê churn de clientes e serve de vitrine da **diversidade de testes**
que o Python oferece — incluindo I/O de arquivos, mock e testes de carga com rampa de uso.

```bash
cd "Modulo 4 - Data Science e Testes/Desafio Churn - Python"
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest                    # 23 testes
pytest -m "not carga"     # só os rápidos
pytest -m performance     # tempo e latência
pytest --cov=src          # com cobertura
```

| Arquivo | Tipo de teste |
|---|---|
| `test_dados.py` | Unitário + parametrizado + leitura de arquivo |
| `test_limpeza.py` | Unitário + fixtures |
| `test_arquivos.py` | I/O — JSON, CSV e TXT (ida e volta) |
| `test_mock.py` | Mock / monkeypatch |
| `test_modelo.py` | Métrica com limiar (F1 ≥ 0,60) |
| `test_performance.py` | Latência (< 1 ms por previsão) |
| `test_carga.py` | Carga e rampa (250 → 2.500 → 25.000) |

Há também a versão **RapidMiner / Altair AI Studio** (`Desafio Churn - RapidMiner/`), com o
template `.rmp` e READMEs próprios para cada ferramenta.

---

## Testes e cobertura

Números da última execução local completa — **verificados, não estimados**.

### Resumo por projeto

| Projeto / suíte | Testes | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|
| FreelaAvalia — backend (Vitest + Supertest) | ✅ 84 | **100%** | 98,23% | **100%** | **100%** |
| FreelaAvalia — frontend (Vitest + RTL) | ✅ 78 | **99%** | 95,65% | 92,39% | **99%** |
| FreelaAvalia — E2E (Playwright) | ✅ 6 | — | — | — | — |
| Catch Request (Playwright + monocart) | ✅ 18 | 78,51% | 59,06% | 80,79% | 61,51% |
| Desafio Churn (pytest + pytest-cov) | ✅ 23 | **97%** | — | — | — |
| **Total** | **209** | | | | |

> A cobertura do Catch Request é medida sobre HTML/JS carregado no navegador (bytes: 80,90%),
> por isso a métrica de linhas fica mais baixa que a de statements. É o único projeto ainda
> abaixo dos limites que os outros praticam.

### Detalhe — FreelaAvalia backend

```
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered
----------------|---------|----------|---------|---------|----------
All files       |     100 |    98.23 |     100 |     100 |
 app.js         |     100 |    98.02 |     100 |     100 | 88,122,217
 flags.js       |     100 |    91.66 |     100 |     100 | 31
 regras.js      |     100 |      100 |     100 |     100 |
 repositorio.js |     100 |      100 |     100 |     100 |
```

### Detalhe — FreelaAvalia frontend

```
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered
----------------|---------|----------|---------|---------|----------
All files       |      99 |    95.65 |   92.39 |      99 |
 src            |   96.47 |    92.15 |   81.81 |   96.47 |
  App.jsx       |   93.33 |    85.18 |      90 |   93.33 | 52-54
  api.js        |     100 |      100 |   78.26 |     100 |
 src/components |     100 |      100 |     100 |     100 |
 src/hooks      |     100 |      100 |     100 |     100 |
 src/pages      |   99.35 |    96.11 |   98.14 |   99.35 |
```

### Detalhe — Desafio Churn

```
Name                   Stmts   Miss  Cover
src/arquivos.py           18      1    94%
src/dados.py              21      1    95%
src/limpeza.py             6      0   100%
src/modelo.py             24      0   100%
src/processamento.py       3      0   100%
src/relatorio.py           7      0   100%
TOTAL                     79      2    97%
```

### Cobertura de tipos de teste

O conjunto dos projetos cobre a pirâmide inteira — útil para escolher onde estudar cada técnica:

| Nível | Onde ver na prática |
|---|---|
| Unitário | `backend/src/regras.test.js`, Churn `test_dados.py` |
| Integração / API | `backend/src/app.test.js` (Supertest), Churn `test_modelo.py` |
| Componente | `frontend/src/**/*.test.jsx` (React Testing Library) |
| E2E / interface | `frontend/e2e/*.spec.js`, `catch-request-garapuvu/tests/` (Playwright) |
| Cross-browser | Catch Request (chromium, firefox, webkit, mobile) |
| Performance / carga | Churn `test_performance.py`, `test_carga.py` |
| Segurança | Catch Request (`audit:security`: ESLint security, gitleaks, Sonar, OWASP ZAP) |
| Acessibilidade / usabilidade | Aulas 06 e 16 + design system |

### Rodar tudo de uma vez

```bash
# FreelaAvalia (unit + integração + componente + E2E + cobertura)
cd "Meu Primeiro App - Freelancers 360/app" && make coverage && make test-e2e

# Catch Request
cd catch-request-garapuvu && npm run test:coverage

# Desafio Churn
cd "Modulo 4 - Data Science e Testes/Desafio Churn - Python" && .venv/bin/pytest --cov=src
```

---

## Desafios e materiais de apoio

| Item | Onde |
|---|---|
| Desafio Final — QA e Automação de Testes | `Desafio Final/` |
| Guia do Desafio Churn (Data Science) | `Modulo 4 .../Guia_Desafio_Final_Churn_DataScience.pdf` |
| Plano de Teste + Matriz de Rastreabilidade | `Modulo 2 .../plano de teste/` |
| Guias de prompts do Copilot (v2–v7) | `Meu Primeiro App .../app/docs/` |
| Syllabus CTFL 4.0 (PT-BR) | `syllabus_ctfl_4.0br.pdf` |
| Apresentação institucional | `Projeto_Social_Garapuvu_2026_-_Clinicorp.pdf` |

---

## Design system

`design/design-system.html` — paleta, tipografia e componentes do Garapuvu, com os mesmos tokens
exportados em `design/garapuvu-figma-tokens.json` para uso no Figma. É a referência visual usada
na landing page e no FreelaAvalia 360.
