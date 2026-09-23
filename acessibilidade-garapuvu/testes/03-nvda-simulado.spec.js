// Navegação com leitor de tela, reproduzindo o teste exploratório do Abner
// Oliveira no 12º encontro (15/09/2026). As asserções usam as falas originais
// do leitor virtual; a legenda e a voz mostram a versão em português.
const { funcionalidade, cenario, Dado, Quando, Entao, E, expect, abrirPagina } = require('../suporte/bdd');

const TITULO_H1 = 'heading, Aprender tecnologia de graça, de qualquer lugar do mundo., level 1';
const SECOES_H2 = [
  'Um encontro por semana. O ano inteiro com você.',
  'Cinco módulos, do fundamento à Inteligência Artificial e aos dados.',
  'Perdeu uma aula? Assista aqui mesmo.',
  'Por que o Garapuvu existe',
  'O ano, ramo a ramo',
  'Quer fazer parte do projeto?',
];

const ligarNvda = () =>
  Dado('que abro a página inicial com o NVDA ligado', async ({ page, leitor }) => {
    await abrirPagina(page);
    await leitor.ligar();
  });

// Repete um comando de navegação até o leitor parar de encontrar itens novos.
async function percorrer(leitor, comando, limite = 30) {
  const vistos = [];
  for (let i = 0; i < limite; i++) {
    const [frase] = await leitor.comando(comando);
    if (!frase || frase === vistos[vistos.length - 1] || vistos.includes(frase)) break;
    vistos.push(frase);
  }
  return vistos;
}

