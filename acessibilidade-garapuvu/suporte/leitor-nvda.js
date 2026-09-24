/**
 * "NVDA simulado" — leitor de tela virtual rodando dentro do Chromium.
 *
 * O NVDA de verdade só existe no Windows. Aqui usamos o Virtual Screen Reader
 * da Guidepup (@guidepup/virtual-screen-reader): ele percorre a MESMA árvore de
 * acessibilidade que o navegador entrega ao NVDA e gera as frases que um leitor
 * de tela falaria ("heading, Título, level 2", "button, Nome"...).
 *
 * Os comandos imitam o modo de navegação do NVDA:
 *   proximo()           seta para baixo (lê o próximo item)
 *   proximoTitulo()     tecla H
 *   proximaRegiao()     tecla D
 *   proximoLink()       tecla K
 *   tecla('Tab')        teclado real do Playwright: dispara os eventos da página,
 *                       e o leitor acompanha o foco, como o NVDA acompanha.
 *
 * As frases originais (em inglês) ficam em `falasOriginais()` para as
 * asserções. A tradução para o português, no estilo do NVDA, é o que aparece
 * na legenda e é falado pela voz do macOS. É uma aproximação didática, não o
 * texto exato do NVDA.
 */
const fs = require('node:fs');

const BUNDLE = fs.readFileSync(
  require.resolve('@guidepup/virtual-screen-reader/browser.js'),
  'utf8',
);
const URL_BUNDLE = '/__leitor-virtual.js';

const PAPEIS = {
  document: 'documento',
  main: 'principal, ponto de referência',
  region: 'região',
  navigation: 'navegação, ponto de referência',
  contentinfo: 'informações de conteúdo, ponto de referência',
  banner: 'banner, ponto de referência',
  status: 'status',
  button: 'botão',
  link: 'link',
  image: 'gráfico',
  img: 'gráfico',
  list: 'lista',
  tab: 'aba',
  tablist: 'lista de abas',
  tabpanel: 'painel de aba',
  term: 'termo',
  definition: 'definição',
  iframe: 'quadro',
};

const ATRIBUTOS = [
  [/^selected$/, 'selecionado'],
  [/^not selected$/, 'não selecionado'],
  [/^expanded$/, 'expandido'],
  [/^not expanded$/, 'recolhido'],
  [/^current (\w+)$/, 'atual'],
  [/^\d+ controls?$/, null],
  [/^level (\d+)$/, 'nível $1'],
];

// Fala original do leitor virtual → frase no estilo do NVDA em português.
// Devolve null para o que o NVDA não fala (fim de parágrafo, ênfase...).
function traduzirFala(frase) {
  if (/^(paragraph|strong|emphasis|generic)$/.test(frase)) return null;
  if (/^end of (paragraph|heading|strong|emphasis|listitem|button|link|tab|term|definition|document)\b/.test(frase)) return null;

  let m;
  if ((m = frase.match(/^heading, (.*), level (\d)$/))) return `título nível ${m[2]}, ${m[1]}`;
  if ((m = frase.match(/^listitem, level \d+, position (\d+), set size (\d+)$/))) return `item ${m[1]} de ${m[2]}`;
  if ((m = frase.match(/^end of (\w+)/))) return `fora de ${PAPEIS[m[1]] ?? m[1]}`;
  if (frase === 'document') return 'documento';

  const partes = frase.split(', ');
  const papel = PAPEIS[partes[0]];
  if (!papel) return frase;

  // Lê os atributos a partir do fim ("position 2, set size 5", "selected"...),
  // para não quebrar nomes que têm vírgula no meio.
  const resto = partes.slice(1);
  const atributos = [];
  let posicao = null;
  while (resto.length) {
    const ultimo = resto[resto.length - 1];
    let mm;
    if ((mm = ultimo.match(/^set size (\d+)$/))) { posicao = { ...posicao, total: mm[1] }; resto.pop(); continue; }
    if ((mm = ultimo.match(/^position (\d+)$/))) { posicao = { ...posicao, atual: mm[1] }; resto.pop(); continue; }
    const regra = ATRIBUTOS.find(([re]) => re.test(ultimo));
    if (!regra) break;
    resto.pop();
    if (regra[1]) atributos.unshift(ultimo.replace(regra[0], regra[1]));
  }
  if (posicao?.atual && posicao?.total) atributos.push(`${posicao.atual} de ${posicao.total}`);
  const nome = resto.join(', ');
  return [papel, nome, ...atributos].filter(Boolean).join(', ');
}

