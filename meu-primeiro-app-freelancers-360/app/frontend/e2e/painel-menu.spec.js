// E2E (Playwright) — PAINEL INICIAL (dashboard) + MENU PRINCIPAL.
//
// Cobre as jornadas novas de ponta a ponta, com backend de verdade:
//   1. pós-login cai no painel; os números refletem o que acontece nos projetos
//   2. os atalhos dos módulos levam a cada tela
//   3. acessibilidade por TECLADO no desktop (skip link, aria-current)
//   4. a gaveta ☰ no viewport de celular (abrir, Esc, escolher item)
//
// Por que aqui e não só em teste de componente: o componente prova a semântica
// isolada; o E2E prova que o número do painel muda quando um freelancer
// realmente se candidata, atravessando API e reidratação da tela.
//
// Cuidado com os números: o backend guarda tudo EM MEMÓRIA e é compartilhado
// entre os testes. Por isso só afirmamos valores do CONTRATANTE (que são
// contados a partir dos projetos dele, criados neste teste). "Vagas abertas" do
// freelancer conta a plataforma inteira e varia conforme os outros testes.
// Pré: backend em :3001 e frontend em :5173 (o webServer do playwright.config sobe ambos).
import { test, expect } from "@playwright/test";

async function cadastrar(page, { nome, papel, email }) {
  await page.goto("/");
  await page.getByTestId("landing-criar-conta").click();
  await page.getByTestId("input-nome").fill(nome);
  await page.getByTestId("input-papel").selectOption(papel);
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("1234");
  await page.getByTestId("enviar-auth").click();
  // Pós-login o app abre no PAINEL: é ele que precisa aparecer.
  await expect(page.getByTestId("painel")).toBeVisible();
}

// Lê o valor de um cartão de número do resumo.
const valorDoNumero = (page, id) => page.getByTestId(`numero-${id}`).locator("dd .numero-valor");

test("painel do contratante reflete o que acontece nos projetos de verdade", { tag: ["@interface", "@e2e"] }, async ({ browser }) => {
  const sufixo = Date.now();
  const titulo = `Identidade visual ${sufixo}`;

  const ctxC = await browser.newContext();
  const ctxF = await browser.newContext();
  const contratante = await ctxC.newPage();
  const freelancer = await ctxF.newPage();

  // ---- Entra e cai no painel, com Início marcado como página atual ----
  await cadastrar(contratante, { nome: "Paula Painel", papel: "contratante", email: `painel-c${sufixo}@x.com` });
  await expect(contratante.getByRole("heading", { level: 1 })).toContainText("Olá, Paula");
  await expect(contratante.getByTestId("nav-inicio")).toHaveAttribute("aria-current", "page");
  await expect(contratante.getByTestId("painel-papel")).toHaveText("contratante");

  // Conta nova: tudo zerado e o painel convidando a publicar o primeiro projeto.
  await expect(valorDoNumero(contratante, "publicados")).toHaveText("0");
  await expect(valorDoNumero(contratante, "candidaturas")).toHaveText("0");
  await expect(contratante.getByTestId("painel-passo")).toContainText("primeiro projeto");

  // ---- O botão do próximo passo leva ao módulo Projetos ----
  await contratante.getByTestId("painel-passo-acao").click();
  await expect(contratante.getByTestId("novo-projeto")).toBeVisible();
  await expect(contratante.getByTestId("nav-projetos")).toHaveAttribute("aria-current", "page");

  // ---- Publica um projeto e volta ao painel: o número subiu ----
  await contratante.getByTestId("novo-projeto").click();
  await contratante.getByTestId("input-titulo").fill(titulo);
  await contratante.getByTestId("input-descricao").fill("Logo e paleta de cores.");
  await contratante.getByTestId("salvar-projeto").click();
  await expect(contratante.getByTestId("projeto-card").filter({ hasText: titulo })).toBeVisible();

  await contratante.getByTestId("nav-inicio").click();
  await expect(valorDoNumero(contratante, "publicados")).toHaveText("1");

  // ---- Um freelancer se candidata ----
  await cadastrar(freelancer, { nome: "Ivo Freela", papel: "freelancer", email: `painel-f${sufixo}@x.com` });
  await freelancer.getByTestId("nav-projetos").click();
  const cardF = freelancer.getByTestId("projeto-card").filter({ hasText: titulo });
  await expect(cardF).toBeVisible();
  await cardF.getByTestId("candidatar").click();
  await expect(cardF).toContainText("Candidatura enviada");

  // ---- O painel do contratante enxerga a candidatura e muda o próximo passo ----
  // Sai e volta ao painel para ele buscar os dados de novo (o painel carrega ao montar).
  await contratante.getByTestId("nav-projetos").click();
  await contratante.getByTestId("nav-inicio").click();

  await expect(valorDoNumero(contratante, "candidaturas")).toHaveText("1");
  await expect(contratante.getByTestId("painel-passo")).toContainText("1 candidato espera sua escolha");
  await expect(contratante.getByTestId("painel-passo-acao")).toHaveText("Ver candidatos");

  await contratante.getByTestId("painel-passo-acao").click();
  await expect(contratante.getByTestId("novo-projeto")).toBeVisible();

  await ctxC.close();
  await ctxF.close();
});