funcionalidade('Navegação com leitor de tela (NVDA simulado)', () => {
  cenario('Ler o topo da página com a seta para baixo', [
    ligarNvda(),
    Quando('leio o topo com a seta para baixo até o título principal', async ({ leitor }) => {
      await leitor.lerAte(TITULO_H1);
    }),
    Entao('o NVDA descreve a imagem de fundo do garapuvu', async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain('image, Árvore de garapuvu florida, com flores amarelas');
    }),
    E('o botão de tema diz para qual tema ele muda', async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain('button, Mudar para o tema claro (dia)');
    }),
    E('anuncia o título principal como nível 1', async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain(TITULO_H1);
    }),
    Quando('continuo lendo até os links do topo', async ({ leitor }) => {
      await leitor.lerAte('link, Ver o conteúdo');
    }),
    Entao('o botão de inscrição avisa que abre o WhatsApp em nova aba', async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain('button, Quero participar (abre o WhatsApp em nova aba)');
    }),
    E('"Assistir as aulas" é anunciado como link', async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain('link, Assistir as aulas');
    }),
    E('nenhum símbolo decorativo (▶ ● →) é lido', async ({ leitor }) => {
      expect(leitor.falasOriginais().filter((f) => /[▶▷●→↗]/.test(f))).toEqual([]);
    }),
  ]);

  cenario('Navegar pelos títulos com a tecla H', [
    ligarNvda(),
    Quando('percorro a página inteira com a tecla H', async ({ leitor, mundo }) => {
      mundo.titulos = await percorrer(leitor, 'moveToNextHeading');
    }),
    Entao('o primeiro título é o principal, de nível 1', async ({ mundo }) => {
      expect(mundo.titulos[0]).toBe(TITULO_H1);
    }),
    E('as seções aparecem como títulos de nível 2, na ordem da página', async ({ mundo }) => {
      const nivel2 = mundo.titulos
        .map((f) => f.match(/^heading, (.*), level 2$/)?.[1])
        .filter(Boolean);
      expect(nivel2).toEqual(SECOES_H2);
    }),
  ]);

  cenario('Navegar pelas regiões com a tecla D', [
    ligarNvda(),
    Quando('percorro a página inteira com a tecla D', async ({ leitor, mundo }) => {
      mundo.regioes = await percorrer(leitor, 'moveToNextLandmark');
    }),
    Entao('a primeira região é o conteúdo principal', async ({ mundo }) => {
      expect(mundo.regioes[0]).toBe('main');
    }),
    E('cada seção é uma região com nome, e o rodapé tem as redes sociais', async ({ mundo }) => {
      for (const secao of ['Números do projeto', ...SECOES_H2]) {
        expect(mundo.regioes).toContain(`region, ${secao}`);
      }
      expect(mundo.regioes).toContain('contentinfo');
      expect(mundo.regioes).toContain('navigation, Redes sociais');
    }),
  ]);

  cenario('"Assistir as aulas" leva o foco para a seção de encontros', [
    ligarNvda(),
    Quando('chego ao link "Assistir as aulas" com a tecla Tab', async ({ page, leitor }) => {
      // O caminho passa pelo vídeo de apresentação: dentro dele, o Tab percorre
      // os controles do próprio YouTube antes de voltar para a página.
      const link = page.getByRole('link', { name: 'Assistir as aulas' });
      for (let i = 0; i < 25; i++) {
        await leitor.tecla('Tab');
        if (await link.evaluate((e) => e === document.activeElement)) return;
      }
      throw new Error('O Tab não chegou ao link "Assistir as aulas".');
    }),
    Entao('o NVDA anuncia "Assistir as aulas" como link', async ({ leitor }) => {
      expect(leitor.falasOriginais()).toContain('link, Assistir as aulas');
    }),
    E('aperto Enter', async ({ leitor, mundo }) => {
      mundo.aposEnter = await leitor.tecla('Enter');
    }),
    Entao('o NVDA anuncia o título da seção de encontros', async ({ mundo }) => {
      expect(mundo.aposEnter).toContain('heading, Perdeu uma aula? Assista aqui mesmo., level 2');
    }),
    E('o foco do teclado está no título da seção', async ({ page }) => {
      await expect(page.locator('#encontros-titulo')).toBeFocused();
    }),
    E('a seta para baixo continua a leitura dentro da seção, e não do topo', async ({ leitor }) => {
      await leitor.lerAte(/encontros já publicados/, 4);
    }),
  ]);

  cenario('"Ver o conteúdo" leva o foco para o currículo e o Tab continua dali', [
    ligarNvda(),
    Quando('foco o link "Ver o conteúdo" e aperto Enter', async ({ page, leitor, mundo }) => {
      await page.getByRole('link', { name: 'Ver o conteúdo' }).focus();
      await leitor.anunciar();
      mundo.aposEnter = await leitor.tecla('Enter');
    }),
    Entao('o NVDA anuncia o título do currículo', async ({ mundo }) => {
      expect(mundo.aposEnter.some((f) => /^heading, Cinco módulos.*level 2$/.test(f))).toBe(true);
    }),
    Quando('aperto Tab', async ({ leitor, mundo }) => {
      mundo.aposTab = await leitor.tecla('Tab');
    }),
    Entao('o foco vai para o botão do Módulo 01, anunciado como expandido', async ({ mundo }) => {
      expect(mundo.aposTab.some((f) => /^button, Módulo 01 .*, expanded$/.test(f))).toBe(true);
    }),
  ]);

  cenario('Escolher um encontro leva o foco para o player, sem se perder no Tab', [
    ligarNvda(),
    Quando('vou até a lista de encontros com a tecla H', async ({ leitor }) => {
      await leitor.comandoAte('moveToNextHeading', 'heading, Escolha um encontro, level 3');
    }),
    E('avanço com a seta para baixo até o botão do Encontro 03', async ({ leitor, mundo }) => {
      mundo.botao = await leitor.lerAte(/^button, Encontro 03/);
    }),
    Entao('o NVDA lê o número, o título e a duração por extenso', async ({ mundo }) => {
      expect(mundo.botao).toContain('Meu primeiro app com IA');
      expect(mundo.botao).toContain('1 hora e 12 minutos');
      expect(mundo.botao).not.toContain('1h12');
    }),
    Quando('aciono o botão com Enter', async ({ leitor, mundo }) => {
      mundo.aposEnter = await leitor.acionar();
    }),
    Entao('o foco vai para o player e o NVDA anuncia o vídeo escolhido', async ({ page, mundo }) => {
      await expect(page.getByRole('group', { name: /^Player de vídeo: Encontro 03/ })).toBeFocused();
      expect(mundo.aposEnter.some((f) => f.includes('Player de vídeo: Encontro 03 — Meu primeiro app com IA'))).toBe(true);
    }),
    E('o vídeo começa a tocar e o botão fica marcado como atual', async ({ page }) => {
      await expect(page.locator('#encontros iframe')).toHaveAttribute('src', /autoplay=1/);
      await expect(page.getByRole('button', { name: /Encontro 03/ })).toHaveAttribute('aria-current', 'true');
    }),
    Quando('aperto Shift+Tab', async ({ leitor, mundo }) => {
      await leitor.page.waitForTimeout(1500); // YouTube termina de carregar
      mundo.falas = await leitor.tecla('Shift+Tab');
    }),
    Entao('o foco volta para o conteúdo logo antes do player, e não para o topo da página', async ({ page }) => {
      await expect(page.locator('#modulo-botao-bonus')).toBeFocused();
      await expect(page.locator('main iframe').first()).not.toBeFocused();
    }),
    Quando('volto ao player e aperto Tab', async ({ page, leitor, mundo }) => {
      await page.getByRole('button', { name: /Encontro 03/ }).click();
      await expect(page.getByRole('group', { name: /^Player de vídeo: Encontro 03/ })).toBeFocused();
      await leitor.anunciar();
      mundo.falas = await leitor.tecla('Tab');
    }),
    Entao('o NVDA anuncia o atalho "Pular o vídeo"', async ({ page, mundo }) => {
      expect(mundo.falas).toContain('link, Pular o vídeo');
      await expect(page.getByRole('link', { name: 'Pular o vídeo' })).toBeVisible();
    }),
    Quando('aperto Enter no atalho', async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla('Enter');
    }),
    Entao('o foco pula os controles do YouTube e vai para o resumo do encontro', async ({ page, mundo }) => {
      await expect(page.locator('#encontro-resumo-titulo')).toBeFocused();
      expect(mundo.falas.some((f) => /^heading, Meu primeiro app com IA.*level 3$/.test(f))).toBe(true);
    }),
  ]);

  cenario('Percorrer os módulos do currículo com Tab e abrir um deles', [
    ligarNvda(),
    Quando('chego ao botão do Módulo 01', async ({ page, leitor, mundo }) => {
      await page.locator('#modulo-botao-01').focus();
      mundo.falas = await leitor.anunciar();
    }),
    Entao('o NVDA anuncia o botão do Módulo 01 como expandido', async ({ mundo }) => {
      expect(mundo.falas.some((f) => /^button, Módulo 01 Fundamentos de Testes de Software.*, expanded$/.test(f))).toBe(true);
    }),
    Quando('aperto Tab', async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla('Tab');
    }),
    Entao('o foco entra nas aulas do Módulo 01', async ({ mundo }) => {
      expect(mundo.falas).toContain('region, Módulo 01 Fundamentos de Testes de Software');
    }),
    Quando('aperto Tab de novo', async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla('Tab');
    }),
    Entao('o foco vai para o Módulo 02, anunciado como recolhido', async ({ mundo }) => {
      expect(mundo.falas.some((f) => /^button, Módulo 02 Prática em Testes de Software.*, not expanded$/.test(f))).toBe(true);
    }),
    Quando('aperto Enter para abrir o Módulo 02', async ({ page, leitor }) => {
      await leitor.tecla('Enter');
      await expect(page.locator('#modulo-botao-02')).toHaveAttribute('aria-expanded', 'true');
    }),
    E('aperto Tab', async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla('Tab');
    }),
    Entao('o foco entra nas aulas do Módulo 02, logo depois do botão', async ({ leitor, mundo }) => {
      expect(mundo.falas).toContain('region, Módulo 02 Prática em Testes de Software');
      await leitor.lerAte('Testes funcionais e rastreabilidade', 8);
    }),
  ]);

  cenario('A troca de tema é anunciada', [
    ligarNvda(),
    Quando('aperto Tab uma vez', async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla('Tab');
    }),
    Entao('o foco chega ao botão de tema, que diz para onde leva', async ({ mundo }) => {
      expect(mundo.falas).toContain('button, Mudar para o tema claro (dia)');
    }),
    Quando('aperto Enter', async ({ leitor, mundo }) => {
      mundo.falas = await leitor.tecla('Enter');
    }),
    Entao('o NVDA anuncia "Tema claro ativado" pela região ao vivo', async ({ page, mundo }) => {
      await expect(page.getByRole('status')).toHaveText('Tema claro ativado');
      expect(mundo.falas.some((f) => f.includes('Tema claro ativado'))).toBe(true);
    }),
    E('o foco continua no botão, que agora oferece o tema escuro', async ({ page }) => {
      const botao = page.getByRole('button', { name: /tema escuro/ });
      await expect(botao).toBeFocused();
    }),
  ]);

  cenario('Links para o YouTube avisam que abrem em nova aba', [
    ligarNvda(),
    Quando('navego pelos links com a tecla K até "Abrir no YouTube"', async ({ leitor, mundo }) => {
      mundo.link = await leitor.comandoAte('moveToNextLink', /^link, Abrir no YouTube/);
    }),
    Entao('o NVDA avisa "abre em nova aba" antes de eu ativar', async ({ mundo }) => {
      expect(mundo.link).toContain('(abre em nova aba)');
      expect(mundo.link).not.toContain('↗');
    }),
  ]);
});