class LeitorNvda {
  constructor(page, legenda, narrador) {
    this.page = page;
    this.legenda = legenda;
    this.narrador = narrador;
    this.lidas = 0;
    this.historico = [];
    this.rotaInstalada = false;
  }

  // Liga o leitor na página atual (depois de um reload, chame de novo).
  async ligar() {
    if (!this.rotaInstalada) {
      await this.page.route(`**${URL_BUNDLE}`, (rota) =>
        rota.fulfill({ contentType: 'text/javascript', body: BUNDLE }),
      );
      this.rotaInstalada = true;
    }
    await this.page.addScriptTag({
      type: 'module',
      content: `import { virtual } from '${URL_BUNDLE}'; window.__leitor = virtual;`,
    });
    await this.page.waitForFunction(() => window.__leitor);
    // displayCursor desenha o "cursor do NVDA" sobre o item lido — aparece no vídeo.
    await this.page.evaluate(() => window.__leitor.start({ container: document.body, displayCursor: true }));
    this.lidas = 0;
    return this.anunciar();
  }

  async parar() {
    await this.page.evaluate(() => window.__leitor?.stop()).catch(() => {});
  }

  // Pega as frases novas do leitor, mostra na legenda e fala com a voz do macOS.
  async anunciar() {
    const log = await this.page.evaluate(() => window.__leitor.spokenPhraseLog());
    const novas = log.slice(this.lidas);
    this.lidas = log.length;
    for (const frase of novas) {
      this.historico.push(frase);
      const pt = traduzirFala(frase);
      if (!pt) continue;
      await this.legenda.fala(pt);
      await this.narrador.falar(pt);
    }
    return novas;
  }

  async proximo() {
    await this.page.evaluate(() => window.__leitor.next());
    return this.anunciar();
  }

  async comando(nome) {
    await this.page.evaluate((n) => window.__leitor.perform(window.__leitor.commands[n]), nome);
    return this.anunciar();
  }

  proximoTitulo() { return this.comando('moveToNextHeading'); }
  proximaRegiao() { return this.comando('moveToNextLandmark'); }
  proximoLink() { return this.comando('moveToNextLink'); }

  // Enter no modo de navegação do NVDA: aciona (clica) o item sob o cursor virtual.
  async acionar() {
    await this.page.evaluate(() => window.__leitor.act());
    await this.page.waitForTimeout(400); // React atualiza e o foco se move
    return this.anunciar();
  }

  // Tecla real (eventos de verdade na página). O leitor acompanha o foco.
  async tecla(nome) {
    await this.page.keyboard.press(nome);
    await this.page.waitForTimeout(250); // React atualiza e o foco se move
    return this.anunciar();
  }

  // Lê com a seta para baixo até uma frase satisfazer o critério (ou desistir).
  async lerAte(criterio, limite = 60) {
    for (let i = 0; i < limite; i++) {
      const novas = await this.proximo();
      const achada = novas.find((f) => (criterio instanceof RegExp ? criterio.test(f) : f.includes(criterio)));
      if (achada) return achada;
    }
    throw new Error(`O leitor não encontrou "${criterio}" em ${limite} itens lidos.`);
  }

  // Aplica um comando (H, D, K...) até uma frase satisfazer o critério.
  async comandoAte(nome, criterio, limite = 30) {
    for (let i = 0; i < limite; i++) {
      const novas = await this.comando(nome);
      const achada = novas.find((f) => (criterio instanceof RegExp ? criterio.test(f) : f.includes(criterio)));
      if (achada) return achada;
    }
    throw new Error(`O leitor não encontrou "${criterio}" com o comando ${nome} em ${limite} tentativas.`);
  }

  falasOriginais() {
    return [...this.historico];
  }

  limparHistorico() {
    this.historico = [];
  }
}

module.exports = { LeitorNvda, traduzirFala };
