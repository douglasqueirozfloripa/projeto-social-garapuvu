// SMOKE TEST (E2E) — fluxo completo do projeto, com DOIS atores em janelas separadas.
// Contratante e Freelancer usam contextos de navegador independentes (login simultâneo).
// Usa data-testid como seletor estável em todo o percurso.
// Percurso: login contratante → abre vaga → freelancer se candidata → contratante
//           seleciona → fecha acordo (andamento) → freelancer entrega + avalia →
//           contratante conclui + avalia → projeto Concluído.
//
// Rodar acompanhando na tela:  npm run e2e:smoke   (headed + slowMo)
// Pré: backend em :3001 e frontend em :5173 no ar (npm start / npm run dev).
import { test, expect } from "@playwright/test";
import { recarregarEmProjetos } from "./apoio.js";

const BASE = "http://localhost:5173";

async function cadastrar(page, { nome, email, papel, telefone, endereco }) {
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

// TAGs: @interface @e2e  → rodar só E2E: playwright test --grep @e2e
test("fluxo completo: publicar → candidatar → selecionar → andamento → avaliações → concluído", { tag: ["@interface", "@e2e"] }, async ({ browser }) => {
  const sufixo = Date.now();
  const titulo = `Site institucional ${sufixo}`;

  const ctxContratante = await browser.newContext({ baseURL: BASE });
  const ctxFreelancer = await browser.newContext({ baseURL: BASE });
  const contratante = await ctxContratante.newPage();
  const freelancer = await ctxFreelancer.newPage();

  const cardC = () => contratante.getByTestId("projeto-card").filter({ hasText: titulo });
  const cardF = () => freelancer.getByTestId("projeto-card").filter({ hasText: titulo });

  // 1) Contratante cadastra e PUBLICA a vaga
  await cadastrar(contratante, { nome: "Bruno Contratante", email: `contratante${sufixo}@x.com`, papel: "contratante", telefone: "(48) 90000-0000", endereco: "Florianópolis/SC" });
  await contratante.getByTestId("novo-projeto").click();
  await contratante.getByTestId("input-titulo").fill(titulo);
  await contratante.getByTestId("input-descricao").fill("Site institucional com 4 páginas e formulário de contato.");
  await contratante.getByTestId("salvar-projeto").click();
  await expect(cardC()).toContainText("Publicado");

  // 2) Freelancer cadastra, VÊ a vaga e SE CANDIDATA
  await cadastrar(freelancer, { nome: "Ana Dev", email: `freelancer${sufixo}@x.com`, papel: "freelancer" });
  await expect(cardF()).toBeVisible();
  await cardF().getByTestId("candidatar").click();
  await expect(cardF()).toContainText("Candidatura enviada");

  // 3) Contratante vê o candidato (com reputação) e SELECIONA
  await recarregarEmProjetos(contratante);
  await cardC().getByTestId("ver-candidatos").click();
  const candidato = contratante.getByTestId("candidato").filter({ hasText: "Ana Dev" });
  await expect(candidato).toBeVisible();
  await candidato.getByTestId(/^selecionar-/).click();
  await expect(cardC()).toContainText("Em aprovação");

  // 4) Contratante FECHA O ACORDO (WhatsApp) → Em andamento
  await cardC().getByTestId("iniciar-andamento").click();
  await expect(cardC()).toContainText("Em andamento");

  // 5) Freelancer FINALIZA o trabalho e envia FEEDBACK (avaliação) ao contratante
  await recarregarEmProjetos(freelancer);
  await cardF().getByTestId("finalizar-trabalho").click();
  await freelancer.getByTestId("estrela-5").click();
  await freelancer.getByTestId("enviar-avaliacao").click();
  await expect(cardF()).toContainText("Feedback enviado");

  // 6) Contratante CONCLUI avaliando o freelancer → Concluído
  await recarregarEmProjetos(contratante);
  await cardC().getByTestId("concluir-projeto").click();
  await contratante.getByTestId("estrela-5").click();
  await contratante.getByTestId("enviar-avaliacao").click();
  await expect(cardC()).toContainText("Concluído");

  await ctxContratante.close();
  await ctxFreelancer.close();
});
