# FreelaAvalia 360

Plataforma de freelancers com **avaliação 360°**: contratantes **publicam projetos abertos**,
freelancers **se candidatam**, o contratante **seleciona** um candidato (vendo a reputação de cada um)
e, ao final do trabalho, **os dois se avaliam** (nota de 1 a 5 + comentário).
Projeto do **Projeto Social Garapuvu 2026** — construído com apoio do GitHub Copilot.

> **Status de validação:** backend com **23 testes** (Vitest + Supertest) passando;
> frontend com testes de componente (RTL) e **E2E de fluxo completo** (Playwright).

## Tecnologias
- **Backend:** Node.js + Express (dados em memória, para fins didáticos)
- **Frontend:** React + Vite (layout **mobile-first**, cores do Projeto Garapuvu)
- **Testes:** Vitest (unitário/integração/componente), Supertest (API), React Testing Library (interface), Playwright (E2E)
- **Cobertura:** provider `v8` (relatório em `coverage/`)

## Estrutura
```
backend/   → API Express (regras.js, repositorio.js, app.js, server.js) + testes
frontend/  → React + Vite (components/, pages/, api.js) + testes + e2e/
api/       → adaptador que expõe a API do backend como função serverless na Vercel
vercel.json→ configuração de build/rotas do deploy
```

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
- **Unitário (base):** `backend/src/regras.test.js` — validação de nota, média, e-mail e `podeAvaliar`.
- **Integração (meio):** `backend/src/app.test.js` — CRUD de projetos, fluxo de recrutamento e avaliação 360 (Supertest).
- **Componente:** `frontend/src/components/Estrelas.test.jsx` (React Testing Library).
- **E2E (topo):**
  - `frontend/e2e/projeto-crud.spec.js` — CRUD de projeto pela interface (criar/ler/editar/excluir).
  - `frontend/e2e/fluxo-completo.spec.js` — **smoke test** do fluxo completo com **dois atores**
    (contratante + freelancer em janelas separadas). Rode com `npm run e2e:smoke`.
  - `frontend/e2e/avaliacao.spec.js` — `test.skip` (fluxo antigo; a avaliação 360 hoje é coberta
    pela integração e pelo smoke test).

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
