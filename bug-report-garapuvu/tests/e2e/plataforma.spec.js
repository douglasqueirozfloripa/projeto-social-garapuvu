/**
 * Testes de INTERFACE (E2E) — Playwright
 *
 * Percorrem a plataforma como um usuário de verdade: navegador real,
 * formulário real, API real rodando por trás.
 */

const path = require('path');
const { test, expect } = require('@playwright/test');

// Vídeo de verdade (5s, 480x270). Regerar com: npm run fixtures:video
const VIDEO_FIXTURE = path.join(__dirname, '../fixtures/gravacao-5s.webm');

/**
 * Tenta reproduzir um <video> da página e conta o que aconteceu.
 * Serve para provar que a evidência não é só um player parado em 0:00.
 */
async function reproduzir(page, seletor) {
  return page.evaluate(async (sel) => {
    const video = document.querySelector(sel);

    if (!Number.isFinite(video.duration) || video.readyState === 0) {
      await new Promise((resolve, rejeitar) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => rejeitar(new Error('o navegador não conseguiu carregar o vídeo'));
      });
    }

    video.muted = true;
    const inicio = video.currentTime;
    await video.play();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      duracao: video.duration,
      avancou: video.currentTime > inicio,
      pausado: video.paused,
      largura: video.videoWidth
    };
  }, seletor);
}

const UA_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const UA_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function preencherBug(page, { titulo = 'Accordion de módulos não abre no mobile' } = {}) {
  await page.getByTestId('campo-titulo').fill(titulo);
  await page.getByTestId('campo-passos').fill('1. Abrir a landing no celular. 2. Tocar no módulo 1.');
  await page.getByTestId('campo-esperado').fill('Accordion expande e mostra o conteúdo');
  await page.getByTestId('campo-obtido').fill('Nada acontece ao tocar');
  await page.getByTestId('campo-severidade').selectOption('alta');
  await page.getByTestId('campo-prioridade').selectOption('alta');
}

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/bugs/resetar'); // API sempre limpa antes de cada teste
  await page.goto('/');
});

test.describe('Abertura e documentação de bugs', () => {
  test('a página carrega com o formulário e a lista vazia', async ({ page }) => {
    await expect(page).toHaveTitle(/Bug Report Garapuvu/);
    await expect(page.getByTestId('form-bug')).toBeVisible();
    await expect(page.getByTestId('contador')).toHaveText('0 bugs');
    await expect(page.getByTestId('lista-bugs')).toContainText('Nenhum bug registrado ainda');
  });

  test('abre um bug pelo formulário e ele aparece na lista', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('btn-abrir-bug').click();

    await expect(page.getByTestId('toast')).toContainText('Bug aberto com sucesso');
    await expect(page.getByTestId('bug-item')).toHaveCount(1);
    await expect(page.getByTestId('bug-item')).toContainText('Accordion de módulos não abre no mobile');
    await expect(page.getByTestId('contador')).toHaveText('1 bug');

    // O formulário limpa depois do envio
    await expect(page.getByTestId('campo-titulo')).toHaveValue('');
  });

  test('bloqueia a abertura de bug com dados incompletos', async ({ page }) => {
    await page.getByTestId('campo-titulo').fill('Bug'); // curto demais
    await page.getByTestId('btn-abrir-bug').click();

    await expect(page.getByTestId('toast')).toContainText('título');
    await expect(page.getByTestId('contador')).toHaveText('0 bugs');
  });

  test('muda o status do bug para "Corrigido"', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('btn-abrir-bug').click();
    await expect(page.getByTestId('bug-item')).toHaveCount(1);

    await page.getByTestId('status-bug').selectOption('corrigido');
    await expect(page.getByTestId('toast')).toContainText('Corrigido');

    // Filtra por corrigidos e o bug continua lá
    await page.getByTestId('filtro-status').selectOption('corrigido');
    await expect(page.getByTestId('bug-item')).toHaveCount(1);

    // Filtra por abertos e a lista fica vazia
    await page.getByTestId('filtro-status').selectOption('aberto');
    await expect(page.getByTestId('bug-item')).toHaveCount(0);
  });

  test('exclui um bug da lista', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('btn-abrir-bug').click();
    await expect(page.getByTestId('bug-item')).toHaveCount(1);

    await page.getByTestId('btn-excluir').click();
    await expect(page.getByTestId('bug-item')).toHaveCount(0);
    await expect(page.getByTestId('contador')).toHaveText('0 bugs');
  });

  test('o rascunho sobrevive a um recarregamento da página (localStorage)', async ({ page }) => {
    await page.getByTestId('campo-titulo').fill('Rascunho de bug ainda não enviado');
    await page.getByTestId('campo-passos').fill('Só comecei a escrever os passos…');

    await page.reload();

    await expect(page.getByTestId('campo-titulo')).toHaveValue('Rascunho de bug ainda não enviado');
    await expect(page.getByTestId('campo-passos')).toHaveValue('Só comecei a escrever os passos…');
    await expect(page.getByTestId('toast')).toContainText('Rascunho recuperado');
  });
});

