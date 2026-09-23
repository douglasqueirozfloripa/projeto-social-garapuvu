// Navegação reversa com Shift+Tab em todas as experiências da página.
//
// Motivo: no reteste do 13º encontro, depois de escolher um encontro, o
// Shift+Tab "se perdia" e o foco voltava ao topo. Aqui cada experiência
// (topo, tema, abas de módulos, links de rolagem, encontros, player, rodapé)
// é testada nos dois sentidos: Shift+Tab precisa ir para o elemento ANTERIOR
// na página, e um Tab em seguida precisa voltar para onde estava.
const { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } = require('../suporte/bdd');
const { focoAtual, navegar, apertar } = require('../suporte/teclado');

const TEMA = /^button: Mudar para o tema/;
const VIDEO_TOPO = 'iframe: Vídeo de apresentação do Projeto Social Garapuvu';
const GITHUB = /^a: Repositório do Projeto Garapuvu no GitHub/;

funcionalidade('Navegação reversa com Shift+Tab', () => {
  cenario('Shift+Tab percorre a página inteira na ordem exata inversa do Tab', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('percorro a página inteira com Tab, do topo até o último link do rodapé', async ({ page, legenda, mundo }) => {
      mundo.ida = await navegar(page, legenda, 'Tab', (f) => GITHUB.test(f));
      expect(mundo.ida.at(-1)).toMatch(GITHUB);
    }),
    E('volto com Shift+Tab até o primeiro elemento da página', async ({ page, legenda, mundo }) => {
      mundo.volta = await navegar(page, legenda, 'Shift+Tab', (f) => TEMA.test(f));
    }),
    Entao('a volta passa pelos mesmos elementos, na ordem inversa, sem pular nenhum', async ({ mundo, testInfo }) => {
      await testInfo.attach('ordem do Tab e do Shift+Tab.txt', {
        body: `TAB (${mundo.ida.length} paradas)\n${mundo.ida.join('\n')}\n\nSHIFT+TAB (${mundo.volta.length} paradas)\n${mundo.volta.join('\n')}`,
        contentType: 'text/plain',
      });
      // A volta começa no penúltimo (o último é onde ela partiu).
      expect(mundo.volta).toEqual(mundo.ida.slice(0, -1).reverse());
    }),
    E('em nenhum momento o foco escapa para o topo da página no meio do caminho', async ({ mundo }) => {
      const noMeio = mundo.volta.slice(0, -2);
      expect(noMeio.filter((f) => f === VIDEO_TOPO || TEMA.test(f))).toEqual([]);
    }),
  ]);

  cenario('No topo, Shift+Tab volta de "Ver o conteúdo" até o botão de tema', [
    Dado('que abro a página inicial e foco o link "Ver o conteúdo"', async ({ page, legenda }) => {
      await abrirPagina(page);
      await page.getByRole('link', { name: 'Ver o conteúdo' }).focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando('aperto Shift+Tab até sair do topo', async ({ page, legenda, mundo }) => {
      mundo.volta = await navegar(page, legenda, 'Shift+Tab', (f) => TEMA.test(f), 30);
    }),
    Entao('o foco passa por Assistir as aulas, Quero participar, o vídeo de apresentação e o tema', async ({ mundo }) => {
      expect(mundo.volta).toHaveLength(4);
      expect(mundo.volta[0]).toMatch(/^a: .*Assistir as aulas/);
      expect(mundo.volta[1]).toMatch(/^button: Quero participar/);
      expect(mundo.volta[2]).toBe(VIDEO_TOPO);
      expect(mundo.volta[3]).toMatch(TEMA);
    }),
  ]);

  cenario('Depois de trocar o tema, Tab e Shift+Tab continuam do botão de tema', [
    Dado('que abro a página inicial no tema escuro', async ({ page }) => {
      await abrirPagina(page, { tema: 'dark' });
    }),
    Quando('chego ao botão de tema com Tab e aperto Enter', async ({ page, legenda }) => {
      expect(await apertar(page, legenda, 'Tab')).toMatch(TEMA);
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    }),
    Entao('o foco continua no botão, agora oferecendo o tema escuro', async ({ page }) => {
      await expect(page.getByRole('button', { name: /tema escuro/ })).toBeFocused();
    }),
    Quando('aperto Tab e depois Shift+Tab', async ({ page, legenda, mundo }) => {
      mundo.ida = await apertar(page, legenda, 'Tab');
      mundo.volta = await apertar(page, legenda, 'Shift+Tab');
    }),
    Entao('o Tab vai para o vídeo de apresentação e o Shift+Tab volta para o botão de tema', async ({ mundo }) => {
      expect(mundo.ida).toBe(VIDEO_TOPO);
      expect(mundo.volta).toMatch(/^button: Mudar para o tema escuro/);
    }),
  ]);

  cenario('Depois de "Assistir as aulas", Shift+Tab vai para o conteúdo anterior, não para o topo', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('ativo o link "Assistir as aulas" com o teclado', async ({ page }) => {
      await page.getByRole('link', { name: 'Assistir as aulas' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#encontros-titulo')).toBeFocused();
    }),
    E('aperto Shift+Tab', async ({ page, legenda, mundo }) => {
      mundo.volta = await apertar(page, legenda, 'Shift+Tab');
    }),
    Entao('o foco vai para o botão do Módulo Bônus, o último item antes da seção de encontros', async ({ page }) => {
      await expect(page.locator('#modulo-botao-bonus')).toBeFocused();
    }),
    Quando('aperto Tab', async ({ page, legenda, mundo }) => {
      mundo.ida = await apertar(page, legenda, 'Tab');
    }),
    Entao('o foco vai para o atalho "Pular o vídeo", o primeiro item da seção', async ({ mundo }) => {
      expect(mundo.ida).toBe('a: Pular o vídeo');
    }),
  ]);

  cenario('Depois de "Ver o conteúdo", Shift+Tab volta para o link e Tab vai para a aba ativa', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('ativo o link "Ver o conteúdo" com o teclado', async ({ page }) => {
      await page.getByRole('link', { name: 'Ver o conteúdo' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#conteudo-titulo')).toBeFocused();
    }),
    E('aperto Shift+Tab', async ({ page, legenda, mundo }) => {
      mundo.volta = await apertar(page, legenda, 'Shift+Tab');
    }),
    Entao('o foco volta para o link "Ver o conteúdo", o item anterior na página', async ({ mundo }) => {
      expect(mundo.volta).toMatch(/^a: Ver o conteúdo/);
    }),
    Quando('aperto Enter de novo e depois Tab', async ({ page, legenda, mundo }) => {
      await page.keyboard.press('Enter');
      mundo.ida = await apertar(page, legenda, 'Tab');
    }),
    Entao('o foco vai para a aba do Módulo 01', async ({ mundo }) => {
      expect(mundo.ida).toMatch(/^button: Módulo 01/);
    }),
  ]);

  cenario('No currículo, Shift+Tab volta módulo por módulo, passando pelas aulas do módulo aberto', [
    Dado('que abro a página inicial e abro o Módulo 03', async ({ page, legenda }) => {
      await abrirPagina(page);
      await page.locator('#modulo-botao-03').click();
      await expect(page.locator('#modulo-botao-03')).toHaveAttribute('aria-expanded', 'true');
    }),
    E('foco o botão do Módulo Bônus', async ({ page, legenda }) => {
      await page.locator('#modulo-botao-bonus').focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando('aperto Shift+Tab até sair do currículo', async ({ page, legenda, mundo }) => {
      mundo.ids = [];
      for (let i = 0; i < 8; i++) {
        await apertar(page, legenda, 'Shift+Tab');
        const id = await page.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim());
        mundo.ids.push(id);
        if (!id.startsWith('modulo-')) break;
      }
    }),
    Entao('o foco passa por Módulo 04, aulas do 03, Módulo 03, 02 e 01 e chega a "Ver o conteúdo"', async ({ mundo }) => {
      expect(mundo.ids).toEqual([
        'modulo-botao-04', 'modulo-painel-03', 'modulo-botao-03',
        'modulo-botao-02', 'modulo-botao-01', 'Ver o conteúdo',
      ]);
    }),
  ]);

  cenario('Na lista de encontros, Shift+Tab volta um encontro por vez', [
    Dado('que abro a página inicial e foco o botão do Encontro 04', async ({ page, legenda }) => {
      await abrirPagina(page);
      await page.getByRole('button', { name: /Encontro 04/ }).focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando('aperto Shift+Tab até sair da lista', async ({ page, legenda, mundo }) => {
      mundo.volta = await navegar(page, legenda, 'Shift+Tab', (f) => /Abrir no YouTube/.test(f), 10);
    }),
    Entao('o foco passa pelos Encontros 03, 02 e 01 e chega ao link "Abrir no YouTube"', async ({ mundo }) => {
      expect(mundo.volta).toHaveLength(4);
      expect(mundo.volta[0]).toMatch(/Encontro 03/);
      expect(mundo.volta[1]).toMatch(/Encontro 02/);
      expect(mundo.volta[2]).toMatch(/Encontro 01/);
      expect(mundo.volta[3]).toMatch(/^a: Abrir no YouTube/);
    }),
  ]);

  cenario('Com o vídeo do encontro tocando, dá para pular o player e voltar para ele com Shift+Tab', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('escolho o Encontro 06 com Enter', async ({ page }) => {
      await page.getByRole('button', { name: /Encontro 06/ }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('group', { name: /^Player de vídeo: Encontro 06/ })).toBeFocused();
      await page.waitForTimeout(2000); // YouTube termina de carregar e começa a tocar
    }),
    E('aperto Tab', async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, 'Tab');
    }),
    Entao('o foco chega ao atalho "Pular o vídeo", visível sobre o player', async ({ page, mundo }) => {
      expect(mundo.foco).toBe('a: Pular o vídeo');
      await expect(page.getByRole('link', { name: 'Pular o vídeo' })).toBeInViewport();
    }),
    Quando('aperto Enter no atalho e depois Tab', async ({ page, legenda, mundo }) => {
      await page.keyboard.press('Enter');
      await expect(page.locator('#encontro-resumo-titulo')).toBeFocused();
      await legenda.foco('Enter → resumo do encontro');
      mundo.foco = await apertar(page, legenda, 'Tab');
    }),
    Entao('o foco pula os ~50 controles do YouTube e chega a "Abrir no YouTube"', async ({ mundo }) => {
      expect(mundo.foco).toMatch(/^a: Abrir no YouTube/);
    }),
    Quando('aperto Shift+Tab', async ({ page, legenda, mundo }) => {
      mundo.foco = await apertar(page, legenda, 'Shift+Tab');
    }),
    Entao('o foco volta para o vídeo do Encontro 06, e não para o vídeo do topo', async ({ mundo }) => {
      expect(mundo.foco).toMatch(/^iframe: Vídeo do YouTube: Encontro 06/);
    }),
    E('continuando com Shift+Tab, o foco sai do vídeo pelo atalho e chega ao último módulo do currículo', async ({ page, legenda, mundo }) => {
      mundo.saida = await navegar(page, legenda, 'Shift+Tab', (f) => !/Encontro 06/.test(f) && f !== 'a: Pular o vídeo', 90);
      expect(mundo.saida).toContain('a: Pular o vídeo');
      await expect(page.locator('#modulo-botao-bonus')).toBeFocused();
    }),
  ]);

  cenario('No rodapé, Shift+Tab volta pelas redes sociais até o botão de inscrição', [
    Dado('que abro a página inicial e foco o link do GitHub no rodapé', async ({ page, legenda }) => {
      await abrirPagina(page);
      await page.getByRole('link', { name: /GitHub/ }).focus();
      await legenda.foco(await focoAtual(page));
    }),
    Quando('aperto Shift+Tab quatro vezes', async ({ page, legenda, mundo }) => {
      mundo.volta = [];
      for (let i = 0; i < 4; i++) mundo.volta.push(await apertar(page, legenda, 'Shift+Tab'));
    }),
    Entao('o foco passa por LinkedIn, YouTube, Instagram e chega a "Saiba mais e participe"', async ({ mundo }) => {
      expect(mundo.volta[0]).toMatch(/LinkedIn/);
      expect(mundo.volta[1]).toMatch(/YouTube/);
      expect(mundo.volta[2]).toMatch(/Instagram/);
      expect(mundo.volta[3]).toMatch(/^button: Saiba mais e participe/);
    }),
  ]);
});
