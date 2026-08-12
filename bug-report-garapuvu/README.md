# 🌳🐛 Bug Report Garapuvu

Plataforma de **abertura e documentação de bugs** usada na **Aula B4 — Abertura e Documentação de Bugs** do curso de QA do Projeto Social Garapuvu.

Feita com HTML + CSS + JavaScript puro no frontend e Node.js (Express) no backend, nas cores oficiais do projeto (verde 🌳 + amarelo 💛).

## O que a plataforma faz

- **Abrir bugs** com os campos essenciais de um bom bug report (CTFL): título, **pré-requisitos para simulação**, passos para reproduzir, resultado esperado × obtido, severidade, prioridade e ambiente (preenchido automaticamente com o SO e navegador detectados).
  - **Pré-requisitos para simulação**: o que precisa estar configurado *antes* de reproduzir — configurações do sistema, feature flags ativas, permissões do usuário, dados de massa, integrações. Uma condição por linha.
- **Gerar cenário BDD** (Gherkin em pt-BR) a partir do que já foi preenchido: pré-requisitos viram `Dado que`, os passos viram `Quando`, o resultado esperado vira `Então` e o obtido entra como comentário (é o desvio, não a asserção). O texto gerado fica editável e pode ser copiado.
- **Exportar a lista para CSV**: exporta os bugs guardados no localStorage respeitando os filtros da tela, com separador `;` e UTF-8 com BOM (abre direto no Excel pt-BR). O `dataURL` da evidência não vai para a planilha — vira um resumo (`video: gravacao.webm`).
- **Capturar evidências**: o botão muda conforme o sistema operacional detectado no navegador —
  - 🍎 **macOS**: instruções do app nativo de Captura de Tela (`⌘ + Shift + 5`)
  - 🪟 **Windows**: instruções da Ferramenta de Captura (`Win + Shift + S`) e Xbox Game Bar (`Win + G`)
  - Além disso, dá para tirar **screenshot** e **gravar a tela pelo próprio navegador** (Screen Capture API / `getDisplayMedia`), que abre o seletor de tela do próprio sistema.
  - Ao terminar a gravação, o `.webm` é **baixado e anexado ao bug**, com **player rodando ali mesmo** (no preview e no cartão do bug).
  - Também dá para **anexar arquivo** pelo seletor ou **arrastando e soltando** na área de evidência (imagem ou vídeo — `.webm`, `.mp4`, `.mov`). Limite de **3 MB** para ficar anexado, porque o vídeo em base64 estouraria a cota do localStorage; acima disso o arquivo é baixado para você anexar no ticket.
  - ℹ️ Por segurança, navegadores **não podem abrir apps nativos do SO diretamente** — por isso o botão nativo mostra o atalho, e a captura direta usa a API do navegador.
- **localStorage**: rascunho automático do formulário (sobrevive a recarregamentos), preferências de filtro e **modo offline** — se a API estiver fora do ar, os bugs ficam salvos localmente.
- **Gerenciar bugs**: filtros por status e severidade, mudança de status (aberto → em análise → corrigido → fechado) e exclusão.

## Estrutura

```
bug-report-garapuvu/
├── backend/                 # servidor Node simulando uma API REST
│   ├── server.js            # sobe API + frontend na porta 3000
│   ├── app.js               # rotas Express (separado p/ testes com Supertest)
│   └── bugs-repo.js         # "banco de dados" em memória
├── frontend/
│   ├── index.html
│   ├── favicon.svg           # flor do garapuvu — mesmo ícone da landing do projeto
│   ├── css/styles.css       # paleta oficial Garapuvu
│   └── js/
│       ├── app.js           # liga a interface aos módulos
│       ├── validators.js    # regras de validação (compartilhado com o backend!)
│       ├── os-detect.js     # detecta Mac/Windows e monta o botão de captura
│       ├── storage.js       # camada de localStorage
│       ├── capture.js       # screenshot/gravação via getDisplayMedia
│       ├── bdd.js           # gera o cenário Gherkin a partir do bug
│       ├── csv.js           # exporta a lista de bugs em CSV (RFC 4180)
│       └── api.js           # cliente HTTP com fallback offline
└── tests/
    ├── unit/                # Jest — funções puras e módulos isolados
    ├── api/                 # Supertest — rotas REST de verdade
    ├── e2e/                 # Playwright — interface no navegador real
    └── fixtures/
        ├── gerar-video-evidencia.js  # grava o vídeo de teste (não precisa de ffmpeg)
        └── gravacao-5s.webm          # vídeo real de 5s usado nos testes de evidência
```

## Como rodar