test.describe('Pré-requisitos e geração de BDD', () => {
  test('o campo de pré-requisitos aparece antes dos passos', async ({ page }) => {
    const ordem = await page.evaluate(() => {
      const pre = document.querySelector('[data-testid="campo-prerequisitos"]');
      const passos = document.querySelector('[data-testid="campo-passos"]');
      // compareDocumentPosition: 4 = pré-requisitos vem antes dos passos
      return pre.compareDocumentPosition(passos) & Node.DOCUMENT_POSITION_FOLLOWING;
    });

    expect(ordem).toBeTruthy();
    await expect(page.getByTestId('campo-prerequisitos')).toBeVisible();
  });

  test('gera o cenário BDD a partir do passo a passo', async ({ page }) => {
    await preencherBug(page);
    await page
      .getByTestId('campo-prerequisitos')
      .fill("Feature flag 'accordion-v2' ativa\nUsuário sem permissão de admin");
    await page.getByTestId('campo-passos').fill('1. Abrir a landing no celular\n2. Tocar no módulo 1');

    await page.getByTestId('btn-gerar-bdd').click();

    const bdd = await page.getByTestId('campo-bdd').inputValue();
    expect(bdd).toContain("Dado que Feature flag 'accordion-v2' ativa");
    expect(bdd).toContain('E Usuário sem permissão de admin');
    expect(bdd).toContain('Quando Abrir a landing no celular');
    expect(bdd).toContain('E Tocar no módulo 1');
    expect(bdd).toContain('Então Accordion expande e mostra o conteúdo');
    expect(bdd).toContain('Resultado obtido hoje (bug): Nada acontece ao tocar');
  });

  test('avisa quando tenta gerar BDD sem os passos', async ({ page }) => {
    await page.getByTestId('campo-titulo').fill('Bug sem passos ainda');
    await page.getByTestId('btn-gerar-bdd').click();

    await expect(page.getByTestId('toast')).toContainText('Preencha os passos');
    await expect(page.getByTestId('campo-bdd')).toHaveValue('');
  });

  test('o bug salvo guarda pré-requisitos e o cenário BDD', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('campo-prerequisitos').fill('Cache do navegador limpo');
    await page.getByTestId('btn-gerar-bdd').click();
    await page.getByTestId('btn-abrir-bug').click();

    await expect(page.getByTestId('bug-item')).toContainText('Cache do navegador limpo');
    await expect(page.getByTestId('bdd-bug')).toContainText('Cenário:');
  });
});

