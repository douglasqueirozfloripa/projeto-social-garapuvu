/**
 * DEMO APRESENTADA — passeio completo pela plataforma, em ritmo de aula.
 *
 * Não é um teste "a mais": é a suíte inteira contada em ordem, com o navegador
 * visível e 1,5 s entre cada ação, e uma tarja na tela explicando cada passo.
 * Continua sendo um teste de verdade — cada passo tem expect(). Se a plataforma
 * quebrar, a demo falha.
 *
 * Rodar:  make demo
 */

const path = require('path');
const fs = require('fs');
const { test, expect } = require('@playwright/test');

const VIDEO_FIXTURE = path.join(__dirname, '../fixtures/gravacao-5s.webm');

// Tempo extra de leitura depois de cada narração (além do slowMo da config)
const LEITURA_MS = Number(process.env.DEMO_LEITURA || 900);
// Tempo para a rolagem suave terminar antes de continuar
const ROLAGEM_MS = Number(process.env.DEMO_ROLAGEM || 700);

const ALTURA_TARJA = 76;

let passo = 0;

/**
 * Injeta (uma vez por carregamento da página) a tarja de narração e o estilo
 * do destaque. Depois de um reload a página é nova, então isso roda de novo.
 */
async function prepararCenario(page) {
  await page.evaluate((alturaTarja) => {
    if (!document.getElementById('demo-estilo')) {
      const estilo = document.createElement('style');
      estilo.id = 'demo-estilo';
      estilo.textContent = `
        html { scroll-behavior: smooth; }
        .demo-foco {
          outline: 3px solid #FBC02D !important;
          outline-offset: 4px;
          border-radius: 8px;
          box-shadow: 0 0 0 6px rgba(251, 192, 45, .25) !important;
        }
      `;
      document.head.appendChild(estilo);
    }

    if (!document.getElementById('demo-tarja')) {
      const tarja = document.createElement('div');
      tarja.id = 'demo-tarja';
      tarja.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'z-index:9999',
        'padding:14px 22px',
        'background:#10331A',
        'color:#fff',
        'font:600 17px/1.4 system-ui, sans-serif',
        'box-shadow:0 3px 14px rgba(0,0,0,.35)',
        'pointer-events:none', // nunca atrapalha os cliques do teste
        'border-bottom:4px solid #FBC02D'
      ].join(';');
      document.body.appendChild(tarja);
      document.body.style.paddingTop = `${alturaTarja}px`;
    }
  }, ALTURA_TARJA);
}

/**
 * Rola até o elemento do passo e o destaca com contorno amarelo.
 *
 * Sem isso a plateia só vê o elemento quando o Playwright já está agindo nele:
 * a rolagem automática dele acontece no instante do clique, sem transição.
 * Aqui a rolagem é suave, centralizada (para não ficar embaixo da tarja) e
 * acontece ANTES da ação, junto com a narração.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string|import('@playwright/test').Locator} alvo - selector ou locator
 */
async function focar(page, alvo) {
  const locator = typeof alvo === 'string' ? page.locator(alvo) : alvo;
  const elemento = locator.first();

  await elemento.waitFor({ state: 'attached' });
  await elemento.evaluate((el) => {
    document.querySelectorAll('.demo-foco').forEach((n) => n.classList.remove('demo-foco'));
    el.classList.add('demo-foco');
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  });

  await page.waitForTimeout(ROLAGEM_MS);
}

/**
 * Narra o passo: tarja na tela, log no terminal e, se um alvo for informado,
 * rolagem suave + destaque no elemento antes de agir nele.
 *
 * @param {string|import('@playwright/test').Locator} [alvo]
 */
async function narrar(page, titulo, detalhe = '', alvo = null) {
  passo += 1;
  console.log(`\n  ${String(passo).padStart(2, '0')} ▸ ${titulo}${detalhe ? ` — ${detalhe}` : ''}`);

  await prepararCenario(page);

  await page.evaluate(
    ({ numero, titulo: t, detalhe: d }) => {
      document.getElementById('demo-tarja').innerHTML =
        `<span style="color:#FBC02D">PASSO ${numero}</span> · ${t}` +
        (d ? `<div style="font-weight:400;font-size:14px;opacity:.85;margin-top:2px">${d}</div>` : '');
    },
    { numero: passo, titulo, detalhe }
  );

  if (alvo) await focar(page, alvo);

  await page.waitForTimeout(LEITURA_MS);
}

