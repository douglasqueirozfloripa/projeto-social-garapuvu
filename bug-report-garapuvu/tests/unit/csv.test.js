/**
 * Testes unitários da exportação CSV (frontend/js/csv.js).
 */

const { gerarCsv, escaparCampo, nomeArquivoCsv, COLUNAS } = require('../../frontend/js/csv.js');

const bug = {
  id: 1,
  titulo: 'Botão não responde',
  status: 'aberto',
  severidade: 'alta',
  prioridade: 'media',
  prerequisitos: 'Feature flag ativa',
  passos: '1. Acesse a home\n2. Clique em Entrar',
  esperado: 'Abre o painel',
  obtido: 'Tela em branco',
  ambiente: 'macOS · Safari 17',
  bdd: '# language: pt',
  criadoEm: '2026-08-12T19:00:00.000Z'
};

/** Devolve as linhas do CSV, sem o BOM e sem a linha final vazia. */
function linhas(csv) {
  return csv.replace(/^﻿/, '').trimEnd().split('\r\n');
}

describe('escaparCampo', () => {
  it('deixa passar valores simples', () => {
    expect(escaparCampo('aberto')).toBe('aberto');
    expect(escaparCampo(42)).toBe('42');
  });

  it('envolve em aspas quando há separador, aspas ou quebra de linha', () => {
    expect(escaparCampo('a;b')).toBe('"a;b"');
    expect(escaparCampo('linha1\nlinha2')).toBe('"linha1\nlinha2"');
    expect(escaparCampo('com "aspas"')).toBe('"com ""aspas"""');
  });

  it('duplica as aspas internas conforme o RFC 4180', () => {
    expect(escaparCampo('Clique em "Entrar"')).toBe('"Clique em ""Entrar"""');
  });

  it('transforma nulo e indefinido em célula vazia', () => {
    expect(escaparCampo(null)).toBe('');
    expect(escaparCampo(undefined)).toBe('');
  });
});

describe('gerarCsv', () => {
  it('começa com BOM UTF-8 para o Excel não quebrar os acentos', () => {
    expect(gerarCsv([bug]).charCodeAt(0)).toBe(0xfeff);
  });

  it('gera o cabeçalho na ordem das colunas', () => {
    const [cabecalho] = linhas(gerarCsv([]));
    expect(cabecalho).toBe(COLUNAS.map((c) => c.rotulo).join(';'));
  });

  it('exporta o cabeçalho mesmo sem bugs', () => {
    expect(linhas(gerarCsv([]))).toHaveLength(1);
  });

  it('gera uma linha por bug', () => {
    expect(linhas(gerarCsv([bug, { ...bug, id: 2 }]))).toHaveLength(3);
  });

  it('escapa passos com quebra de linha sem criar linhas extras no CSV', () => {
    const csv = gerarCsv([bug]);
    expect(csv).toContain('"1. Acesse a home\n2. Clique em Entrar"');
    // A quebra dentro das aspas usa \n, então não conta como fim de linha (\r\n)
    expect(linhas(csv)).toHaveLength(2);
  });

  it('resume a evidência em vez de despejar o dataURL', () => {
    const comVideo = gerarCsv([
      { ...bug, evidencia: 'data:video/webm;base64,AAAA', evidenciaTipo: 'video', evidenciaNome: 'bug.webm' }
    ]);
    expect(comVideo).toContain('video: bug.webm');
    expect(comVideo).not.toContain('base64');
  });

  it('marca "sem evidencia" quando o bug não tem anexo', () => {
    expect(gerarCsv([bug])).toContain('sem evidencia');
  });

  it('aceita entrada inválida sem quebrar', () => {
    expect(linhas(gerarCsv(null))).toHaveLength(1);
    expect(linhas(gerarCsv(undefined))).toHaveLength(1);
    expect(linhas(gerarCsv([null]))).toHaveLength(2);
  });

  it('termina o arquivo com quebra de linha', () => {
    expect(gerarCsv([bug]).endsWith('\r\n')).toBe(true);
  });
});

describe('nomeArquivoCsv', () => {
  it('usa a data informada, com dois dígitos', () => {
    const nome = nomeArquivoCsv(new Date(2026, 7, 12, 9, 5, 3));
    expect(nome).toBe('bugs-garapuvu-2026-08-12_09-05-03.csv');
  });

  it('cai para a data atual quando o argumento é inválido', () => {
    expect(nomeArquivoCsv(new Date('data ruim'))).toMatch(
      /^bugs-garapuvu-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/
    );
    expect(nomeArquivoCsv()).toMatch(/\.csv$/);
  });
});
