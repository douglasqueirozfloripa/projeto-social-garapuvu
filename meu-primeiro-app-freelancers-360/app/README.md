# FreelaAvalia 360

Plataforma de freelancers com **avaliação 360°**: contratantes **publicam projetos abertos**,
freelancers **se candidatam**, o contratante **seleciona** um candidato (vendo a reputação de cada um)
e, ao final do trabalho, **os dois se avaliam** (nota de 1 a 5 + comentário).
Projeto do **Projeto Social Garapuvu 2026** — construído com apoio do GitHub Copilot.

> **Status de validação:** **84 testes** no backend (Vitest + Supertest), **147** no frontend
> (unitário + componente com RTL) e **12 E2E** de jornada completa (Playwright) — todos passando.

## Tecnologias
- **Backend:** Node.js + Express (dados em memória, para fins didáticos)
- **Frontend:** React + Vite (layout **mobile-first**, cores do Projeto Garapuvu)
- **Testes:** Vitest (unitário/integração/componente), Supertest (API), React Testing Library (interface), Playwright (E2E)
- **Cobertura:** provider `v8` (relatório em `coverage/`)

## Estrutura
```
backend/   → API Express (regras.js, repositorio.js, app.js, server.js) + testes
frontend/  → React + Vite (components/, pages/, api.js, modulos.js, painel.js) + testes + e2e/
api/       → adaptador que expõe a API do backend como função serverless na Vercel
vercel.json→ configuração de build/rotas do deploy
```

Pós-login a navegação é: **Início (painel)** · Projetos · Meu perfil · Flags — pelo menu do topo
(gaveta ☰ no celular) ou pelos atalhos do próprio painel. Ver *Painel inicial e menu*, abaixo.

## Como rodar

### Backend (porta 3001)
```bash
cd backend
npm install
npm start            # sobe a API em http://localhost:3001
npm test             # roda os testes (unitário + integração)
npm run coverage     # testes + relatório de cobertura (coverage/index.html)
```

### Frontend (porta 5173)
```bash
cd frontend
npm install
npm run dev          # abre o app em http://localhost:5173
npm test             # testes de componente (React Testing Library)
npm run coverage     # cobertura do frontend
npm run e2e          # todos os testes E2E (requer backend + frontend no ar; e npx playwright install)
npm run e2e:smoke    # SÓ o fluxo completo, em modo headed + slowMo (dá pra acompanhar na tela)
```

## Publicar na Vercel (frontend + backend fake juntos)

O deploy sobe **um único site**: o frontend como arquivos estáticos e a API como
**função serverless** no mesmo domínio (por isso não há CORS nem porta 3001 em produção).

| Em produção | Endereço |
|---|---|
| App (frontend Vite) | `https://<seu-projeto>.vercel.app` |
| API (backend Express) | `https://<seu-projeto>.vercel.app/api` — ex.: `/api/health`, `/api/login` |

### Como o projeto está configurado
- **`api/index.js`** — importa a app Express de `backend/src/app.js` e a exporta como handler.
  Uma app Express já é uma função `(req, res)`, que é exatamente o que a Vercel chama.
- **`vercel.json`** — `buildCommand` gera o frontend, `outputDirectory` aponta para
  `frontend/dist` e o *rewrite* `/api/(.*)` manda tudo que começa com `/api` para a função.
- **`frontend/src/api.js`** — descobre o endereço da API sozinho: `http://localhost:3001`
  em desenvolvimento e `/api` em produção (`VITE_API_URL` sobrescreve, se precisar).
- **`.vercelignore`** — mantém fora do deploy (via GitHub) o que não é do app:
  `performance-k6/` (roda só na máquina/CI), `docs/`, `demo/`, testes e relatórios.
  De todo modo nada disso é buildado: o `buildCommand` só toca em `frontend/`.

### Passo a passo (import pelo GitHub)
1. Faça o commit/push desta pasta (`api/`, `vercel.json`, `package.json`, `.vercelignore`).
2. Na Vercel: **Add New → Project** → importe o repositório `projeto-social-garapuvu`.
3. **Root Directory** (o passo que mais gera erro): aponte para
   `meu-primeiro-app-freelancers-360/app` — não a raiz do repositório, senão a Vercel
   publica a landing page do curso e não encontra o app.
4. Framework Preset: **Other** (o `vercel.json` já diz o que buildar). Deploy.
5. Valide abrindo `https://<seu-projeto>.vercel.app/api/health` → deve responder `{"ok":true}`.

