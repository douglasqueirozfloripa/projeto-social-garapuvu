// A árvore de acessibilidade é o que o navegador entrega ao NVDA, JAWS e
// VoiceOver: papel (botão, link, título...), nome e estado de cada elemento.
// Aqui ela é lida direto do Chromium, pelo protocolo de depuração (CDP).
const { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } = require('../suporte/bdd');

// Árvore completa do Chromium, só com os nós que o leitor de tela enxerga.
async function lerArvore(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  return nodes
    .filter((n) => !n.ignored)
    .map((n) => ({ papel: n.role?.value, nome: (n.name?.value ?? '').trim() }))
    .filter((n) => n.papel && !['none', 'generic', 'InlineTextBox', 'StaticText', 'LineBreak'].includes(n.papel));
}

const INTERATIVOS = ['button', 'link', 'tab', 'textbox', 'checkbox', 'radio', 'combobox', 'menuitem', 'switch'];

funcionalidade('Árvore de acessibilidade (o que o NVDA recebe do navegador)', () => {
  cenario('A página tem as regiões que o NVDA lista com a tecla D', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    passoRegioes(),
  ]);

  cenario('A hierarquia de títulos não pula níveis', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('leio todos os títulos da árvore de acessibilidade', async ({ page, mundo, testInfo }) => {
      mundo.titulos = await page.getByRole('heading').evaluateAll((els) =>
        els.map((e) => ({ nivel: Number(e.tagName.slice(1)) || Number(e.getAttribute('aria-level')), texto: e.textContent.trim() })),
      );
      await testInfo.attach('estrutura de títulos.txt', {
        body: mundo.titulos.map((t) => `${'  '.repeat(t.nivel - 1)}h${t.nivel} ${t.texto}`).join('\n'),
        contentType: 'text/plain',
      });
    }),
    Entao('existe exatamente um título de nível 1, e é o primeiro', async ({ mundo }) => {
      expect(mundo.titulos.filter((t) => t.nivel === 1)).toHaveLength(1);
      expect(mundo.titulos[0].nivel).toBe(1);
    }),
    E('nenhum título desce mais de um nível em relação ao anterior', async ({ mundo }) => {
      const saltos = mundo.titulos
        .map((t, i) => (i && t.nivel > mundo.titulos[i - 1].nivel + 1 ? `h${mundo.titulos[i - 1].nivel} → h${t.nivel} "${t.texto}"` : null))
        .filter(Boolean);
      expect(saltos).toEqual([]);
    }),
  ]);

  cenario('Todo controle interativo tem nome acessível', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('leio a árvore de acessibilidade completa do Chromium', async ({ page, mundo, testInfo }) => {
      mundo.arvore = await lerArvore(page);
      await testInfo.attach('árvore de acessibilidade.txt', {
        body: mundo.arvore.map((n) => `${n.papel}: ${n.nome}`).join('\n'),
        contentType: 'text/plain',
      });
      await testInfo.attach('snapshot ARIA da página.yml', {
        body: await page.locator('body').ariaSnapshot(),
        contentType: 'text/yaml',
      });
    }),
    Entao('nenhum botão, link ou aba está sem nome', async ({ mundo }) => {
      const semNome = mundo.arvore.filter((n) => INTERATIVOS.includes(n.papel) && !n.nome);
      expect(semNome).toEqual([]);
    }),
    E('nenhuma imagem está sem descrição', async ({ mundo }) => {
      const semNome = mundo.arvore.filter((n) => ['image', 'img'].includes(n.papel) && !n.nome);
      expect(semNome).toEqual([]);
    }),
  ]);

  cenario('A imagem de fundo do topo tem descrição', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao('a árvore expõe uma imagem "Árvore de garapuvu florida, com flores amarelas"', async ({ page }) => {
      await expect(page.getByRole('img', { name: 'Árvore de garapuvu florida, com flores amarelas' })).toHaveCount(1);
    }),
    E('as camadas de gradiente por cima dela ficam fora da árvore', async ({ page }) => {
      const img = page.getByRole('img', { name: /garapuvu florida/ });
      const camadas = img.locator('xpath=following-sibling::div[position() <= 2]');
      await expect(camadas.first()).toHaveAttribute('aria-hidden', 'true');
      await expect(camadas.nth(1)).toHaveAttribute('aria-hidden', 'true');
    }),
  ]);

  cenario('Todo vídeo incorporado tem título', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao('os dois players têm título descritivo', async ({ page }) => {
      await expect(page.locator('iframe')).toHaveCount(2);
      await expect(page.locator('iframe').first()).toHaveAttribute('title', 'Vídeo de apresentação do Projeto Social Garapuvu');
      await expect(page.locator('#encontros iframe')).toHaveAttribute('title', /^Vídeo do YouTube: Encontro 01 — /);
    }),
  ]);

  cenario('Links e botões que abrem nova aba avisam antes', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Quando('procuro todos os links com target="_blank"', async ({ page, mundo }) => {
      mundo.links = page.locator('a[target="_blank"]');
      expect(await mundo.links.count()).toBeGreaterThan(0);
    }),
    Entao('o nome acessível de cada um diz "abre em nova aba"', async ({ mundo }) => {
      for (const link of await mundo.links.all()) await expect(link).toHaveAccessibleName(/abre em nova aba/);
    }),
    E('os botões de inscrição avisam que abrem o WhatsApp em nova aba', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Quero participar/ })).toHaveAccessibleName(/abre o WhatsApp em nova aba/);
      await expect(page.getByRole('button', { name: /Saiba mais e participe/ })).toHaveAccessibleName(/abre o WhatsApp em nova aba/);
    }),
  ]);

  cenario('O idioma da página é o português do Brasil', [
    Dado('que abro a página inicial', async ({ page }) => {
      await abrirPagina(page);
    }),
    Entao('o elemento <html> declara lang="pt-BR" (o NVDA escolhe a voz por ele)', async ({ page }) => {
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    }),
  ]);
});

// Passo reaproveitável: confere cada região pelo papel e pelo nome.
function passoRegioes() {
  return Entao('existem as regiões principal, rodapé, redes sociais e uma por seção', async ({ page }) => {
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Redes sociais' })).toHaveCount(1);
    for (const nome of [
      'Números do projeto',
      'Um encontro por semana. O ano inteiro com você.',
      /Cinco módulos/,
      'Perdeu uma aula? Assista aqui mesmo.',
      'Por que o Garapuvu existe',
      'O ano, ramo a ramo',
      'Quer fazer parte do projeto?',
    ]) {
      await expect(page.getByRole('region', { name: nome })).toHaveCount(1);
    }
  });
}
