/**
 * os-detect.js — Detecta o sistema operacional a partir do navegador
 * e informa como abrir o app nativo de captura/gravação de tela.
 *
 * Compartilhado entre navegador e Node (para testes unitários).
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

/**
 * Detecta o SO a partir da string do user agent / platform.
 * @param {string} userAgent - ex.: navigator.userAgent
 * @returns {'mac' | 'windows' | 'outro'}
 */
function detectarSO(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('mac os') || ua.includes('macintosh') || ua.includes('macos')) return 'mac';
  return 'outro';
}

/**
 * Retorna as informações de captura nativas para o SO detectado.
 * @param {'mac' | 'windows' | 'outro'} so
 * @returns {{ so: string, nomeApp: string, atalho: string, rotuloBotao: string, instrucoes: string[] }}
 */
function infoCaptura(so) {
  if (so === 'mac') {
    return {
      so: 'mac',
      nomeApp: 'Captura de Tela do macOS',
      atalho: '⌘ + Shift + 5',
      rotuloBotao: '🍎 Capturar evidência no macOS (⌘⇧5)',
      instrucoes: [
        'Pressione ⌘ + Shift + 5 para abrir o app de Captura de Tela do macOS.',
        'Na barra que aparece, escolha capturar imagem (tela inteira, janela ou seleção) ou gravar vídeo.',
        'Clique em "Gravar" ou "Capturar". O arquivo é salvo na Mesa (Desktop) por padrão.',
        'Anexe o arquivo gerado ao bug como evidência.'
      ]
    };
  }
  if (so === 'windows') {
    return {
      so: 'windows',
      nomeApp: 'Ferramenta de Captura do Windows',
      atalho: 'Win + Shift + S',
      rotuloBotao: '🪟 Capturar evidência no Windows (Win+Shift+S)',
      instrucoes: [
        'Pressione Win + Shift + S para abrir a Ferramenta de Captura (Snipping Tool).',
        'Escolha o modo: retângulo, janela, tela inteira ou gravação de vídeo.',
        'Para gravar vídeo com áudio, você também pode usar a Xbox Game Bar (Win + G).',
        'A captura vai para a área de transferência e para "Imagens > Capturas de Tela". Anexe ao bug como evidência.'
      ]
    };
  }
  return {
    so: 'outro',
    nomeApp: 'Ferramenta de captura do seu sistema',
    atalho: '—',
    rotuloBotao: '📸 Capturar evidência',
    instrucoes: [
      'Use a ferramenta de captura de tela do seu sistema operacional.',
      'No Linux (GNOME), pressione Print Screen ou Shift + Ctrl + Alt + R para gravar.',
      'Anexe o arquivo gerado ao bug como evidência.'
    ]
  };
}

/**
 * Gera o nome padronizado de um arquivo de evidência.
 * @param {Date} data - data da captura
 * @param {'imagem' | 'video'} tipo
 * @returns {string} ex.: "evidencia-bug-2026-08-12T14-30-00.png"
 */
function nomeArquivoEvidencia(data, tipo) {
  const iso = data.toISOString().replace(/\.\d{3}Z$/, '').replace(/:/g, '-');
  const extensao = tipo === 'video' ? 'webm' : 'png';
  return `evidencia-bug-${iso}.${extensao}`;
}

const apiOsDetect = { detectarSO, infoCaptura, nomeArquivoEvidencia };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiOsDetect;
}
if (typeof window !== 'undefined') {
  window.GarapuvuOS = apiOsDetect;
}
