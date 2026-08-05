# Instruções do projeto para o GitHub Copilot

> O GitHub Copilot lê este arquivo automaticamente e usa o conteúdo como **contexto
> permanente** em todo chat/sugestão deste repositório. Mantenha-o curto e atual.

## O que é o projeto

**FreelaAvalia 360** — plataforma-escola de freelancers com **avaliação 360°** entre
freelancer e contratante. Contratantes publicam projetos abertos; freelancers se
candidatam; o contratante vê os candidatos com a reputação de cada um e seleciona; ao
final, os dois se avaliam (nota de 1 a 5 + comentário). Projeto do **Projeto Social
Garapuvu** para ensinar desenvolvimento e testes na prática.

## Stack

- **Backend:** Node + Express, dados **em memória** (arrays em `repositorio.js`), sem banco.
- **Frontend:** React + Vite, mobile-first, sessão no `localStorage`.
- **Testes:** Vitest (unitário), Supertest (integração), React Testing Library (componente),
  Playwright (E2E). Cobertura com o provider `v8`.
- **Estrutura:** pasta `app/` com `backend/` e `frontend/` lado a lado.

## Regras de negócio (não quebrar)

- **Usuário:** e-mail único e válido; papel `freelancer` ou `contratante`; senha ≥ 4
  caracteres; **a senha NUNCA aparece nas respostas da API**.
- **Projeto:** nasce `aberto`; percorre a máquina de status na ordem
  `aberto → em_aprovacao → em_andamento → concluido` (nunca pular etapa). Só o dono
  edita/exclui, e só enquanto `aberto`. Projeto concluído nunca é excluído.
- **Candidatura:** 1 por freelancer por projeto; só em projeto `aberto`.
- **Avaliação:** só em `em_andamento` ou `concluido`; nota inteira de 1 a 5; 1 por lado;
  avaliador e avaliado precisam ser as partes do contrato.

## Como você (Copilot) deve responder aqui*

- **Peça em partes pequenas:** um endpoint, um componente ou um teste por vez.
- **Sempre gere o teste junto** da função/rota nova, cobrindo caminho feliz **e** erros/bordas.
- **Valide entradas** e devolva os status HTTP corretos (200/201/400/401/404).
- **Separe app de servidor:** `app.js` exporta a app Express; `server.js` dá o `listen`
  (deixa a API testável sem subir porta).
- **Comente com JSDoc** cada função e rota.
- **Seletores estáveis:** adicione `data-testid` nos botões de ação (candidatar, selecionar,
  excluir, enviar-avaliação, sair) para o Playwright não quebrar quando o visual mudar.
- **Segurança:** nada de senhas/segredos no código; use `.env` e um `.gitignore` que ignore
  `node_modules/` e `.env`.
- **Mocks só na borda** (rede, relógio, navegador) — nunca a regra de negócio que o teste verifica.