/** Volta ao topo da página, para o próximo bloco começar do começo. */
async function subirAoTopo(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.demo-foco').forEach((n) => n.classList.remove('demo-foco'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(ROLAGEM_MS);
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/bugs/resetar');
});

test('demo completa: abrir, documentar, evidenciar, gerar BDD e exportar', async ({ page }) => {
  // ------------------------------------------------------------------
  // 1. A plataforma abre e detecta o ambiente
  // ------------------------------------------------------------------
  await page.goto('/');
  await narrar(
    page,
    'A plataforma abre',
    'Detecta o SO e preenche o ambiente sozinha',
    '[data-testid="badge-so"]'
  );

  await expect(page.getByTestId('form-bug')).toBeVisible();
  await expect(page.getByTestId('badge-so')).not.toHaveText('detectando SO…');
  await expect(page.getByTestId('campo-ambiente')).not.toHaveValue('');
  await expect(page.getByTestId('contador')).toHaveText('0 bugs');

  // ------------------------------------------------------------------
  // 2. Validação: bug ruim não entra
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Validação primeiro',
    'Um bug mal escrito não pode entrar na base',
    '[data-testid="btn-abrir-bug"]'
  );
  await page.getByTestId('campo-titulo').fill('Bug');
  await page.getByTestId('btn-abrir-bug').click();

  await expect(page.getByTestId('toast')).toContainText('título');
  await expect(page.getByTestId('contador')).toHaveText('0 bugs');

  // ------------------------------------------------------------------
  // 3. Título de verdade
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Título',
    'Uma frase que já diz o problema',
    '[data-testid="campo-titulo"]'
  );
  await page.getByTestId('campo-titulo').fill('Accordion de módulos não abre no mobile');

  // ------------------------------------------------------------------
  // 4. Pré-requisitos para simulação
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Pré-requisitos para simulação',
    'Feature flags, permissões e configurações que precisam existir ANTES de reproduzir',
    '[data-testid="campo-prerequisitos"]'
  );
  await page
    .getByTestId('campo-prerequisitos')
    .fill(
      [
        "Feature flag 'accordion-v2' ativa",
        'Usuário com permissão de Aluno (sem admin)',
        'Configuração do sistema: modo responsivo habilitado',
        'Massa de dados: trilha com 4 módulos publicados'
      ].join('\n')
    );

  // ------------------------------------------------------------------
  // 5. Passos, esperado e obtido
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Passos para reproduzir',
    'Numerados, um por linha — qualquer pessoa repete',
    '[data-testid="campo-passos"]'
  );
  await page
    .getByTestId('campo-passos')
    .fill(
      [
        '1. Abrir a landing do curso em um celular (390px)',
        '2. Rolar até a seção "Módulos"',
        '3. Tocar no título do módulo 1'
      ].join('\n')
    );

  await narrar(
    page,
    'Esperado × Obtido',
    'O par que transforma "não funciona" em bug report',
    '[data-testid="campo-esperado"]'
  );
  await page.getByTestId('campo-esperado').fill('O accordion expande e mostra as aulas do módulo');
  await page.getByTestId('campo-obtido').fill('Nada acontece ao tocar; a página fica travada');

  await narrar(
    page,
    'Severidade e prioridade',
    'Impacto técnico × ordem de correção',
    '.linha-dupla'
  );
  await page.getByTestId('campo-severidade').selectOption('alta');
  await page.getByTestId('campo-prioridade').selectOption('alta');

  // ------------------------------------------------------------------
  // 6. Instruções de captura nativa do SO
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Captura nativa do SO',
    'O botão muda conforme o sistema detectado',
    '[data-testid="btn-captura-nativa"]'
  );
  await page.getByTestId('btn-captura-nativa').click();
  await expect(page.getByTestId('modal-captura')).toBeVisible();
  await expect(page.getByTestId('modal-atalho')).not.toHaveText('');

  await narrar(
    page,
    'Atalho na tela',
    'O navegador não pode abrir o app nativo — então ensinamos o atalho',
    '[data-testid="modal-atalho"]'
  );
  await page.getByTestId('btn-fechar-modal').click();
  await expect(page.getByTestId('modal-captura')).not.toBeVisible();

  // ------------------------------------------------------------------
  // 7. Evidência em vídeo
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Anexar evidência',
    'Arrastando um .webm para a área de evidência',
    '[data-testid="area-captura"]'
  );

  const bytes = Array.from(fs.readFileSync(VIDEO_FIXTURE));
  await page.evaluate((conteudo) => {
    const arquivo = new File([new Uint8Array(conteudo)], 'gravacao-accordion.webm', {
      type: 'video/webm'
    });
    const dt = new DataTransfer();
    dt.items.add(arquivo);
    const area = document.querySelector('[data-testid="area-captura"]');
    area.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
    area.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
  }, bytes);

  await expect(page.getByTestId('video-evidencia')).toBeVisible();
  await expect(page.getByTestId('info-evidencia')).toContainText('gravacao-accordion.webm');

  await narrar(
    page,
    'A evidência roda ali mesmo',
    'Player embutido, sem sair da tela do bug',
    '[data-testid="video-evidencia"]'
  );
  const reproducao = await page.evaluate(async () => {
    const video = document.querySelector('[data-testid="video-evidencia"]');
    video.muted = true;
    await video.play();
    await new Promise((r) => setTimeout(r, 2500));
    return { avancou: video.currentTime > 0, duracao: video.duration };
  });
  expect(reproducao.avancou).toBe(true);
  expect(reproducao.duracao).toBeGreaterThan(4);

  // ------------------------------------------------------------------
  // 8. BDD gerado a partir do passo a passo
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Gerar BDD',
    'Pré-requisitos → Dado que · Passos → Quando · Esperado → Então',
    '[data-testid="btn-gerar-bdd"]'
  );
  await page.getByTestId('btn-gerar-bdd').click();

  const bdd = await page.getByTestId('campo-bdd').inputValue();
  expect(bdd).toContain("Dado que Feature flag 'accordion-v2' ativa");
  expect(bdd).toContain('Quando Abrir a landing do curso em um celular (390px)');
  expect(bdd).toContain('Então O accordion expande e mostra as aulas do módulo');
  expect(bdd).toContain('Resultado obtido hoje (bug)');

  await narrar(
    page,
    'Cenário pronto para automação',
    'Gherkin em pt-BR, editável e copiável',
    '[data-testid="campo-bdd"]'
  );
  // textarea: o conteúdo vive no value, não no texto do DOM
  await expect(page.getByTestId('campo-bdd')).toHaveValue(/Cenário:/);

  // ------------------------------------------------------------------
  // 9. Abrir o bug
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Abrir o bug',
    'Título, pré-requisitos, passos, evidência e BDD juntos',
    '[data-testid="btn-abrir-bug"]'
  );
  await page.getByTestId('btn-abrir-bug').click();

  await expect(page.getByTestId('toast')).toContainText('Bug aberto com sucesso');
  await expect(page.getByTestId('bug-item')).toHaveCount(1);
  await expect(page.getByTestId('contador')).toHaveText('1 bug');
  await expect(page.getByTestId('campo-titulo')).toHaveValue(''); // formulário limpo

  // A lista fica na outra coluna: subir ao topo antes de rolar até ela
  await subirAoTopo(page);
  await narrar(
    page,
    'O bug na lista',
    'Com o vídeo tocando e o BDD dentro do cartão',
    '[data-testid="bug-item"]'
  );
  await expect(page.getByTestId('evidencia-video')).toBeVisible();

  await narrar(
    page,
    'O BDD viaja com o bug',
    'Quem for corrigir já recebe o cenário pronto',
    '[data-testid="bdd-bug"]'
  );
  await page.getByTestId('bdd-bug').click(); // abre o <details> do cenário
  await expect(page.getByTestId('bdd-bug')).toContainText('Funcionalidade:');

  // ------------------------------------------------------------------
  // 10. Ciclo de vida do bug
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Ciclo de vida',
    'Aberto → Em análise → Corrigido',
    '[data-testid="status-bug"]'
  );
  await page.getByTestId('status-bug').selectOption('em_analise');
  await expect(page.getByTestId('toast')).toContainText('Em análise');

  await page.getByTestId('status-bug').selectOption('corrigido');
  await expect(page.getByTestId('toast')).toContainText('Corrigido');

  // ------------------------------------------------------------------
  // 11. Filtros
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Filtros',
    'Filtrar por "Aberto" esconde o bug já corrigido',
    '[data-testid="filtro-status"]'
  );
  await page.getByTestId('filtro-status').selectOption('aberto');
  await expect(page.getByTestId('contador')).toHaveText('0 bugs');
  await expect(page.getByTestId('lista-bugs')).toContainText('Nenhum bug encontrado');

  await narrar(
    page,
    'Filtro certo',
    'Em "Corrigido" ele reaparece',
    '[data-testid="filtro-status"]'
  );
  await page.getByTestId('filtro-status').selectOption('corrigido');
  await expect(page.getByTestId('bug-item')).toHaveCount(1);

  // ------------------------------------------------------------------
  // 12. Persistência
  // ------------------------------------------------------------------
  await narrar(
    page,
    'localStorage',
    'Recarregando a página: bug, vídeo e filtro sobrevivem',
    '[data-testid="bug-item"]'
  );
  await page.reload();
  await expect(page.getByTestId('bug-item')).toHaveCount(1);
  await expect(page.getByTestId('evidencia-video')).toBeVisible();
  await expect(page.getByTestId('filtro-status')).toHaveValue('corrigido');

  // ------------------------------------------------------------------
  // 13. Exportação CSV
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Exportar CSV',
    'A lista vira planilha, respeitando os filtros da tela',
    '[data-testid="btn-exportar-csv"]'
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('btn-exportar-csv').click()
  ]);

  expect(download.suggestedFilename()).toMatch(/^bugs-garapuvu-.*\.csv$/);

  const conteudo = fs.readFileSync(await download.path(), 'utf8');
  const [cabecalho, ...resto] = conteudo.replace(/^﻿/, '').trimEnd().split('\r\n');
  const linha = resto.join('\r\n');

  console.log(`\n     CSV: ${download.suggestedFilename()}`);
  console.log(`     ${cabecalho}`);

  expect(cabecalho).toContain('Pre-requisitos');
  expect(cabecalho).toContain('Cenario BDD');
  expect(linha).toContain('Accordion de módulos não abre no mobile');
  expect(linha).toContain("Feature flag 'accordion-v2' ativa");
  expect(linha).toContain('Funcionalidade: Accordion');
  expect(linha).toContain('video: gravacao-accordion.webm');
  expect(linha).not.toContain('base64'); // o dataURL não vai para a planilha

  await narrar(
    page,
    'Planilha conferida',
    'Colunas preenchidas, sem base64 sujando o arquivo',
    '[data-testid="contador"]'
  );

  // ------------------------------------------------------------------
  // 14. Exclusão
  // ------------------------------------------------------------------
  await narrar(
    page,
    'Excluir',
    'Fechando o ciclo: o bug sai da base',
    '[data-testid="btn-excluir"]'
  );
  await page.getByTestId('btn-excluir').click();
  await expect(page.getByTestId('toast')).toContainText('excluído');

  await page.getByTestId('filtro-status').selectOption('todos');
  await expect(page.getByTestId('contador')).toHaveText('0 bugs');

  await subirAoTopo(page);
  await narrar(page, 'Fim da demo 🌳🐛', 'Projeto Social Garapuvu · Curso de QA 2026');
  console.log('\n  ✅ Demo concluída — todos os passos validados com expect().\n');
});