> 🧠 **Por que a pasta se chama `meu-primeiro-app-freelancers-360` e não "Meu Primeiro App…"?**
> A Vercel monta o nome da função serverless a partir do caminho dela no repositório e
> **recusa nomes com espaço** (limite de 128 caracteres, sem espaços). Com a pasta antiga o
> deploy quebrava exatamente no fim, depois de buildar:
> `A Serverless Function has an invalid name: "'Meu Primeiro App - Freelancers 360/app/api/index.js'"`.
> Lição: pastas que entram num deploy merecem nome em *kebab-case*, sem espaço nem acento.

> Se o projeto na Vercel já existe e está publicando a coisa errada:
> **Settings → Build and Deployment → Root Directory**, ajuste o caminho e faça **Redeploy**
> (ou use o CLI, abaixo).

### ⚠️ Dois projetos na Vercel para o mesmo repositório (o check vermelho no PR)

Ao abrir o Pull Request aparecem **dois** comentários do bot da Vercel, um deles falhando:

| Project | Deployment |
|---|---|
| `projeto-social-garapuvu` | 🔴 Error |
| `projeto-social-garapuvu-free360` | 🟢 Ready |

Não é o app que está quebrado — são **dois projetos diferentes na Vercel ligados ao mesmo
repositório do GitHub**. O primeiro foi criado na tentativa inicial de deploy (quando a pasta
ainda se chamava `Meu Primeiro App - Freelancers 360`); o segundo é o que funciona.

Quando um repositório está conectado a mais de um projeto, **cada push dispara um build em
todos eles** e cada um vira um *check* no PR. O antigo falha em ~1s, antes mesmo de instalar
dependências, porque o Root Directory dele aponta para a pasta com espaços que **foi renomeada**:

```
Cloning github.com/…/projeto-social-garapuvu (Branch: feat/FreeLancer360)
The specified Root Directory "Meu Primeiro App - Freelancers 360/app" does not exist.
Please update your Project Settings.
```

O Root Directory é uma configuração **do projeto na Vercel**, não do repositório: renomear a
pasta no Git não atualiza o painel. O projeto novo (`…-free360`) já nasceu apontando para
`meu-primeiro-app-freelancers-360/app`, então builda e publica normalmente.

**Como resolver** (escolha uma):

```bash
# a) o projeto antigo não serve para nada → remova (o check vermelho desaparece)
vercel project rm projeto-social-garapuvu

# b) quer manter o projeto antigo → corrija o Root Directory dele
vercel project update projeto-social-garapuvu \
  --root-directory "meu-primeiro-app-freelancers-360/app"
```

