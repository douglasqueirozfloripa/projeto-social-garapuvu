// Usabilidade para quem navega só pelo teclado — o mesmo caminho que o NVDA
// usa no modo de foco. Cobre as melhorias pedidas depois do 12º encontro.
const { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } = require('../suporte/bdd');

const { focoAtual } = require('../suporte/teclado');

funcionalidade('Usabilidade com teclado', () => {
  cenario('A ordem do Tab no topo segue a ordem pedida', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('aperto Tab até chegar a "Ver o conteúdo"', async ({ page, legenda, mundo }) => {
      // Dentro do vídeo, cada Tab passa por um controle do próprio YouTube e o
      // foco da página continua no <iframe>: essas repetições contam como uma
      // parada só, que é o que a pessoa percebe ("estou no vídeo").
      mundo.ordem = [];
      for (let i = 0; i < 25 && !/^a: Ver o conteúdo/.test(mundo.ordem.at(-1) ?? ''); i++) {
        await page.keyboard.press('Tab');
        const foco = await focoAtual(page);
        if (foco === mundo.ordem.at(-1)) continue;
        mundo.ordem.push(foco);
        await legenda.foco(`Tab → ${foco}`);
        await page.waitForTimeout(350);
      }
    }),
    Entao('o foco passa por: tema, vídeo de apresentação, Quero participar, Assistir as aulas e Ver o conteúdo', async ({ mundo }) => {
      expect(mundo.ordem).toHaveLength(5);
      expect(mundo.ordem[0]).toMatch(/^button: Mudar para o tema/);
      expect(mundo.ordem[1]).toBe('iframe: Vídeo de apresentação do Projeto Social Garapuvu');
      expect(mundo.ordem[2]).toMatch(/^button: Quero participar/);
      expect(mundo.ordem[3]).toMatch(/^a: .*Assistir as aulas/);
      expect(mundo.ordem[4]).toMatch(/^a: Ver o conteúdo/);
    }),
  ]);

  cenario('Depois de escolher um encontro, Tab e Shift+Tab não voltam para o topo', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('foco o botão do Encontro 05 e aperto Enter', async ({ page }) => {
      await page.getByRole('button', { name: /Encontro 05/ }).focus();
      await page.keyboard.press('Enter');
    }),
    Entao('o foco vai para o player do encontro e o vídeo toca sozinho', async ({ page }) => {
      await expect(page.getByRole('group', { name: /^Player de vídeo: Encontro 05/ })).toBeFocused();
      await expect(page.locator('#encontros iframe')).toHaveAttribute('src', /autoplay=1/);
    }),
    Quando('espero o YouTube carregar e aperto Shift+Tab', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.keyboard.press('Shift+Tab');
    }),
    Entao('o foco vai para o botão do Módulo Bônus, o último item antes da seção de encontros', async ({ page }) => {
      await expect(page.locator('#modulo-botao-bonus')).toBeFocused();
    }),
    Quando('aperto Tab', async ({ page }) => {
      await page.keyboard.press('Tab');
    }),
    Entao('o foco vai para o atalho "Pular o vídeo", o primeiro item do player', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Pular o vídeo' })).toBeFocused();
      await expect(page.getByRole('link', { name: 'Pular o vídeo' })).toBeInViewport();
    }),
    Quando('aperto Tab de novo', async ({ page }) => {
      await page.keyboard.press('Tab');
    }),
    Entao('o foco entra no vídeo do encontro, e nunca no vídeo de apresentação do topo', async ({ page }) => {
      await expect(page.locator('#encontros iframe')).toBeFocused();
      expect(await focoAtual(page)).not.toContain('Vídeo de apresentação');
    }),
  ]);

  cenario('O Tab passa por todos os módulos do currículo, em sequência', [
    Dado('que abro a página inicial e foco o link "Ver o conteúdo"', async ({ page }) => {
      await abrirPagina(page);
      await page.getByRole('link', { name: 'Ver o conteúdo' }).focus();
    }),
    Quando('aperto Tab seis vezes', async ({ page, legenda, mundo }) => {
      mundo.ordem = [];
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        mundo.ordem.push(await page.evaluate(() => document.activeElement.id));
        await legenda.foco(`Tab → ${await focoAtual(page)}`);
      }
    }),
    Entao('o foco passa pelo Módulo 01, pelas aulas dele e pelos Módulos 02, 03, 04 e Bônus', async ({ mundo }) => {
      expect(mundo.ordem).toEqual([
        'modulo-botao-01', 'modulo-painel-01', 'modulo-botao-02',
        'modulo-botao-03', 'modulo-botao-04', 'modulo-botao-bonus',
      ]);
    }),
    Quando('volto ao Módulo 02 e aperto Enter', async ({ page }) => {
      await page.locator('#modulo-botao-02').focus();
      await page.keyboard.press('Enter');
    }),
    Entao('o Módulo 02 abre e o Módulo 01 fecha', async ({ page }) => {
      await expect(page.locator('#modulo-botao-02')).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#modulo-botao-01')).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('#modulo-painel-02')).toBeVisible();
      await expect(page.locator('#modulo-painel-01')).toBeHidden();
    }),
    Quando('aperto Tab duas vezes', async ({ page, legenda, mundo }) => {
      mundo.ordem = [];
      for (let i = 0; i < 2; i++) {
        await page.keyboard.press('Tab');
        mundo.ordem.push(await page.evaluate(() => document.activeElement.id));
        await legenda.foco(`Tab → ${await focoAtual(page)}`);
      }
    }),
    Entao('o foco entra nas aulas do Módulo 02 e depois segue para o Módulo 03', async ({ mundo }) => {
      expect(mundo.ordem).toEqual(['modulo-painel-02', 'modulo-botao-03']);
    }),
    E('as setas ↑ e ↓ também pulam direto entre os módulos', async ({ page }) => {
      await page.locator('#modulo-botao-03').focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('#modulo-botao-04')).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await expect(page.locator('#modulo-botao-02')).toBeFocused();
    }),
  ]);

  cenario('Todo elemento focável mostra o contorno de foco', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('percorro a página inteira com Tab', async ({ page, legenda, mundo }) => {
      mundo.semContorno = [];
      mundo.visitados = [];
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const a = document.activeElement;
          // Dentro do player do YouTube o foco é do YouTube: não é nosso contorno.
          if (!a || a === document.body || a.tagName === 'IFRAME') return null;
          const cs = getComputedStyle(a);
          const nome = (a.getAttribute('aria-label') || a.textContent).trim().replace(/\s+/g, ' ').slice(0, 60);
          const temContorno = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
          return { nome, temContorno, rodape: !!a.closest('footer') };
        });
        if (!info) continue;
        if (!mundo.visitados.includes(info.nome)) {
          mundo.visitados.push(info.nome);
          await legenda.foco(`${info.temContorno ? '✓ contorno' : '✗ sem contorno'} — ${info.nome}`);
        }
        if (!info.temContorno) mundo.semContorno.push(info.nome);
        if (info.rodape && /GitHub/.test(info.nome)) break; // último link da página
      }
    }),
    Entao('todos têm contorno de pelo menos 2px', async ({ mundo }) => {
      expect([...new Set(mundo.semContorno)]).toEqual([]);
    }),
    E('o Tab chega até o último link do rodapé (sem armadilha de foco)', async ({ mundo }) => {
      expect(mundo.visitados.some((n) => /GitHub/.test(n))).toBe(true);
    }),
  ]);

  cenario('Alvos de clique e toque têm pelo menos 24×24 px (WCAG 2.5.8)', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('meço todos os botões, links e abas visíveis', async ({ page, mundo }) => {
      mundo.pequenos = await page.evaluate(() =>
        [...document.querySelectorAll('button, a[href]')]
          .filter((e) => !e.closest('#qa-legenda') && e.getClientRects().length && !e.classList.contains('gp-pular'))
          .map((e) => ({ nome: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 50), r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.width < 24 || r.height < 24)
          .map(({ nome, r }) => `${nome} (${Math.round(r.width)}×${Math.round(r.height)})`),
      );
    }),
    Entao('nenhum é menor que 24×24 px', async ({ mundo }) => {
      expect(mundo.pequenos).toEqual([]);
    }),
  ]);

  cenario('A escolha de tema continua valendo depois de recarregar', [
    Dado('que abro a página inicial no tema escuro', async ({ page }) => {
      await abrirPagina(page, { tema: 'dark' });
    }),
    Quando('troco para o tema claro com o teclado', async ({ page }) => {
      await page.getByRole('button', { name: /tema claro/ }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    }),
    E('recarrego a página', async ({ page }) => {
      await page.reload();
    }),
    Entao('o tema claro continua ativo', async ({ page }) => {
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.getByRole('button', { name: /tema escuro/ })).toBeVisible();
    }),
  ]);

  cenario('Com "reduzir movimento" ligado, nada fica escondido esperando animação', [
    Dado('que o sistema pede menos movimento e abro a página', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await abrirPagina(page);
    }),
    Quando('ativo o link "Assistir as aulas"', async ({ page, mundo }) => {
      await page.getByRole('link', { name: 'Assistir as aulas' }).click();
      mundo.rolagemImediata = await page.evaluate(() => Math.round(window.scrollY));
    }),
    Entao('a página salta direto para a seção, sem rolagem suave', async ({ page, mundo }) => {
      const topoSecao = await page.locator('#encontros').evaluate((e) => Math.round(e.getBoundingClientRect().top));
      expect(mundo.rolagemImediata).toBeGreaterThan(300);
      expect(Math.abs(topoSecao)).toBeLessThan(60);
    }),
    E('todos os blocos da página já estão visíveis (opacidade 1)', async ({ page }) => {
      const invisiveis = await page.evaluate(() =>
        [...document.querySelectorAll('main *')].filter((e) => e.style.opacity === '0').length,
      );
      expect(invisiveis).toBe(0);
    }),
  ]);
});
