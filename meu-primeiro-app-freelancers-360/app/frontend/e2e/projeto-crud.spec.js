// E2E (Playwright) — CRUD COMPLETO de projeto pela interface, como contratante.
// Cobre: Cadastrar/entrar → Criar → Ler → Editar (Update) → Excluir (Delete).
// Usa data-testid como seletor estável (resiste a mudanças de texto/visual).
// Pré: backend em :3001 e frontend em :5173 rodando (npm start / npm run dev).
import { test, expect } from "@playwright/test";

// TAGs: @interface @e2e  → rodar só E2E: playwright test --grep @e2e
test("contratante faz o CRUD completo de um projeto pela interface", { tag: ["@interface", "@e2e"] }, async ({ page }) => {
  const sufixo = Date.now();
  const email = `contratante${sufixo}@x.com`;
  const titulo = `Landing page ${sufixo}`;
  const tituloEditado = `Landing page (revisada) ${sufixo}`;

  // ---- Cadastro + login automático como CONTRATANTE ----
  await page.goto("/");
  await page.getByTestId("landing-criar-conta").click();
  await page.getByTestId("input-nome").fill("Bruno Contratante");
  await page.getByTestId("input-papel").selectOption("contratante");
  await page.getByTestId("input-telefone").fill("(48) 90000-0000");
  await page.getByTestId("input-endereco").fill("Florianópolis/SC");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("1234");
  await page.getByTestId("enviar-auth").click();
  await expect(page.getByTestId("nav-projetos")).toBeVisible();
  // Pós-login o app abre no PAINEL (Início); este teste é do módulo Projetos.
  await page.getByTestId("nav-projetos").click();

  // ---- CREATE ----
  await page.getByTestId("novo-projeto").click();
  await page.getByTestId("input-titulo").fill(titulo);
  await page.getByTestId("input-descricao").fill("Preciso de uma landing page de uma página.");
  // telefone/endereço já vêm pré-preenchidos do perfil
  await expect(page.getByTestId("input-telefone-projeto")).toHaveValue("(48) 90000-0000");
  await page.getByTestId("salvar-projeto").click();

  // ---- READ ----
  const card = page.getByTestId("projeto-card").filter({ hasText: titulo });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Preciso de uma landing page");
  await expect(card).toContainText(email);            // contato puxado do perfil
  await expect(card).toContainText("Aguardando freelancer");

  // ---- UPDATE ----
  await card.getByTestId("editar-projeto").click();
  await page.getByTestId("input-titulo").fill(tituloEditado);
  await page.getByTestId("input-descricao").fill("Escopo revisado: landing + formulário.");
  await page.getByTestId("salvar-projeto").click();

  const cardEditado = page.getByTestId("projeto-card").filter({ hasText: tituloEditado });
  await expect(cardEditado).toBeVisible();
  await expect(cardEditado).toContainText("Escopo revisado");

  // ---- DELETE ---- (confirm nativo → aceitar)
  page.once("dialog", (dialog) => dialog.accept());
  await cardEditado.getByTestId("excluir-projeto").click();
  await expect(page.getByTestId("projeto-card").filter({ hasText: tituloEditado })).toHaveCount(0);
});