test.describe('Exportação CSV', () => {
  test('avisa quando não há bugs para exportar', async ({ page }) => {
    await page.getByTestId('btn-exportar-csv').click();
    await expect(page.getByTestId('toast')).toContainText('Nenhum bug para exportar');
  });

  test('cria um bug e exporta o CSV com todas as colunas preenchidas', async ({ page }) => {
    // 1) cria o bug pela interface, com pré-requisitos, evidência e BDD gerado
    await preencherBug(page);
    await page.getByTestId('campo-prerequisitos').fill("Feature flag 'accordion-v2' ativa");
    await page.getByTestId('arquivo-evidencia').setInputFiles({
      name: 'gravacao-bug.webm',
      mimeType: 'video/webm',
      buffer: Buffer.from('conteudo-fake-de-video')
    });
    await page.getByTestId('btn-gerar-bdd').click();
    await page.getByTestId('btn-abrir-bug').click();
    await expect(page.getByTestId('bug-item')).toHaveCount(1);

    // 2) exporta
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('btn-exportar-csv').click()
    ]);

    expect(download.suggestedFilename()).toMatch(/^bugs-garapuvu-.*\.csv$/);

    // 3) confere o arquivo baixado
    const conteudo = require('fs').readFileSync(await download.path(), 'utf8');
    const [cabecalho, ...resto] = conteudo.replace(/^﻿/, '').trimEnd().split('\r\n');

    expect(cabecalho).toBe(
      'ID;Titulo;Status;Severidade;Prioridade;Pre-requisitos;Passos para reproduzir;' +
        'Resultado esperado;Resultado obtido;Ambiente;Cenario BDD;Criado em;Evidencia'
    );

    // Uma linha de dados (os passos têm quebra dentro de aspas, então junta tudo)
    const linhaDados = resto.join('\r\n');
    expect(linhaDados.startsWith('1;Accordion de módulos não abre no mobile;aberto;alta;alta;')).toBe(
      true
    );
    expect(linhaDados).toContain("Feature flag 'accordion-v2' ativa");
    expect(linhaDados).toContain('Accordion expande e mostra o conteúdo'); // esperado
    expect(linhaDados).toContain('Nada acontece ao tocar'); // obtido
    expect(linhaDados).toContain('macOS'); // ambiente automático
    expect(linhaDados).toContain('Funcionalidade: Accordion'); // cenário BDD
    expect(linhaDados).toContain('video: gravacao-bug.webm'); // evidência resumida
    expect(linhaDados).not.toContain('base64'); // sem despejar o dataURL na planilha
    expect(linhaDados).toMatch(/\d{4}-\d{2}-\d{2}T/); // criadoEm em ISO
  });

  test('exporta CSV sem evidência quando o bug não tem anexo', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('btn-abrir-bug').click();
    await expect(page.getByTestId('bug-item')).toHaveCount(1);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('btn-exportar-csv').click()
    ]);

    const conteudo = require('fs').readFileSync(await download.path(), 'utf8');
    expect(conteudo).toContain('sem evidencia');
  });

  test('o CSV respeita o filtro de status da tela', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('btn-abrir-bug').click();
    await expect(page.getByTestId('bug-item')).toHaveCount(1);

    // O bug nasce "aberto": filtrar por "corrigido" não deve sobrar nada
    await page.getByTestId('filtro-status').selectOption('corrigido');
    await page.getByTestId('btn-exportar-csv').click();

    await expect(page.getByTestId('toast')).toContainText('Nenhum bug para exportar');
  });
});

