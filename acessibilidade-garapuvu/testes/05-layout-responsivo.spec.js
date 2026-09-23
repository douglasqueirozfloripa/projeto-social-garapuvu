// Layout em várias larguras de tela. 320px equivale a um desktop de 1280px com
// zoom de 400% — é o que a WCAG 1.4.10 (Refluxo) pede para funcionar sem
// rolagem horizontal. Cada largura anexa uma captura da página inteira.
const { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } = require('../suporte/bdd');

const LARGURAS = [
  { nome: 'celular pequeno (320px, zoom 400%)', width: 320, height: 720 },
  { nome: 'celular (390px)', width: 390, height: 844 },
  { nome: 'tablet (768px)', width: 768, height: 1024 },
  { nome: 'notebook (1280px)', width: 1280, height: 800 },
  { nome: 'monitor largo (1920px)', width: 1920, height: 1080 },
];

// Elementos com conteúdo que passam da borda direita da tela. Ignora o que está
// dentro de um contêiner com rolagem própria (abas de módulos no tablet) e as
// camadas decorativas do fundo, que são cortadas de propósito.
async function elementosVazando(page) {
  return page.evaluate(() => {
    const largura = document.documentElement.clientWidth;
    const rolavel = (e) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
        if (ox === 'hidden' && p.getBoundingClientRect().right <= largura + 1) return true;
      }
      return false;
    };
    return [...document.querySelectorAll('main *, footer *')]
      .filter((e) => !e.closest('#qa-legenda') && e.getClientRects().length)
      .filter((e) => e.getBoundingClientRect().right > largura + 1 && !rolavel(e))
      .map((e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} (direita em ${Math.round(e.getBoundingClientRect().right)}px)`)
      .slice(0, 10);
  });
}

// Pares de botões/links do topo que se sobrepõem.
async function sobreposicoes(page, seletor) {
  return page.locator(seletor).evaluateAll((els) => {
    const r = els.map((e) => ({ nome: e.textContent.trim().slice(0, 30), b: e.getBoundingClientRect() }));
    const pares = [];
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const a = r[i].b, b = r[j].b;
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
          pares.push(`${r[i].nome} × ${r[j].nome}`);
        }
      }
    }
    return pares;
  });
}

funcionalidade('Layout responsivo', () => {
  for (const tela of LARGURAS) {
    cenario(`A página se ajusta à tela de ${tela.nome}`, [
      Dado(`que abro a página inicial numa tela de ${tela.width}×${tela.height}`, async ({ page }) => {
        await page.setViewportSize({ width: tela.width, height: tela.height });
        await abrirPagina(page);
      }),
      Entao('não existe rolagem horizontal', async ({ page }) => {
        const { rolagem, largura } = await page.evaluate(() => ({
          rolagem: document.documentElement.scrollWidth,
          largura: document.documentElement.clientWidth,
        }));
        expect(rolagem).toBeLessThanOrEqual(largura);
      }),
      E('nenhum conteúdo vaza pela borda direita', async ({ page }) => {
        expect(await elementosVazando(page)).toEqual([]);
      }),
      E('os botões do topo não se sobrepõem', async ({ page }) => {
        expect(await sobreposicoes(page, 'main .gp-btn')).toEqual([]);
      }),
      E(tela.width <= 920 ? 'o vídeo do topo fica entre o texto e os botões, como na ordem do Tab'
                          : 'o vídeo do topo fica à direita do texto',
      async ({ page }) => {
        const video = await page.locator('main iframe').first().boundingBox();
        const titulo = await page.getByRole('heading', { level: 1 }).boundingBox();
        const botao = await page.getByRole('button', { name: /Quero participar/ }).boundingBox();
        if (tela.width <= 920) {
          expect(video.y).toBeGreaterThan(titulo.y + titulo.height);
          expect(botao.y).toBeGreaterThan(video.y + video.height);
        } else {
          expect(video.x).toBeGreaterThan(titulo.x + 200);
        }
      }),
      E('o player dos encontros fica acima da lista no celular e ao lado no desktop', async ({ page }) => {
        const player = await page.locator('#encontros [role="group"]').boundingBox();
        const lista = await page.getByRole('heading', { name: 'Escolha um encontro' }).locator('xpath=following-sibling::ul').boundingBox();
        if (tela.width <= 920) expect(lista.y).toBeGreaterThan(player.y + player.height);
        else expect(lista.x).toBeGreaterThan(player.x + player.width - 1);
      }),
      E('anexo uma captura da página inteira ao relatório', async ({ page, testInfo }) => {
        await testInfo.attach(`página inteira — ${tela.width}px.png`, {
          body: await page.screenshot({ fullPage: true, style: '#qa-legenda { display: none !important; }' }),
          contentType: 'image/png',
        });
      }),
    ]);
  }

  cenario('Com espaçamento de texto aumentado, nada é cortado (WCAG 1.4.12)', [
    Dado('que abro a página inicial numa tela de celular', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await abrirPagina(page);
    }),
    Quando('aplico o espaçamento da WCAG: altura de linha 1,5, letras 0,12em, palavras 0,16em, parágrafos 2em', async ({ page }) => {
      await page.addStyleTag({
        content: `main *, footer * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
                  main p, footer p { margin-bottom: 2em !important; }`,
      });
    }),
    Entao('nenhum botão, aba ou item de lista corta o próprio texto', async ({ page }) => {
      const cortados = await page.evaluate(() =>
        [...document.querySelectorAll('main button, main a.gp-btn')]
          .filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
          .map((e) => `${(e.getAttribute('aria-label') || e.textContent).trim().slice(0, 40)} (${e.scrollWidth}×${e.scrollHeight} em ${e.clientWidth}×${e.clientHeight})`),
      );
      expect(cortados).toEqual([]);
    }),
    E('continua sem rolagem horizontal', async ({ page }) => {
      const vazou = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(vazou).toBe(false);
    }),
  ]);
});
