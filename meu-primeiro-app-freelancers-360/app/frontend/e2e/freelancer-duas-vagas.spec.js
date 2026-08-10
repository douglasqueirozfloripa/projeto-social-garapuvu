// SMOKE TEST (E2E) — UM FREELANCER ATENDENDO DUAS CONTRATANTES AO MESMO TEMPO.
// TRÊS atores em contextos de navegador independentes (login simultâneo):
//   2 contratantes (cada uma com o seu projeto) + 1 freelancer.
// Percurso: contratante A publica vaga A; contratante B publica vaga B →
//   o MESMO freelancer se candidata às DUAS → cada contratante seleciona,
//   fecha o acordo e conclui avaliando → o freelancer entrega e avalia as duas →
//   ambos os projetos terminam em Concluído.
//
// Rodar acompanhando na tela:  npm run e2e:smoke:duas-vagas   (headed + slowMo)
// Pré (sem webServer): backend em :3001 e frontend em :5173 no ar.
// TAGs: @interface @e2e  → rodar só E2E: playwright test --grep @e2e
import { test, expect } from "@playwright/test";

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
}

async function publicar(page, cardFn, { titulo, descricao }) {
  await page.getByTestId("novo-projeto").click();
  await page.getByTestId("input-titulo").fill(titulo);
  await page.getByTestId("input-descricao").fill(descricao);
  await page.getByTestId("salvar-projeto").click();
  await expect(cardFn()).toContainText("Publicado");
}

// Contratante: recarrega, seleciona o freelancer entre os candidatos e fecha o acordo.
async function selecionarEIniciar(page, cardFn, freelancerNome) {
  await page.reload();
  await cardFn().getByTestId("ver-candidatos").click();
  await page.getByTestId("candidato").filter({ hasText: freelancerNome }).getByRole("button", { name: "Selecionar" }).click();
  await expect(cardFn()).toContainText("Em aprovação");
  await cardFn().getByTestId("iniciar-andamento").click();
  await expect(cardFn()).toContainText("Em andamento");
}

// Contratante: recarrega, conclui e avalia o freelancer com 5 estrelas.
async function concluir(page, cardFn) {
  await page.reload();
  await cardFn().getByTestId("concluir-projeto").click();
  await page.getByTestId("estrela-5").click();
  await page.getByTestId("enviar-avaliacao").click();
  await expect(cardFn()).toContainText("Concluído");
}

test(
  "um freelancer atende 2 contratantes: candidata-se a 2 vagas e conclui as duas",
  { tag: ["@interface", "@e2e"] },
  async ({ browser }) => {
    const sufixo = Date.now();
    const tituloA = `Site institucional ${sufixo}`;
    const tituloB = `App mobile ${sufixo}`;
    const freelaNome = "Célia Multi";

    // Um contexto por ator (sessões independentes e simultâneas).
    const ctxA = await browser.newContext({ baseURL: BASE });
    const ctxB = await browser.newContext({ baseURL: BASE });
    const ctxF = await browser.newContext({ baseURL: BASE });
    const contratanteA = await ctxA.newPage();
    const contratanteB = await ctxB.newPage();
    const freelancer = await ctxF.newPage();

    const cardA_C = () => contratanteA.getByTestId("projeto-card").filter({ hasText: tituloA });
    const cardB_C = () => contratanteB.getByTestId("projeto-card").filter({ hasText: tituloB });
    const cardA_F = () => freelancer.getByTestId("projeto-card").filter({ hasText: tituloA });
    const cardB_F = () => freelancer.getByTestId("projeto-card").filter({ hasText: tituloB });

    // 1) Contratante A cadastra e PUBLICA a vaga A
    await cadastrar(contratanteA, { nome: "Alice Contratante", email: `contratanteA${sufixo}@x.com`, papel: "contratante", telefone: "(48) 90000-0001", endereco: "Florianópolis/SC" });
    await publicar(contratanteA, cardA_C, { titulo: tituloA, descricao: "Site institucional com 4 páginas." });

    // 2) Contratante B cadastra e PUBLICA a vaga B
    await cadastrar(contratanteB, { nome: "Bento Contratante", email: `contratanteB${sufixo}@x.com`, papel: "contratante", telefone: "(48) 90000-0002", endereco: "São José/SC" });
    await publicar(contratanteB, cardB_C, { titulo: tituloB, descricao: "App mobile com login e push." });

    // 3) UM freelancer cadastra, vê AS DUAS vagas e SE CANDIDATA a ambas
    await cadastrar(freelancer, { nome: freelaNome, email: `freela${sufixo}@x.com`, papel: "freelancer" });
    await expect(cardA_F()).toBeVisible();
    await expect(cardB_F()).toBeVisible();
    await cardA_F().getByTestId("candidatar").click();
    await expect(cardA_F()).toContainText("Candidatura enviada");
    await cardB_F().getByTestId("candidatar").click();
    await expect(cardB_F()).toContainText("Candidatura enviada");

    // 4) Cada contratante SELECIONA o freelancer e FECHA O ACORDO
    // (selecionarEIniciar recarrega a página do contratante antes de abrir os candidatos).
    await selecionarEIniciar(contratanteA, cardA_C, freelaNome);
    await selecionarEIniciar(contratanteB, cardB_C, freelaNome);

    // 5) O freelancer, selecionado nas DUAS, entrega cada trabalho e envia feedback (avaliação 360)
    await freelancer.reload();
    await cardA_F().getByTestId("finalizar-trabalho").click();
    await freelancer.getByTestId("estrela-5").click();
    await freelancer.getByTestId("enviar-avaliacao").click();
    await expect(cardA_F()).toContainText("Feedback enviado");

    await cardB_F().getByTestId("finalizar-trabalho").click();
    await freelancer.getByTestId("estrela-5").click();
    await freelancer.getByTestId("enviar-avaliacao").click();
    await expect(cardB_F()).toContainText("Feedback enviado");

    // 6) Cada contratante CONCLUI avaliando o freelancer → ambos os projetos ficam Concluído
    await concluir(contratanteA, cardA_C);
    await concluir(contratanteB, cardB_C);

    await ctxA.close();
    await ctxB.close();
    await ctxF.close();
  }
);