Uma terceira via, sem apagar nada: no painel do projeto antigo, **Settings → Git →
Disconnect** (ou desligar *Comments*/*Checks*), para ele parar de opinar nos PRs.

> 🧠 **Lição:** um repositório pode ter vários projetos na Vercel, e todos comentam no seu PR.
> Se um deploy falha "sem motivo", olhe **qual projeto** falhou antes de mexer no código —
> o erro pode estar no painel, não no commit.

### CLI da Vercel

Instalação (uma vez, global). Sem instalar nada, dá para trocar `vercel` por `npx vercel`:

```bash
npm install -g vercel
vercel --version        # confirma a instalação
vercel login            # autentica (abre o navegador)
vercel whoami           # mostra o usuário logado
```

**Configurar o projeto** — é este comando que resolve o erro mais comum (a Vercel
publicar a landing page da raiz em vez do app). Rode de dentro desta pasta (`app/`):

```bash
# 1) vincula esta pasta ao projeto na Vercel (cria .vercel/, já no .gitignore)
vercel link --yes --project projeto-social-garapuvu-free360

# 2) aponta o Root Directory para esta pasta e deixa o build por conta do vercel.json
vercel project update projeto-social-garapuvu-free360 \
  --root-directory "meu-primeiro-app-freelancers-360/app" \
  --framework other

# 3) confere como ficou (Root Directory, preset, versão do Node)
vercel project inspect projeto-social-garapuvu-free360
```

**Publicar.** O caminho recomendado é o `git push` — a Vercel builda sozinha a cada commit.
Pelo CLI, rode da **raiz do repositório**, porque a Vercel aplica o *Root Directory* **por cima**
da pasta que você envia:

```bash
cd "../.."              # raiz do repositório (projeto-social-garapuvu/)
vercel deploy --project projeto-social-garapuvu-free360           # preview (URL temporária)
vercel deploy --prod --project projeto-social-garapuvu-free360    # produção
```

> ⚠️ Rodar `vercel` **de dentro de `app/`** falha com
> `The provided path ".../app/meu-primeiro-app-freelancers-360/app" does not exist`.
> Não é bug: é o Root Directory sendo somado duas vezes. Ou suba da raiz do repositório,
> ou use `git push`.

**Depurar:**

```bash
vercel deploy --dry --yes --project projeto-social-garapuvu-free360  # lista o que seria enviado, sem publicar
vercel logs <url-do-deploy>            # logs da função (os prints do middleware da API)
vercel ls                              # deployments recentes
vercel env add VITE_API_URL production # variável de ambiente (só se precisar apontar para outra API)
```

> O `vercel link` cria `.vercel/` e um `.env.local` com um **token** — os dois já estão no
> `.gitignore`. Nunca faça commit deles.

### ⚠️ Limite conhecido: os dados são em memória
O backend é *fake* (arrays em memória, sem banco). Numa função serverless cada instância
tem a sua própria memória e ela é descartada quando a função hiberna. Na prática:

- os **três usuários padrão** são semeados a cada inicialização, então **o login `1234` sempre funciona**;
- projetos, candidaturas e avaliações criados em produção podem **desaparecer** depois de um tempo
  sem uso (ou se duas requisições caírem em instâncias diferentes).

Para uma demonstração isso basta. Para dados que persistem, o próximo passo é um banco
de verdade (Postgres/MySQL gerenciado) — ver *Próximos passos*.

## Fluxo do projeto (MVP de recrutamento)

Um projeto é um **anúncio aberto** e percorre esta máquina de estados:

```
Publicado ──(contratante seleciona candidato)──▶ Em aprovação
  ▲                                                   │
  │ (freelancers se candidatam)         (acordo fechado via WhatsApp)
  │                                                   ▼
  └───────────────────────────────────────────  Em andamento
                                                      │
                              (freelancer entrega + avalia o contratante)
                                                      ▼
                          (contratante conclui + avalia o freelancer) ──▶ Concluído
```

- **Contratante:** publica o projeto (título + descrição + contato sugerido do perfil), vê os
  **candidatos com a reputação (média 360)**, seleciona um, confirma o acordo (negociado no WhatsApp)
  passando para *Em andamento* e, ao final, **conclui avaliando** o freelancer.
- **Freelancer:** vê todos os projetos publicados, **candidata-se**, e — quando selecionado —
  **finaliza o trabalho enviando o feedback** (avaliação) ao contratante.
- **Contato:** endereço e telefone são **opcionais no cadastro** e vêm **pré-preenchidos** no
  formulário do projeto (editáveis por projeto). O e-mail do dono é sempre exibido como contato.
- **Regras do MVP:** projetos em andamento **não podem ser editados nem reabertos** — para mudar,
  publique um novo projeto. Editar/Excluir só ficam disponíveis enquanto o projeto está *Publicado*.

## Painel inicial e menu (acessibilidade)

Depois do login o app abre no **Painel (Início)** — antes ele caía direto em *Projetos*.
O painel responde três perguntas, nesta ordem:

1. **"como estou?"** → cinco cartões de resumo, calculados **conforme o papel**
   (contratante vê *projetos publicados / candidaturas recebidas*; freelancer vê
   *vagas abertas / minhas candidaturas*), mais a reputação 360.
2. **"o que faço agora?"** → o cartão **Próximo passo**, que mostra *uma* ação recomendada
   e um botão que leva direto a ela. A prioridade é: o que trava outra pessoa vem primeiro
   (ex.: "o freelancer entregou, conclua e avalie" ganha de "candidatos esperando escolha").
3. **"onde fica cada coisa?"** → um cartão por módulo (Projetos, Meu perfil, Flags).

### Menu: gaveta no celular, barra no desktop
Abaixo de 700px o menu vive numa **gaveta** que abre no botão ☰; acima disso a **mesma
marcação** vira barra horizontal — só o CSS muda. Menu duplicado no HTML seria lido duas
vezes pelo leitor de tela.

### O que foi feito de acessibilidade (e por quê)

| Recurso | Por que existe |
|---|---|
| Link **"Pular para o conteúdo"** (1º Tab) | Salta o menu inteiro em vez de tabular por todos os itens em cada página (WCAG 2.4.1) |
| `<nav aria-label="Menu principal">` | Dá nome à região; quem usa leitor de tela navega direto até ela |
| Módulos em `<ul>`/`<li>` | O leitor anuncia "lista com 4 itens" — a pessoa sabe o tamanho antes de percorrer |
| `aria-current="page"` no item ativo | Anuncia "página atual". **É também o seletor do CSS** — se o atributo faltar, o destaque some e o bug fica visível |
| `aria-expanded` + `aria-controls` no ☰ | Informam que o botão abre/fecha algo, e qual elemento |
| **Esc** fecha a gaveta e devolve o foco ao ☰ | Não deixa o teclado preso nem o foco perdido (WCAG 2.1.2) |
| Abrir leva o foco ao 1º item; escolher fecha e devolve | Quem usa teclado não precisa tatear atrás do menu |
| Setas ↑↓←→ circulam pelos itens | Navegação esperada dentro de um menu |
| `<main id="conteudo" tabIndex={-1}>` | Destino do skip link (o tabindex negativo permite foco por programa sem entrar na ordem do Tab) |
| `<output>` anunciando "Seção atual: X" | A troca de aba não recarrega a página; sem isso, quem não vê a mudança não sabe que ela aconteceu |
| Anel de foco só no teclado (`:focus-visible`) | Verde-escuro no claro, amarelo no cabeçalho escuro — 3:1 de contraste, sem poluir o clique de mouse |
| Emojis com `aria-hidden="true"` | Senão o leitor anuncia "casa Início" |
| `prefers-reduced-motion` | Desliga as transições para quem pediu isso no sistema (WCAG 2.3.3) |
| Alvos de toque ≥ 44px | Botões confortáveis no celular |

> ⚠️ **Menu não é modal.** A gaveta **não prende o foco** (sem *focus trap*), e isso é
> intencional: o padrão ARIA (APG) pede armadilha de foco em `dialog`/`aria-modal`, mas em
> **menu de navegação** o esperado é justamente conseguir sair com Tab.

> 🧠 **Contraste corrigido de bônus:** o selo *Em andamento* usava `#8A6D00` sobre `#FFF3CC`
> = **4,17:1**, abaixo do mínimo AA de 4,5:1 para texto normal. Virou `#7D6200` (**5,3:1**),
> mesmo tom de mostarda.

### Ícones: Lucide em SVG inline
Os ícones vêm do **[Lucide](https://lucide.dev)** (licença **ISC** — livre, inclusive comercial),
com os traços copiados para `src/components/Icone.jsx` em vez de instalar `lucide-react`:
são poucos, então o app não ganha dependência nem peso no build da Vercel, e funciona sem rede.

Duas decisões fazem esses ícones "se comportarem":

| Decisão | Efeito |
|---|---|
| `stroke="currentColor"` | O ícone **herda a cor do texto**: sai **branco** no cabeçalho escuro e nas caixinhas verdes, e **verde-escuro** no item ativo do menu (fundo branco). Uma cor fixa branca desapareceria ali |
| `aria-hidden="true"` + `focusable="false"` | Ícone é decoração: o nome do botão vem do texto ("Projetos"), nunca do desenho — o leitor de tela não anuncia ruído |

Mapa: `home` → Início · `clipboard-list` → Projetos · `user` → Meu perfil · `flag` → Flags ·
`menu`/`x` → gaveta · `lightbulb` → próximo passo · `arrow-right` → seta dos cartões.

> Seguem sendo emoji de propósito: o **✿ da marca** (identidade do Garapuvu, também na Landing),
> o **👋** da saudação (expressão, não um controle) e as **★ estrelas** da nota — que são um
> widget de avaliação com semântica própria em `Estrelas.jsx`, não um ícone de navegação.

### Onde mexer
```
src/modulos.js                    → catálogo dos módulos (menu e painel leem os DOIS daqui)
src/painel.js                     → cálculos do resumo e do próximo passo (funções puras)
src/pages/Dashboard.jsx           → a tela do painel
src/components/MenuPrincipal.jsx  → cabeçalho + menu/gaveta
src/components/Icone.jsx          → os ícones (Lucide inline)
```
Adicionar um módulo novo é acrescentar **um item em `modulos.js`**: o menu e os atalhos do
painel acompanham sozinhos (sem risco de os dois discordarem).

> 💡 **Recarregar a página (F5) reabre no painel**, igual ao login — o app não tem rotas de
> URL, então não há endereço para "voltar". É por isso que o helper
> `e2e/apoio.js → recarregarEmProjetos()` existe: os testes de fluxo recarregam para ver o
> que a outra pessoa fez na API e precisam entrar em *Projetos* de novo.

## Endpoints da API
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/usuarios` | Cadastro (e-mail único; papel freelancer/contratante; senha ≥ 4; endereço/telefone opcionais) |
| POST | `/login` | Autentica por e-mail e senha; retorna o usuário (sem a senha) |
| GET | `/usuarios/:id` | Retorna o usuário + média das avaliações recebidas |
| POST | `/contratos` | Publica um projeto aberto (freelancer opcional; contato do perfil) |
| GET | `/contratos` | Lista os projetos (com ids de candidatos e de quem já avaliou) |
| PATCH | `/contratos/:id` | Edita título/descrição/contato de um projeto |
| DELETE | `/contratos/:id` | Exclui um projeto |
| POST | `/contratos/:id/candidaturas` | Freelancer se candidata ao projeto |
| GET | `/contratos/:id/candidaturas` | Lista candidatos com nome e reputação (média 360) |
| PATCH | `/contratos/:id/selecionar` | Contratante seleciona um candidato → *Em aprovação* |
| PATCH | `/contratos/:id/andamento` | Confirma o acordo → *Em andamento* |
| PATCH | `/contratos/:id/concluir` | Encerra o projeto em andamento → *Concluído* |
| POST | `/avaliacoes` | Avaliação 360 (em andamento ou concluído; nota 1–5; 1 por lado) |
| GET | `/avaliacoes/usuario/:id` | Avaliações recebidas por um usuário |

## Pirâmide de testes neste projeto
- **Unitário (base):**
  - `backend/src/regras.test.js` — validação de nota, média, e-mail e `podeAvaliar`.
  - `frontend/src/painel.test.js` — os números do painel e a **prioridade do próximo passo**.
    São funções puras: dá para cobrir todo caso de borda sem renderizar tela nem subir a API.
- **Integração (meio):** `backend/src/app.test.js` — CRUD de projetos, fluxo de recrutamento e avaliação 360 (Supertest).
- **Componente (RTL):**
  - `frontend/src/components/Estrelas.test.jsx` — nota por estrelas.
  - `frontend/src/components/Icone.test.jsx` — o contrato do ícone: sempre decorativo (`aria-hidden`).
  - `frontend/src/components/MenuPrincipal.test.jsx` — **acessibilidade do menu**: nome da região,
    `aria-current`, `aria-expanded`, Esc devolvendo o foco, setas do teclado.
  - `frontend/src/pages/Dashboard.test.jsx` — números por papel, próximo passo, atalhos e o caso
    **"API fora do ar"** (o erro tira os números, **não** a navegação).
  - `frontend/src/App.test.jsx` — sessão, logout e a casca acessível (skip link, `<main>`, aviso de seção).
- **E2E (topo):**
  - `frontend/e2e/painel-menu.spec.js` — o painel refletindo uma candidatura **real** (2 navegadores),
    atalhos dos módulos, teclado no desktop e a **gaveta ☰ em viewport de celular** (390×844).
  - `frontend/e2e/projeto-crud.spec.js` — CRUD de projeto pela interface (criar/ler/editar/excluir).
  - `frontend/e2e/fluxo-completo.spec.js` — **smoke test** do fluxo completo com **dois atores**
    (contratante + freelancer em janelas separadas). Rode com `npm run e2e:smoke`.
  - `frontend/e2e/selecao-candidatos.spec.js`, `freelancer-duas-vagas.spec.js`, `logout.spec.js`.
  - `frontend/e2e/apoio.js` — helpers compartilhados (ver a nota do F5 acima).

> 🧠 **Por que testar o menu no nível de COMPONENTE, e não só no E2E?** Porque as consultas do
> Testing Library (`getByRole`, `toHaveAccessibleName`) enxergam a tela como um leitor de tela.
> Se um teste desses só passa com `getByTestId`, é sinal de que **falta semântica** no HTML —
> o teste vira um detector de acessibilidade, não só de regressão.

## Próximos passos (além do MVP)
- **Persistência real** (banco de dados) no lugar do armazenamento em memória.
- **Notificações** ao freelancer/contratante a cada transição de status (hoje é acompanhado na tela).
- **Chat/anexos** no projeto (a negociação do MVP acontece via WhatsApp, fora do app).
- **Filtros e busca** de projetos por categoria, faixa de valor e reputação mínima.
- **Retirar candidatura** e **cancelar seleção** antes de iniciar o trabalho.
- **Histórico e portfólio** por freelancer, com todas as avaliações recebidas.

---

**Usuários padrão (semeados automaticamente a cada `npm start` do backend):**

Contratante — `dougaq@gmail.com` / `1234`
Freelancer 1 — `douglas.queiroz@clinicorp.com` / `1234`
Freelancer 2 — `ana.freela@garapuvu.org` / `1234`

> Os dados ficam em memória: ao reiniciar o backend, projetos/avaliações são zerados,
> mas esses três usuários são recriados sozinhos, então o login `1234` sempre funciona.