test.describe('Anexar evidência por arquivo', () => {
  test('anexa um vídeo .webm e o player consegue dar play', async ({ page }) => {
    await page.getByTestId('arquivo-evidencia').setInputFiles(VIDEO_FIXTURE);

    await expect(page.getByTestId('toast')).toContainText('anexado ao bug');
    await expect(page.getByTestId('preview-evidencia')).toBeVisible();
    await expect(page.getByTestId('video-evidencia')).toBeVisible();
    await expect(page.getByTestId('info-evidencia')).toContainText('gravacao-5s.webm');

    // O que o print do bug mostrava: player em 0:00 e sem dar play
    const reproducao = await reproduzir(page, '[data-testid="video-evidencia"]');
    expect(reproducao.duracao).toBeGreaterThan(4);
    expect(reproducao.avancou).toBe(true);
    expect(reproducao.pausado).toBe(false);
  });

  test('reconhece .webm mesmo sem mimeType (caso do arquivo arrastado)', async ({ page }) => {
    await page.getByTestId('arquivo-evidencia').setInputFiles({
      name: 'sem-mime.webm',
      mimeType: '',
      buffer: require('fs').readFileSync(VIDEO_FIXTURE)
    });

    await expect(page.getByTestId('video-evidencia')).toBeVisible();
    expect((await reproduzir(page, '[data-testid="video-evidencia"]')).avancou).toBe(true);
  });

  test('aceita o vídeo soltado na área de evidência (arrastar e soltar)', async ({ page }) => {
    // Simula o drop: monta um DataTransfer de verdade, com o vídeo real dentro
    const bytes = Array.from(require('fs').readFileSync(VIDEO_FIXTURE));

    await page.evaluate((conteudo) => {
      const arquivo = new File([new Uint8Array(conteudo)], 'arrastado.webm', {
        type: 'video/webm'
      });
      const transferencia = new DataTransfer();
      transferencia.items.add(arquivo);

      const area = document.querySelector('[data-testid="area-captura"]');
      area.dispatchEvent(new DragEvent('dragover', { dataTransfer: transferencia, bubbles: true }));
      area.dispatchEvent(new DragEvent('drop', { dataTransfer: transferencia, bubbles: true }));
    }, bytes);

    await expect(page.getByTestId('toast')).toContainText('arrastado.webm');
    await expect(page.getByTestId('video-evidencia')).toBeVisible();
    expect((await reproduzir(page, '[data-testid="video-evidencia"]')).avancou).toBe(true);
    // O realce do arrastar sai depois do drop
    await expect(page.getByTestId('area-captura')).not.toHaveClass(/arrastando/);
  });

  test('destaca a área enquanto o arquivo é arrastado por cima', async ({ page }) => {
    await page.evaluate(() => {
      const area = document.querySelector('[data-testid="area-captura"]');
      area.dispatchEvent(
        new DragEvent('dragover', { dataTransfer: new DataTransfer(), bubbles: true })
      );
    });

    await expect(page.getByTestId('area-captura')).toHaveClass(/arrastando/);
  });

  test('recusa arquivo que não é imagem nem vídeo', async ({ page }) => {
    await page.getByTestId('arquivo-evidencia').setInputFiles({
      name: 'relatorio.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4')
    });

    await expect(page.getByTestId('toast')).toContainText('não é imagem nem vídeo');
    await expect(page.getByTestId('preview-evidencia')).not.toBeVisible();
  });

  test('o vídeo anexado vira player que roda no cartão do bug', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('arquivo-evidencia').setInputFiles(VIDEO_FIXTURE);
    await page.getByTestId('btn-abrir-bug').click();

    await expect(page.getByTestId('evidencia-video')).toBeVisible();
    await expect(page.getByTestId('bug-item')).toContainText('gravacao-5s.webm');

    const reproducao = await reproduzir(page, '[data-testid="evidencia-video"]');
    expect(reproducao.duracao).toBeGreaterThan(4);
    expect(reproducao.avancou).toBe(true);
  });

  test('o vídeo toca do início ao fim e para sozinho no final (~5s)', async ({ page }) => {
    await page.getByTestId('arquivo-evidencia').setInputFiles(VIDEO_FIXTURE);
    await expect(page.getByTestId('video-evidencia')).toBeVisible();

    const fim = await page.evaluate(async () => {
      const video = document.querySelector('[data-testid="video-evidencia"]');
      video.muted = true;

      const acabou = new Promise((resolve) => {
        video.onended = () => resolve(true);
      });

      const comecou = performance.now();
      await video.play();

      // Espera o evento 'ended' (com folga sobre os 5s do vídeo)
      const terminou = await Promise.race([
        acabou,
        new Promise((resolve) => setTimeout(() => resolve(false), 12_000))
      ]);

      return {
        terminou,
        segundos: (performance.now() - comecou) / 1000,
        pausado: video.paused,
        ended: video.ended,
        posicaoFinal: video.currentTime,
        duracao: video.duration
      };
    });

    expect(fim.terminou).toBe(true);
    expect(fim.ended).toBe(true);
    expect(fim.pausado).toBe(true); // o player para sozinho ao terminar
    expect(fim.duracao).toBeGreaterThan(4);
    expect(fim.duracao).toBeLessThan(6);
    expect(fim.posicaoFinal).toBeCloseTo(fim.duracao, 1); // rodou até o fim
    expect(fim.segundos).toBeGreaterThan(4); // levou ~5s de verdade
  });

  test('o vídeo sobrevive ao recarregamento da página (localStorage)', async ({ page }) => {
    await preencherBug(page);
    await page.getByTestId('arquivo-evidencia').setInputFiles(VIDEO_FIXTURE);
    await page.getByTestId('btn-abrir-bug').click();
    await expect(page.getByTestId('evidencia-video')).toBeVisible();

    await page.reload();

    await expect(page.getByTestId('evidencia-video')).toBeVisible();
    expect((await reproduzir(page, '[data-testid="evidencia-video"]')).avancou).toBe(true);
  });

  test('remover evidência esconde o preview', async ({ page }) => {
    await page.getByTestId('arquivo-evidencia').setInputFiles({
      name: 'print.png',
      mimeType: 'image/png',
      buffer: Buffer.from('conteudo-fake-de-imagem')
    });
    await expect(page.getByTestId('preview-evidencia')).toBeVisible();

    await page.getByRole('button', { name: 'Remover evidência' }).click();
    await expect(page.getByTestId('preview-evidencia')).not.toBeVisible();
  });
});

