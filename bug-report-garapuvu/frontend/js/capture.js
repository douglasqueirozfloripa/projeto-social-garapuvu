/**
 * capture.js — Captura de evidências pelo navegador.
 *
 * O navegador NÃO consegue abrir o app nativo do SO diretamente (por segurança),
 * então este módulo faz duas coisas:
 *   1. Mostra o atalho/app nativo correto para o SO do usuário (via os-detect.js).
 *   2. Oferece captura direto pelo navegador com a Screen Capture API
 *      (getDisplayMedia) — que abre o seletor de tela do próprio sistema.
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

/* global GarapuvuOS */

/**
 * Tira um screenshot da tela escolhida pelo usuário e devolve um dataURL PNG.
 * @returns {Promise<string>} dataURL da imagem capturada
 */
async function capturarScreenshot() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const trilha = stream.getVideoTracks()[0];

  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    // Espera o primeiro frame ficar disponível
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    return canvas.toDataURL('image/png');
  } finally {
    trilha.stop();
    stream.getTracks().forEach((t) => t.stop());
  }
}

/**
 * Grava a tela em vídeo (webm) até o usuário parar, e baixa o arquivo.
 * @returns {{ parar: () => void, finalizado: Promise<Blob> }}
 */
async function iniciarGravacao() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
  });

  const gravador = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const pedacos = [];

  gravador.ondataavailable = (evento) => {
    if (evento.data && evento.data.size > 0) pedacos.push(evento.data);
  };

  const finalizado = new Promise((resolve) => {
    gravador.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(pedacos, { type: 'video/webm' }));
    };
  });

  // Se o usuário parar o compartilhamento pela UI do navegador/SO
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    if (gravador.state !== 'inactive') gravador.stop();
  });

  gravador.start();

  return {
    parar() {
      if (gravador.state !== 'inactive') gravador.stop();
    },
    finalizado
  };
}

/**
 * Baixa um Blob como arquivo no computador do usuário.
 */
function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Converte um Blob em dataURL (base64), para poder anexar ao bug e
 * guardar no localStorage/API como qualquer outro campo de texto.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobParaDataUrl(blob) {
  return new Promise((resolve, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => rejeitar(leitor.error || new Error('Falha ao ler o arquivo.'));
    leitor.readAsDataURL(blob);
  });
}

/**
 * Formata bytes em algo legível ("2.4 MB").
 * @param {number} bytes
 * @returns {string}
 */
function formatarTamanho(bytes) {
  const numero = Number(bytes) || 0;
  if (numero < 1024) return `${numero} B`;
  if (numero < 1024 * 1024) return `${(numero / 1024).toFixed(1)} KB`;
  return `${(numero / (1024 * 1024)).toFixed(1)} MB`;
}

const apiCapture = {
  capturarScreenshot,
  iniciarGravacao,
  baixarArquivo,
  blobParaDataUrl,
  formatarTamanho
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiCapture;
}
if (typeof window !== 'undefined') {
  window.GarapuvuCapture = apiCapture;
}
