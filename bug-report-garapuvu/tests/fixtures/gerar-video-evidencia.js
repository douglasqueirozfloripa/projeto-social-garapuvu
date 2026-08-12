/**
 * gerar-video-evidencia.js — Gera o vídeo .webm usado como evidência nos testes.
 *
 * Por que um script em vez de um arquivo qualquer: os testes precisam de um
 * webm DE VERDADE (com duração e frames), senão o player abre em 0:00 e não
 * dá play — foi exatamente o bug que apareceu na revisão.
 *
 * Não precisa de ffmpeg: usa o Chromium que já vem com o Playwright, gravando
 * um canvas animado com a mesma API do app (MediaRecorder + captureStream).
 *
 * Rodar:  npm run fixtures:video
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const SEGUNDOS = 5;
const DESTINO = path.join(__dirname, 'gravacao-5s.webm');

async function gerar() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  console.log(`🎥 Gravando ${SEGUNDOS}s de vídeo…`);

  const base64 = await pagina.evaluate(async (segundos) => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(15);
    const gravador = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const pedacos = [];
    gravador.ondataavailable = (e) => e.data.size > 0 && pedacos.push(e.data);

    const pronto = new Promise((resolve) => {
      gravador.onstop = () => resolve(new Blob(pedacos, { type: 'video/webm' }));
    });

    // Animação simples com contador, para dar frames diferentes ao vídeo
    const inicio = performance.now();
    let animando = true;

    function desenhar() {
      const decorrido = (performance.now() - inicio) / 1000;

      ctx.fillStyle = '#14401A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FBC02D';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Evidencia Garapuvu', 24, 60);

      ctx.fillStyle = '#9CCC65';
      ctx.font = 'bold 64px monospace';
      ctx.fillText(`${decorrido.toFixed(1)}s`, 24, 150);

      // Barra de progresso, para ficar óbvio que o vídeo está rodando
      ctx.fillStyle = '#F1F8E9';
      ctx.fillRect(24, 200, (canvas.width - 48) * Math.min(decorrido / segundos, 1), 20);

      if (animando) requestAnimationFrame(desenhar);
    }

    desenhar();
    gravador.start();

    await new Promise((resolve) => setTimeout(resolve, segundos * 1000));
    animando = false;
    gravador.stop();

    const blob = await pronto;

    // Blob → base64 para atravessar a ponte Node ↔ navegador
    return new Promise((resolve) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result).split(',')[1]);
      leitor.readAsDataURL(blob);
    });
  }, SEGUNDOS);

  await navegador.close();

  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(DESTINO, buffer);

  console.log(`✅ ${path.relative(process.cwd(), DESTINO)} — ${(buffer.length / 1024).toFixed(1)} KB`);
}

gerar().catch((erro) => {
  console.error('❌ Falhou ao gerar o vídeo:', erro.message);
  process.exit(1);
});
