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