test.describe('Visual', () => {
  test('usa o favicon oficial do Garapuvu (a flor)', async ({ page, request }) => {
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.svg');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0E1F38');

    // O arquivo tem que existir de verdade — antes o navegador tomava 404 no favicon
    const resposta = await request.get('/favicon.svg');
    expect(resposta.status()).toBe(200);
    expect(resposta.headers()['content-type']).toContain('image/svg+xml');

    const svg = await resposta.text();
    expect(svg).toContain('#0E1F38'); // azul-marinho da marca
    expect(svg).toContain('#F2B705'); // dourado das pétalas
  });

  test('o toast fica fora da tela enquanto não há mensagem', async ({ page }) => {
    // Regressão: o toast escondido aparecia como uma faixa verde presa na rolagem
    const toast = page.getByTestId('toast');
    await expect(toast).not.toBeVisible();
    await expect(toast).toHaveCSS('visibility', 'hidden');
    await expect(toast).toHaveCSS('opacity', '0');
  });
});

test.describe('Botão de captura no macOS', () => {
  test.use({ userAgent: UA_MAC });

  test('mostra o botão do app nativo do macOS com o atalho ⌘⇧5', async ({ page }) => {
    await expect(page.getByTestId('badge-so')).toContainText('macOS');
    await expect(page.getByTestId('btn-captura-nativa')).toContainText('macOS');
    await expect(page.getByTestId('btn-captura-nativa')).toContainText('⌘⇧5');

    await page.getByTestId('btn-captura-nativa').click();
    await expect(page.getByTestId('modal-captura')).toBeVisible();
    await expect(page.getByTestId('modal-atalho')).toHaveText('⌘ + Shift + 5');

    await page.getByTestId('btn-fechar-modal').click();
    await expect(page.getByTestId('modal-captura')).not.toBeVisible();
  });

  test('o campo ambiente é pré-preenchido com macOS', async ({ page }) => {
    await expect(page.getByTestId('campo-ambiente')).toHaveValue(/macOS/);
  });
});

test.describe('Botão de captura no Windows', () => {
  test.use({ userAgent: UA_WINDOWS });

  test('mostra o botão da Ferramenta de Captura com Win+Shift+S', async ({ page }) => {
    await expect(page.getByTestId('badge-so')).toContainText('Windows');
    await expect(page.getByTestId('btn-captura-nativa')).toContainText('Windows');
    await expect(page.getByTestId('btn-captura-nativa')).toContainText('Win+Shift+S');

    await page.getByTestId('btn-captura-nativa').click();
    await expect(page.getByTestId('modal-captura')).toBeVisible();
    await expect(page.getByTestId('modal-atalho')).toHaveText('Win + Shift + S');
    await expect(page.getByTestId('modal-captura')).toContainText('Game Bar');
  });

  test('o campo ambiente é pré-preenchido com Windows', async ({ page }) => {
    await expect(page.getByTestId('campo-ambiente')).toHaveValue(/Windows/);
  });
});
