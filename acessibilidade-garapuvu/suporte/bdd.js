/**
 * BDD em português sobre o Playwright Test.
 *
 *   funcionalidade('Navegação com NVDA', () => {
 *     cenario('Pular do topo para as aulas', [
 *       Dado('que abro a página com o NVDA ligado', async ({ page, leitor }) => { ... }),
 *       Quando('ativo o link "Assistir as aulas"', async ({ leitor }) => { ... }),
 *       Entao('o NVDA anuncia o título da seção', async ({ leitor }) => { ... }),
 *     ]);
 *   });
 *
 * Cada passo vira um test.step (aparece no relatório HTML) e atualiza a
 * legenda do vídeo: o passo em execução fica em destaque, os concluídos
 * ganham ✓ e o que falhar fica em vermelho com a mensagem de erro.
 *
 * Os passos recebem um único objeto de contexto: as fixtures (page, leitor,
 * legenda, narrador...) e `mundo`, um objeto vazio para passar dados de um
 * passo para o outro.
 *
 * PASSO_MS (padrão 600) é a pausa entre passos, para o vídeo ficar legível.
 * Em CI, use PASSO_MS=0.
 */
const { test: base, expect } = require('@playwright/test');
const { Legenda } = require('./legenda');
const { LeitorNvda } = require('./leitor-nvda');
const { Narrador } = require('./narrador');
const fs = require('node:fs');
const path = require('node:path');
const { juntarAudioNoVideo, converterParaMp4 } = require('./video');

// Pasta com os vídeos organizados: videos/<arquivo de teste>/<cenário>.mp4
const PASTA_VIDEOS = path.join(__dirname, '..', 'videos');

function caminhoDoVideo(testInfo) {
  // titlePath[0] é o arquivo de teste (o testInfo.file seria este bdd.js, onde o test() é declarado).
  const pasta = path.join(PASTA_VIDEOS, path.basename(testInfo.titlePath[0], '.spec.js'));
  const cenario = testInfo.title
    .replace(/^Cenário: /, '')
    .replace(/"/g, "'")
    .replace(/[\\/:*?<>|]/g, '-')
    .slice(0, 150);
  const prefixo = testInfo.status === 'passed' ? '' : '[FALHOU] ';
  fs.mkdirSync(pasta, { recursive: true });
  return path.join(pasta, `${prefixo}${cenario}.mp4`);
}

const PASSO_MS = Number(process.env.PASSO_MS ?? 600);

const test = base.extend({
  narrador: async ({}, use, testInfo) => {
    await use(new Narrador(testInfo));
  },

  legenda: async ({ page, narrador }, use) => {
    const legenda = new Legenda(page, narrador);
    await legenda.instalar();
    await use(legenda);
  },

  leitor: async ({ page, legenda, narrador }, use) => {
    const leitor = new LeitorNvda(page, legenda, narrador);
    await use(leitor);
    await leitor.parar();
  },

  // Automática: prepara a página para teste e, no fim, junta o áudio ao vídeo.
  _gravacao: [
    async ({ page, narrador }, use, testInfo) => {
      narrador.zerarRelogio();

      // O site conta visitantes no Firestore de PRODUÇÃO na primeira visita de
      // cada navegador — e cada teste é um navegador novo. A marca abaixo faz o
      // site achar que já contou esta visita: o número continua aparecendo,
      // mas os testes não inflam o contador real.
      await page.addInitScript(() => {
        try { localStorage.setItem('gp_visited', '1'); } catch { /* ignora */ }
      });
      // E nada de eventos de teste no Google Analytics.
      await page.route(/google-analytics\.com|googletagmanager\.com/, (r) => r.abort());

      await use();

      const video = page.video();
      await page.close();
      if (!video) return;
      const webm = await video.path();
      const destino = caminhoDoVideo(testInfo);

      if (narrador.falas.length) {
        // Cenários de leitor de tela: vídeo legendado + voz do NVDA simulado.
        const mp4 = await juntarAudioNoVideo(webm, narrador.falas, destino);
        if (mp4) {
          await testInfo.attach('vídeo com a voz do NVDA simulado', { path: mp4, contentType: 'video/mp4' });
          return;
        }
      }
      // Demais cenários (ou sem áudio): só o vídeo legendado, em .mp4.
      await converterParaMp4(webm, destino);
    },
    { auto: true },
  ],
});

const passo = (palavra) => (texto, fn) => ({ palavra, texto, fn });
const Dado = passo('Dado');
const Quando = passo('Quando');
const Entao = passo('Então');
const E = passo('E');
const Mas = passo('Mas');

function funcionalidade(nome, corpo) {
  test.describe(`Funcionalidade: ${nome}`, corpo);
}

function cenario(nome, passos, detalhes = {}) {
  test(`Cenário: ${nome}`, detalhes, async ({ page, context, legenda, leitor, narrador, baseURL }, testInfo) => {
    const nomeFuncionalidade = testInfo.titlePath
      .find((t) => t.startsWith('Funcionalidade: '))
      ?.replace('Funcionalidade: ', '') ?? '';

    const contexto = { page, context, legenda, leitor, narrador, baseURL, testInfo, mundo: {} };

    // A legenda só aparece depois da primeira navegação — até lá a página está em branco.
    await legenda.iniciar(nomeFuncionalidade, nome, passos);
    await narrador.narrar(`Cenário: ${nome}`);

    let sucesso = false;
    try {
      for (const [i, p] of passos.entries()) {
        await test.step(`${p.palavra} ${p.texto}`, async () => {
          await legenda.passo(i, 'executando');
          await narrador.narrar(`${p.palavra} ${p.texto}`);
          try {
            await p.fn(contexto);
          } catch (erro) {
            const mensagem = String(erro.message || erro).split('\n').slice(0, 4).join('\n');
            await legenda.passo(i, 'falhou', mensagem);
            throw erro;
          }
          await legenda.passo(i, 'ok');
          if (PASSO_MS) await page.waitForTimeout(PASSO_MS);
        });
      }
      sucesso = true;
    } finally {
      await legenda.concluir(sucesso);
      await narrador.narrar(sucesso ? 'Cenário aprovado.' : 'Cenário reprovado.');
      // Segura o quadro final para o resultado aparecer no vídeo.
      await page.waitForTimeout(sucesso ? 800 : 2500).catch(() => {});
    }
  });
}

// Abre a página inicial e espera o conteúdo principal.
async function abrirPagina(page, { tema } = {}) {
  if (tema) {
    // Só na primeira carga: depois de um reload vale o que a pessoa escolheu.
    await page.addInitScript((t) => {
      try {
        if (!sessionStorage.getItem('qa_tema_inicial')) {
          localStorage.setItem('gp_theme', t);
          sessionStorage.setItem('qa_tema_inicial', '1');
        }
      } catch { /* ignora */ }
    }, tema);
  }
  await page.goto('/');
  // Só o h1: a existência do <main> é verificada nos próprios cenários, para a
  // versão antiga do site falhar no passo certo, e não já na abertura.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

module.exports = { test, expect, funcionalidade, cenario, Dado, Quando, Entao, E, Mas, abrirPagina };
