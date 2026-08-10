// SMOKE TEST (E2E) — RECRUTAMENTO COM CONCORRÊNCIA ENTRE CANDIDATOS.
// TRÊS atores em contextos de navegador independentes (login simultâneo):
//   1 contratante + 2 freelancers concorrendo à MESMA vaga.
// Percurso: contratante publica → as duas freelancers se candidatam →
//   contratante REMOVE uma candidata → SELECIONA a outra →
//   (cenários) removida volta a poder se candidatar; não-selecionada vê "vaga em processo";
//   selecionada vê a confirmação → andamento → avaliações 360 → Concluído.
//
// Rodar acompanhando na tela:  npm run e2e:smoke:selecao   (headed + slowMo)
// Pré (sem webServer): backend em :3001 e frontend em :5173 no ar.
// TAGs: @interface @e2e  → rodar só E2E: playwright test --grep @e2e
import { test, expect } from "@playwright/test";
import { recarregarEmProjetos } from "./apoio.js";

const BASE = "http://localhost:5173";

async function cadastrar(page, { nome, papel, email, telefone, endereco }) {
  await page.goto("/");
  await page.getByTestId("landing-criar-conta").click();
  await page.getByTestId("input-nome").fill(nome);
  await page.getByTestId("input-papel").selectOption(papel);
  if (telefone) await page.getByTestId("input-telefone").fill(telefone);
  if (endereco) await page.getByTestId("input-endereco").fill(endereco);
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("1234");
  await page.getByTestId("enviar-auth").click();
  await expect(page.getByTestId("nav-projetos")).toBeVisible();
  // Pós-login o app abre no PAINEL (Início); este teste é do módulo Projetos.
  await page.getByTestId("nav-projetos").click();
}

test(
  "recrutamento: 2 candidatas → contratante remove 1 e seleciona a outra → andamento → concluído",
  { tag: ["@interface", "@e2e"] },
  async ({ browser }) => {
    const sufixo = Date.now();
    const titulo = `Aplicativo de delivery ${sufixo}`;

    // Um contexto de navegador por ator (sessões independentes e simultâneas).
    const ctxContratante = await browser.newContext({ baseURL: BASE });
    const ctxAna = await browser.newContext({ baseURL: BASE });
    const ctxBruno = await browser.newContext({ baseURL: BASE });
    const contratante = await ctxContratante.newPage();
    const ana = await ctxAna.newPage();
    const bruno = await ctxBruno.newPage();

    const cardC = () => contratante.getByTestId("projeto-card").filter({ hasText: titulo });
    const cardAna = () => ana.getByTestId("projeto-card").filter({ hasText: titulo });
    const cardBruno = () => bruno.getByTestId("projeto-card").filter({ hasText: titulo });
    const candidato = (nome) => contratante.getByTestId("candidato").filter({ hasText: nome });

    // 1) Contratante cadastra e PUBLICA a vaga
    await cadastrar(contratante, { nome: "Carla Contratante", email: `contratante${sufixo}@x.com`, papel: "contratante", telefone: "(48) 90000-0000", endereco: "Florianópolis/SC" });
    await contratante.getByTestId("novo-projeto").click();
    await contratante.getByTestId("input-titulo").fill(titulo);
    await contratante.getByTestId("input-descricao").fill("App de delivery com login, carrinho e pagamento.");
    await contratante.getByTestId("salvar-projeto").click();
    await expect(cardC()).toContainText("Publicado");

    // 2) As DUAS freelancers cadastram, veem a vaga e SE CANDIDATAM
    await cadastrar(ana, { nome: "Ana Dev", email: `ana${sufixo}@x.com`, papel: "freelancer" });
    await expect(cardAna()).toBeVisible();
    await cardAna().getByTestId("candidatar").click();
    await expect(cardAna()).toContainText("Candidatura enviada");

    await cadastrar(bruno, { nome: "Bruno Freela", email: `bruno${sufixo}@x.com`, papel: "freelancer" });
    await expect(cardBruno()).toBeVisible();
    await cardBruno().getByTestId("candidatar").click();
    await expect(cardBruno()).toContainText("Candidatura enviada");

    // 3) Contratante recarrega e abre "Ver candidatos": deve haver DUAS candidatas
    await recarregarEmProjetos(contratante);
    await expect(cardC()).toContainText("Ver candidatos (2)");
    await cardC().getByTestId("ver-candidatos").click();
    await expect(contratante.getByTestId("candidato")).toHaveCount(2);
    await expect(candidato("Ana Dev")).toBeVisible();
    await expect(candidato("Bruno Freela")).toBeVisible();

    // 4) Contratante REMOVE a Ana → sobra apenas o Bruno na lista
    await candidato("Ana Dev").getByRole("button", { name: "Remover" }).click();
    await expect(contratante.getByTestId("candidato")).toHaveCount(1);
    await expect(candidato("Bruno Freela")).toBeVisible();
    await expect(candidato("Ana Dev")).toHaveCount(0);

    // CENÁRIO A — a candidata removida, com a vaga ainda aberta, volta a poder se candidatar
    await recarregarEmProjetos(ana);
    await expect(cardAna().getByTestId("candidatar")).toBeVisible();

    // 5) Contratante SELECIONA o Bruno → projeto vai para "Em aprovação"
    await candidato("Bruno Freela").getByRole("button", { name: "Selecionar" }).click();
    await expect(cardC()).toContainText("Em aprovação");

    // CENÁRIO B — como a vaga saiu de "Publicado", some da lista da freelancer não escolhida
    // (o freelancer só enxerga projetos abertos ou aqueles em que ele foi selecionado).
    await recarregarEmProjetos(ana);
    await expect(cardAna()).toHaveCount(0);

    // CENÁRIO C — o selecionado vê a confirmação de que foi escolhido
    await recarregarEmProjetos(bruno);
    await expect(cardBruno()).toContainText("Você foi selecionado");

    // 6) Contratante FECHA O ACORDO (WhatsApp) → Em andamento
    await cardC().getByTestId("iniciar-andamento").click();
    await expect(cardC()).toContainText("Em andamento");

    // 7) Bruno FINALIZA o trabalho e envia FEEDBACK (avaliação 360) ao contratante
    await recarregarEmProjetos(bruno);
    await cardBruno().getByTestId("finalizar-trabalho").click();
    await bruno.getByTestId("estrela-5").click();
    await bruno.getByTestId("enviar-avaliacao").click();
    await expect(cardBruno()).toContainText("Feedback enviado");

    // 8) Contratante CONCLUI avaliando o freelancer → Concluído
    await recarregarEmProjetos(contratante);
    await cardC().getByTestId("concluir-projeto").click();
    await contratante.getByTestId("estrela-5").click();
    await contratante.getByTestId("enviar-avaliacao").click();
    await expect(cardC()).toContainText("Concluído");

    await ctxContratante.close();
    await ctxAna.close();
    await ctxBruno.close();
  }
);