test("os atalhos do painel levam a cada módulo", { tag: ["@interface"] }, async ({ page }) => {
  await cadastrar(page, { nome: "Rita Rotas", papel: "freelancer", email: `atalhos${Date.now()}@x.com` });

  // Atalho → Meu perfil
  await page.getByTestId("atalho-perfil").click();
  await expect(page.getByTestId("input-perfil-nome")).toBeVisible();
  await expect(page.getByTestId("nav-perfil")).toHaveAttribute("aria-current", "page");

  // Volta pelo menu e vai para Flags
  await page.getByTestId("nav-inicio").click();
  await page.getByTestId("atalho-flags").click();
  await expect(page.getByRole("heading", { name: "Feature flags" })).toBeVisible();

  // Volta pelo menu e vai para Projetos
  await page.getByTestId("nav-inicio").click();
  await page.getByTestId("atalho-projetos").click();
  await expect(page.getByTestId("nav-projetos")).toHaveAttribute("aria-current", "page");

  // O painel NÃO tem atalho para si mesmo.
  await page.getByTestId("nav-inicio").click();
  await expect(page.getByTestId("atalho-inicio")).toHaveCount(0);
});

test("dá para usar o app só com o teclado (skip link e menu)", { tag: ["@interface"] }, async ({ page }) => {
  await cadastrar(page, { nome: "Teo Teclado", papel: "contratante", email: `teclado${Date.now()}@x.com` });

  // O primeiro Tab da página cai no "Pular para o conteúdo".
  const pular = page.getByRole("link", { name: "Pular para o conteúdo" });
  await page.keyboard.press("Tab");
  await expect(pular).toBeFocused();
  await expect(pular).toBeVisible(); // só aparece quando focado (sai de cima da tela)

  // Ativando o link, o foco vai para o <main> — o menu inteiro é pulado.
  await page.keyboard.press("Enter");
  await expect(page.locator("main#conteudo")).toBeFocused();

  // Navegar pelo menu move o aria-current (é o que o leitor de tela anuncia).
  await page.getByTestId("nav-perfil").press("Enter");
  await expect(page.getByTestId("nav-perfil")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("nav-inicio")).not.toHaveAttribute("aria-current", "page");

  // O aviso invisível acompanha a seção atual.
  await expect(page.getByTestId("aviso-secao")).toHaveText("Seção atual: Meu perfil");
});

// A gaveta só existe abaixo de 700px, então este bloco roda em tela de celular.
test.describe("menu no celular (gaveta ☰)", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test("abre, fecha com Esc e navega pela gaveta", { tag: ["@interface"] }, async ({ page }) => {
    await cadastrar(page, { nome: "Gal Gaveta", papel: "contratante", email: `gaveta${Date.now()}@x.com` });

    const toggle = page.getByTestId("menu-toggle");

    // ---- Fechada: o botão ☰ aparece e os itens não ----
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("nav-projetos")).toBeHidden();

    // ---- Abre: itens visíveis e foco no primeiro ----
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("nav-projetos")).toBeVisible();
    await expect(page.getByTestId("nav-inicio")).toBeFocused();

    // ---- Esc fecha e devolve o foco ao ☰ (não deixa o teclado perdido) ----
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("nav-projetos")).toBeHidden();
    await expect(toggle).toBeFocused();

    // ---- Escolher um item navega E fecha a gaveta ----
    await toggle.click();
    await page.getByTestId("nav-projetos").click();
    await expect(page.getByTestId("novo-projeto")).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("nav-projetos")).toBeHidden();

    // ---- Clicar no fundo escuro também fecha ----
    await toggle.click();
    await expect(page.getByTestId("menu-fundo")).toBeVisible();
    await page.getByTestId("menu-fundo").click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("as setas do teclado circulam pelos itens da gaveta", { tag: ["@interface"] }, async ({ page }) => {
    await cadastrar(page, { nome: "Sofia Setas", papel: "freelancer", email: `setas${Date.now()}@x.com` });

    await page.getByTestId("menu-toggle").click();
    await expect(page.getByTestId("nav-inicio")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("nav-projetos")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("nav-perfil")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("nav-projetos")).toBeFocused();

    // Enter no item focado navega normalmente.
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("painel")).toHaveCount(0); // saiu do painel
  });

  test("o painel continua legível e utilizável na tela pequena", { tag: ["@interface"] }, async ({ page }) => {
    await cadastrar(page, { nome: "Moa Mobile", papel: "contratante", email: `mobile${Date.now()}@x.com` });

    // Sem rolagem horizontal: nada estourando a largura da tela.
    const estouraLargura = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(estouraLargura).toBe(false);

    // Os atalhos são alvos de toque confortáveis (mínimo recomendado: 44px).
    for (const id of ["atalho-projetos", "atalho-perfil", "atalho-flags"]) {
      const caixa = await page.getByTestId(id).boundingBox();
      expect(caixa.height).toBeGreaterThanOrEqual(44);
    }
    const caixaToggle = await page.getByTestId("menu-toggle").boundingBox();
    expect(caixaToggle.width).toBeGreaterThanOrEqual(44);
    expect(caixaToggle.height).toBeGreaterThanOrEqual(44);
  });
});
