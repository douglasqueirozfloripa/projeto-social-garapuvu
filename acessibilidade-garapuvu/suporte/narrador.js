/**
 * Voz do leitor de tela simulado, usando o sintetizador nativo do macOS (`say`).
 *
 * Cada frase vira um arquivo de áudio. O narrador guarda em que momento do
 * vídeo ela foi falada e, no fim do teste, video.js junta tudo no vídeo.
 *
 * O teste também ESPERA a duração de cada frase antes de seguir, como uma
 * pessoa ouvindo o NVDA. Assim o áudio não se sobrepõe e o vídeo fica no ritmo
 * real da leitura.
 *
 * Variáveis de ambiente:
 *   AUDIO=0   desliga a voz (padrão: ligada no macOS, desligada no resto)
 *   FALAR=1   também toca a voz AO VIVO nos alto-falantes (bom para a aula)
 *   VOZ=...   voz do leitor de tela (padrão: Luciana, pt-BR)
 *   VOZ_NARRADOR=...  voz que lê cenários, passos e paradas de foco no modo
 *             ao vivo (padrão: Eddy, pt-BR) — outra voz, para não confundir
 *             com o leitor de tela
 *   VELOCIDADE=...  palavras por minuto (padrão: 210)
 */
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TEM_SAY = process.platform === 'darwin';
const AUDIO_LIGADO = TEM_SAY && process.env.AUDIO !== '0';
const AO_VIVO = AUDIO_LIGADO && process.env.FALAR === '1';
const VOZ = process.env.VOZ || 'Luciana';
const VOZ_NARRADOR = process.env.VOZ_NARRADOR || 'Eddy (Português (Brasil))';
const VELOCIDADE = process.env.VELOCIDADE || '210';

// Sem áudio, cada frase ainda fica um instante na legenda, para dar tempo de ler no vídeo.
const PAUSA_SEM_AUDIO_MS = 350;

class Narrador {
  constructor(testInfo) {
    this.pasta = testInfo.outputPath('falas');
    this.falas = []; // { arquivo, inicioMs }
    this.t0 = Date.now();
  }

  // Marca o instante zero do vídeo (quando a página foi criada).
  zerarRelogio() {
    this.t0 = Date.now();
  }

  // Fala do leitor de tela simulado (sempre gravada no vídeo, quando há áudio).
  async falar(frase, voz = VOZ) {
    if (!AUDIO_LIGADO) {
      await esperar(PAUSA_SEM_AUDIO_MS);
      return;
    }
    fs.mkdirSync(this.pasta, { recursive: true });
    const arquivo = path.join(this.pasta, `fala-${String(this.falas.length).padStart(3, '0')}.aiff`);
    const inicioMs = Date.now() - this.t0;
    execFileSync('say', ['-v', voz, '-r', VELOCIDADE, '-o', arquivo, '--', frase]);
    this.falas.push({ arquivo, inicioMs });

    if (AO_VIVO) spawn('afplay', [arquivo], { stdio: 'ignore' });

    await esperar(duracaoMs(arquivo));
  }

  // Narração só do modo ao vivo (FALAR=1): cenário, passos e paradas de foco,
  // com a voz do narrador. Fora do modo ao vivo não faz nada — a suíte normal
  // continua no ritmo dela.
  async narrar(texto) {
    if (!AO_VIVO) return;
    await this.falar(texto, VOZ_NARRADOR);
  }
}

// `afinfo` (nativo do macOS) informa a duração: "estimated duration: 2.809660 sec".
function duracaoMs(arquivo) {
  try {
    const saida = execFileSync('afinfo', [arquivo], { encoding: 'utf8' });
    const m = saida.match(/estimated duration:\s*([\d.]+)/);
    return m ? Math.round(Number(m[1]) * 1000) + 120 : 1500;
  } catch {
    return 1500;
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { Narrador, AUDIO_LIGADO };
