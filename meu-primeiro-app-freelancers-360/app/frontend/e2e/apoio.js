// apoio.js — Ajudantes compartilhados pelos testes E2E.
import { expect } from "@playwright/test";

/**
 * Recarrega a página e volta para o módulo Projetos.
 *
 * Por que existe: um F5 com sessão ativa reabre o app na TELA INICIAL (o painel),
 * do mesmo jeito que o login. Os testes de fluxo de projeto precisam recarregar
 * para ver o que a outra pessoa fez na API — então, depois do reload, eles têm
 * de entrar em Projetos de novo. Concentrar isso aqui evita repetir o clique em
 * cada teste (e deixa claro POR QUE ele existe).
 */
export async function recarregarEmProjetos(page) {
  await page.reload();
  await page.getByTestId("nav-projetos").click();
  await expect(page.getByTestId("nav-projetos")).toHaveAttribute("aria-current", "page");
}
