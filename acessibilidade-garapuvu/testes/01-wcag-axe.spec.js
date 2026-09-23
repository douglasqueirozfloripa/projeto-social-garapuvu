// Análise automática das regras WCAG 2.2 níveis A e AA com o axe-core — o
// mesmo motor de extensões como o axe DevTools e do Lighthouse.
const AxeBuilder = require('@axe-core/playwright').default;
const { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } = require('../suporte/bdd');

const REGRAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function analisar({ page, testInfo }, nome, incluir) {
  let analise = new AxeBuilder({ page })
    .withTags(REGRAS_WCAG)
    .exclude('#qa-legenda')
    // Modo legado: roda tudo nesta página (sem abrir uma aba extra no vídeo).
    .setLegacyMode(true);
  if (incluir) analise = analise.include(incluir);
  const resultado = await analise.analyze();

  // O conteúdo interno dos players é do YouTube, fora do nosso controle. O
  // axe marca esses nós com um alvo em duas partes (iframe + seletor interno):
  // eles vão para um anexo à parte e não reprovam o teste. O <iframe> em si
  // (título, foco) continua sendo avaliado normalmente.
  const doSite = [];
  const doYoutube = [];
  for (const v of resultado.violations) {
    const nossos = v.nodes.filter((n) => n.target.length === 1);
    const externos = v.nodes.filter((n) => n.target.length > 1);
    if (nossos.length) doSite.push({ ...v, nodes: nossos });
    if (externos.length) doYoutube.push({ ...v, nodes: externos });
  }
  await testInfo.attach(`axe — ${nome}.json`, {
    body: JSON.stringify(doSite, null, 2),
    contentType: 'application/json',
  });
  if (doYoutube.length) {
    await testInfo.attach(`axe — ${nome} — dentro do YouTube (informativo).json`, {
      body: JSON.stringify(doYoutube, null, 2),
      contentType: 'application/json',
    });
  }
  return { violations: doSite };
}

// Mensagem de falha legível: regra, impacto e onde está o problema.
function resumir(violacoes) {
  return violacoes.map((v) =>
    `[${v.impact}] ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`,
  );
}

funcionalidade('Conformidade com a WCAG 2.2 AA (axe-core)', () => {
  cenario('Página inicial sem violações no tema escuro', [
    Dado('que abro a página inicial no tema escuro', async ({ page }) => {
      await abrirPagina(page, { tema: 'dark' });
    }),
    Quando('analiso a página inteira com o axe-core nas regras WCAG 2.2 A e AA', async (ctx) => {
      ctx.mundo.resultado = await analisar(ctx, 'tema escuro');
    }),
    Entao('nenhuma violação é encontrada', async ({ mundo }) => {
      expect(resumir(mundo.resultado.violations)).toEqual([]);
    }),
  ]);

  cenario('Página inicial sem violações no tema claro', [
    Dado('que abro a página inicial no tema escuro', async ({ page }) => {
      await abrirPagina(page, { tema: 'dark' });
    }),
    Quando('troco para o tema claro pelo botão "Dia"', async ({ page }) => {
      await page.getByRole('button', { name: /tema claro/ }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.waitForTimeout(400); // transição de cor do tema
    }),
    E('analiso a página inteira com o axe-core', async (ctx) => {
      ctx.mundo.resultado = await analisar(ctx, 'tema claro');
    }),
    Entao('nenhuma violação é encontrada', async ({ mundo }) => {
      expect(resumir(mundo.resultado.violations)).toEqual([]);
    }),
  ]);

  cenario('Todos os módulos do currículo sem violações', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('abro cada um dos 5 módulos e analiso a seção do currículo', async (ctx) => {
      const abas = ctx.page.getByRole('button', { name: /^Módulo / });
      ctx.mundo.porModulo = {};
      for (let i = 0; i < (await abas.count()); i++) {
        await abas.nth(i).click();
        const nome = (await abas.nth(i).innerText()).replace(/\s+/g, ' ');
        const r = await analisar(ctx, nome, '#conteudo');
        ctx.mundo.porModulo[nome] = resumir(r.violations);
      }
    }),
    Entao('nenhum módulo tem violações', async ({ mundo }) => {
      for (const violacoes of Object.values(mundo.porModulo)) expect(violacoes).toEqual([]);
    }),
  ]);

  cenario('Seção de encontros sem violações depois de trocar o vídeo', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('escolho o Encontro 04 na lista', async ({ page }) => {
      await page.getByRole('button', { name: /Encontro 04/ }).click();
      await expect(page.getByRole('group', { name: /^Player de vídeo: Encontro 04/ })).toBeFocused();
    }),
    E('analiso a seção de encontros com o axe-core', async (ctx) => {
      ctx.mundo.resultado = await analisar(ctx, 'encontros', '#encontros');
    }),
    Entao('nenhuma violação é encontrada', async ({ mundo }) => {
      expect(resumir(mundo.resultado.violations)).toEqual([]);
    }),
  ]);
});
