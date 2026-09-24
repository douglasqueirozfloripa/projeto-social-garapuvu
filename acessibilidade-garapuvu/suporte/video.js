/**
 * Junta as falas do leitor de tela simulado ao vídeo gravado pelo Playwright.
 *
 * O vídeo do Playwright (.webm) não tem som. Aqui cada fala entra no instante
 * em que foi dita (filtro adelay) e todas são misturadas numa trilha só (amix).
 * O resultado é um .mp4 (H.264 + AAC), que abre em qualquer player e no
 * relatório HTML do Playwright.
 */
const { execFile } = require('node:child_process');
const fs = require('node:fs');

let FFMPEG = null;
try {
  FFMPEG = require('ffmpeg-static');
} catch {
  /* sem ffmpeg-static instalado: os vídeos ficam sem áudio */
}

function juntarAudioNoVideo(videoWebm, falas, destinoMp4) {
  return new Promise((resolve) => {
    if (!FFMPEG || !fs.existsSync(FFMPEG) || !falas.length) return resolve(null);

    const entradas = ['-i', videoWebm];
    const filtros = [];
    falas.forEach((f, i) => {
      entradas.push('-i', f.arquivo);
      filtros.push(`[${i + 1}:a]adelay=${f.inicioMs}|${f.inicioMs}[a${i}]`);
    });
    const rotulos = falas.map((_, i) => `[a${i}]`).join('');
    filtros.push(`${rotulos}amix=inputs=${falas.length}:normalize=0:dropout_transition=0[voz]`);

    const args = [
      '-y', '-hide_banner', '-loglevel', 'error',
      ...entradas,
      '-filter_complex', filtros.join(';'),
      '-map', '0:v', '-map', '[voz]',
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      destinoMp4,
    ];
    execFile(FFMPEG, args, { maxBuffer: 10 * 1024 * 1024 }, (erro) => resolve(erro ? null : destinoMp4));
  });
}

// Vídeo sem fala: só converte o .webm do Playwright para .mp4 (abre em qualquer player).
function converterParaMp4(videoWebm, destinoMp4) {
  return new Promise((resolve) => {
    if (!FFMPEG || !fs.existsSync(FFMPEG)) return resolve(null);
    const args = [
      '-y', '-hide_banner', '-loglevel', 'error', '-i', videoWebm,
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      destinoMp4,
    ];
    execFile(FFMPEG, args, (erro) => resolve(erro ? null : destinoMp4));
  });
}

module.exports = { juntarAudioNoVideo, converterParaMp4 };