```bash
npm install                # instala as dependências
npx playwright install chromium   # (uma vez) navegador dos testes E2E

npm start                  # abre em http://localhost:3000
```

## Como rodar os testes 🧪

| Camada | Ferramenta | Comando |
|---|---|---|
| Unitários | Jest | `npm run test:unit` |
| API | Supertest | `npm run test:api` |
| Interface (E2E) | Playwright | `npm run test:e2e` |
| Unit + API | | `npm test` |
| Tudo | | `npm run test:all` |
| Tudo + cobertura | | `make coverage` |
| Demo apresentada | Playwright | `make demo` |

O Playwright sobe o servidor sozinho antes dos testes E2E — não precisa rodar `npm start` antes.

### A demo de aula 🎬

```bash
make demo                      # 1,5s por ação (padrão)
make demo DEMO_SLOWMO=2500     # mais devagar, para explicar cada passo
make demo DEMO_HEADLESS=1      # só conferir se passa, sem abrir janela
```

Abre o navegador **visível** e percorre a ferramenta inteira em 24 passos, com uma tarja no topo narrando o que está acontecendo: validação → título → pré-requisitos → passos → esperado × obtido → captura nativa → evidência em vídeo (arrastando o `.webm`) → gerar BDD → abrir o bug → ciclo de vida → filtros → `localStorage` → exportar CSV → excluir.

Antes de cada passo a página **rola suavemente até o elemento e o destaca** com contorno amarelo. Isso não é enfeite: a rolagem automática do Playwright acontece no instante do clique, sem transição, então quem assiste vê o elemento só depois da ação — ou nem vê. Aqui a rolagem centraliza o elemento (para não ficar embaixo da tarja) e acontece **junto com a narração**, antes da ação.

Ritmo ajustável: `DEMO_SLOWMO` (pausa entre ações, 1500ms), `DEMO_LEITURA` (tempo de leitura da tarja, 900ms), `DEMO_ROLAGEM` (espera da rolagem, 700ms).

Não é um "modo apresentação" de fachada: **cada passo tem `expect()`**. Se a plataforma quebrar, a demo falha na frente da turma — que é justamente o ponto. Ela vive em `tests/e2e/demo.spec.js` com config própria ([playwright.demo.config.js](playwright.demo.config.js)) e fica **fora** da suíte normal (`testIgnore`), para não deixar `npm run test:e2e` lento.

### Cobertura 📊

```bash
make coverage          # unit + API com cobertura, e depois os E2E
open tests/coverage/index.html
```

O relatório fica em **`tests/coverage/`** (HTML + `lcov.info`), junto das camadas que o geraram.

Estado atual: **96.8% statements · 88.9% branches · 98.6% functions**.

Duas observações para ler o número com honestidade:

- A cobertura é medida pelo **Jest** (unit + API). Os E2E rodam no navegador de verdade e validam comportamento, mas **não somam no percentual**.
- Fora da conta de propósito: `frontend/js/app.js` (IIFE que só roda no navegador, não dá para `require`) e `backend/server.js` (só o `listen()`; as rotas estão em `app.js`, com 95%).

`api.js` e `capture.js` são testados com as APIs do navegador dubladas — `fetch`, `getDisplayMedia`, `MediaRecorder`, `canvas`, `FileReader`, `URL.createObjectURL` — em ambiente jsdom. O que se testa ali é a **nossa** lógica em volta delas: o fallback offline com id negativo, o encerramento da trilha de vídeo (senão o navegador fica marcando "compartilhando tela" para sempre) e a junção dos pedaços em `Blob` webm.

### O vídeo de teste 🎥

Os testes de evidência usam um **webm real de 5 segundos** (`tests/fixtures/gravacao-5s.webm`), não um arquivo fake: com bytes inválidos o player abre em `0:00` e nunca dá play, então o teste passaria sem provar nada. Os testes checam `duration > 4s` e que o `currentTime` avança depois do `play()`.

Para regerar o arquivo (usa o Chromium do Playwright, **sem ffmpeg**):

```bash
npm run fixtures:video
```

## A pirâmide de testes aplicada aqui

- **Base (unitários)**: `validators`, `os-detect`, `storage`, `bugs-repo`, `bdd`, `csv` — rápidos, muitos, sem dependências externas.
- **Meio (API)**: as rotas REST testadas com requisições reais via Supertest, sem abrir porta.
- **Topo (interface)**: poucos fluxos, mas completos — usuário abre bug, muda status, filtra, exclui, e o botão de captura certo aparece para cada SO (o Playwright emula o user agent de Mac e Windows).

---

Projeto Social Garapuvu · Curso de QA 2026 · feito com 💚 e 💛
