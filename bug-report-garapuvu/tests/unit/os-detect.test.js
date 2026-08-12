/**
 * Testes UNITÁRIOS — os-detect.js
 * Garantem que o botão certo aparece para cada sistema operacional.
 */

const { detectarSO, infoCaptura, nomeArquivoEvidencia } = require('../../frontend/js/os-detect.js');

const UA_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const UA_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const UA_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

describe('detectarSO', () => {
  test('identifica macOS pelo user agent', () => {
    expect(detectarSO(UA_MAC)).toBe('mac');
  });

  test('identifica Windows pelo user agent', () => {
    expect(detectarSO(UA_WINDOWS)).toBe('windows');
  });

  test('qualquer outro SO cai em "outro"', () => {
    expect(detectarSO(UA_LINUX)).toBe('outro');
  });

  test('não quebra com entrada vazia ou nula', () => {
    expect(detectarSO('')).toBe('outro');
    expect(detectarSO(null)).toBe('outro');
    expect(detectarSO(undefined)).toBe('outro');
  });

  test('é indiferente a maiúsculas/minúsculas', () => {
    expect(detectarSO('WINDOWS NT')).toBe('windows');
    expect(detectarSO('MACINTOSH')).toBe('mac');
  });
});

describe('infoCaptura', () => {
  test('macOS: atalho ⌘⇧5 e app de Captura de Tela', () => {
    const info = infoCaptura('mac');
    expect(info.atalho).toBe('⌘ + Shift + 5');
    expect(info.nomeApp).toMatch(/macOS/);
    expect(info.rotuloBotao).toContain('⌘⇧5');
    expect(info.instrucoes.length).toBeGreaterThan(0);
  });

  test('Windows: atalho Win+Shift+S e Ferramenta de Captura', () => {
    const info = infoCaptura('windows');
    expect(info.atalho).toBe('Win + Shift + S');
    expect(info.nomeApp).toMatch(/Windows/);
    expect(info.rotuloBotao).toContain('Win+Shift+S');
    expect(info.instrucoes.join(' ')).toMatch(/Game Bar/);
  });

  test('outro SO: instruções genéricas', () => {
    const info = infoCaptura('outro');
    expect(info.so).toBe('outro');
    expect(info.instrucoes.length).toBeGreaterThan(0);
  });
});

describe('nomeArquivoEvidencia', () => {
  const dataFixa = new Date('2026-08-12T14:30:00.000Z');

  test('gera nome de imagem .png com data padronizada', () => {
    expect(nomeArquivoEvidencia(dataFixa, 'imagem')).toBe('evidencia-bug-2026-08-12T14-30-00.png');
  });

  test('gera nome de vídeo .webm', () => {
    expect(nomeArquivoEvidencia(dataFixa, 'video')).toBe('evidencia-bug-2026-08-12T14-30-00.webm');
  });

  test('nome nunca contém ":" (inválido em nomes de arquivo no Windows)', () => {
    expect(nomeArquivoEvidencia(dataFixa, 'video')).not.toContain(':');
  });
});
