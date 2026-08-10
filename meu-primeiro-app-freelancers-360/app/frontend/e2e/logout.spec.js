// E2E (Playwright) — LOGOUT (Sair) pela interface.
// Cobre: entrar → app visível (sessão salva no localStorage) → clicar em "Sair"
//        → volta para a Landing → sessão limpa → recarregar NÃO reloga sozinho
//        → dá para entrar de novo com as mesmas credenciais.
// Usa data-testid como seletor estável (resiste a mudanças de texto/visual).
// Pré: backend em :3001 e frontend em :5173 (o webServer do playwright.config sobe ambos).
import { test, expect } from "@playwright/test";

const CHAVE = "freelavalia_user"; // mesma chave usada em App.jsx

// TAGs: @interface @e2e  → rodar só E2E: playwright test --grep @e2e
test("usuário entra, faz logout e a sessão é encerrada de verdade", { tag: ["@interface", "@e2e"] }, async ({ page }) => {
  const sufixo = Date.now();
  const email = `logout${sufixo}@x.com`;

  // ---- Cadastro + login automático ----
  await page.goto("/");
  await page.getByTestId("landing-criar-conta").click();
  await page.getByTestId("input-nome").fill("Lara Logout");
  await page.getByTestId("input-papel").selectOption("freelancer");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("1234");
  await page.getByTestId("enviar-auth").click();

  // ---- Logado: app visível e sessão persistida ----
  await expect(page.getByTestId("nav-projetos")).toBeVisible();
  await expect(page.getByTestId("userchip")).toContainText("Lara Logout");
  const sessao = await page.evaluate((k) => localStorage.getItem(k), CHAVE);
  expect(sessao).toContain(email); // sessão gravada no localStorage

  // ---- LOGOUT ----
  await page.getByTestId("btn-sair").click();

  // ---- Voltou para a Landing e a sessão foi limpa ----
  await expect(page.getByTestId("landing-criar-conta")).toBeVisible();
  await expect(page.getByTestId("nav-projetos")).toHaveCount(0); // app não está mais na tela
  expect(await page.evaluate((k) => localStorage.getItem(k), CHAVE)).toBeNull();

  // ---- Recarregar NÃO deve relogar automaticamente ----
  await page.reload();
  await expect(page.getByTestId("landing-criar-conta")).toBeVisible();
  await expect(page.getByTestId("nav-projetos")).toHaveCount(0);

  // ---- É possível entrar de novo pela tela de login (Entrar) ----
  await page.getByTestId("landing-entrar").click();
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("1234");
  await page.getByTestId("enviar-auth").click();
  await expect(page.getByTestId("nav-projetos")).toBeVisible();
  await expect(page.getByTestId("userchip")).toContainText("Lara Logout");
});
