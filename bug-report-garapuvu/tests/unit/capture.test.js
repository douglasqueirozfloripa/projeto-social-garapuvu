/**
 * Testes UNITÁRIOS — capture.js (captura de evidências pelo navegador)
 *
 * @jest-environment jsdom
 *
 * O jsdom não implementa mídia (getDisplayMedia, MediaRecorder, canvas,
 * URL.createObjectURL), então cada API é dublada. O que estamos testando é
 * a NOSSA lógica em volta delas:
 *   - a trilha de vídeo é encerrada depois da captura (senão o navegador
 *     fica com o ícone de "compartilhando tela" para sempre);
 *   - o gravador junta os pedaços num Blob webm;
 *   - parar o compartilhamento pela UI do navegador também para a gravação;
 *   - o download cria e limpa o link temporário.
 */

const {
  capturarScreenshot,
  iniciarGravacao,
  baixarArquivo,
  blobParaDataUrl,
  formatarTamanho
} = require('../../frontend/js/capture.js');

const DATA_URL_FALSA = 'data:image/png;base64,iVBORw0KGgo=';

/** Cria uma trilha de vídeo dublada, que registra se foi encerrada. */
function criarTrilha() {
  const ouvintes = {};
  return {
    stop: jest.fn(),
    addEventListener: jest.fn((evento, callback) => {
      ouvintes[evento] = callback;
    }),
    disparar(evento) {
      ouvintes[evento]?.();
    }
  };
}

/** Cria um stream dublado com uma trilha de vídeo. */
function criarStream(trilha = criarTrilha()) {
  return {
    trilha,
    getVideoTracks: () => [trilha],
    getTracks: () => [trilha]
  };
}

/** Instala um MediaRecorder dublado e devolve o controle dele. */
function instalarMediaRecorder({ mimeSuportado = true } = {}) {
  const controle = { instancia: null, opcoes: null };

  global.MediaRecorder = class {
    constructor(stream, opcoes) {
      if (!mimeSuportado) throw new Error('mimeType não suportado');
      this.stream = stream;
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstop = null;
      controle.instancia = this;
      controle.opcoes = opcoes;
    }

    start() {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      this.onstop?.();
    }

    /** Atalho de teste: simula o navegador entregando um pedaço gravado. */
    emitirPedaco(dados) {
      this.ondataavailable?.({ data: dados });
    }
  };

  return controle;
}

beforeEach(() => {
  // ---------- getDisplayMedia ----------
  navigator.mediaDevices = { getDisplayMedia: jest.fn() };

  // ---------- canvas (jsdom não desenha) ----------
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() }));
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => DATA_URL_FALSA);

  // ---------- <video>.play() ----------
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);

  // ---------- URL de objeto ----------
  global.URL.createObjectURL = jest.fn(() => 'blob:garapuvu/123');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.MediaRecorder;
});

describe('capturarScreenshot', () => {
  test('devolve o dataURL PNG do frame capturado', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());

    await expect(capturarScreenshot()).resolves.toBe(DATA_URL_FALSA);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/png');
  });

  test('pede só vídeo ao usuário (sem áudio no screenshot)', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());

    await capturarScreenshot();

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({ video: true });
  });

  test('encerra a trilha depois de capturar', async () => {
    const stream = criarStream();
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(stream);

    await capturarScreenshot();

    // Sem isso o navegador continua marcando "compartilhando tela"
    expect(stream.trilha.stop).toHaveBeenCalled();
  });

  test('encerra a trilha mesmo se der erro no meio da captura (finally)', async () => {
    const stream = criarStream();
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(stream);
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => {
      throw new Error('canvas explodiu');
    });

    await expect(capturarScreenshot()).rejects.toThrow('canvas explodiu');
    expect(stream.trilha.stop).toHaveBeenCalled();
  });

  test('propaga a recusa do usuário (permissão negada)', async () => {
    navigator.mediaDevices.getDisplayMedia.mockRejectedValue(new Error('Permission denied'));

    await expect(capturarScreenshot()).rejects.toThrow('Permission denied');
  });
});

describe('iniciarGravacao', () => {
  test('pede a tela sem áudio e começa a gravar', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());
    const controle = instalarMediaRecorder();

    await iniciarGravacao();

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
      video: true,
      audio: false
    });
    expect(controle.opcoes).toEqual({ mimeType: 'video/webm' });
    expect(controle.instancia.state).toBe('recording');
  });

  test('junta os pedaços num Blob webm quando para', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());
    const controle = instalarMediaRecorder();

    const gravacao = await iniciarGravacao();
    controle.instancia.emitirPedaco(new Blob(['parte-1'], { type: 'video/webm' }));
    controle.instancia.emitirPedaco(new Blob(['parte-2'], { type: 'video/webm' }));
    gravacao.parar();

    const blob = await gravacao.finalizado;
    expect(blob.type).toBe('video/webm');
    expect(blob.size).toBeGreaterThan(0);
  });

  test('descarta pedaços vazios', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());
    const controle = instalarMediaRecorder();

    const gravacao = await iniciarGravacao();
    controle.instancia.emitirPedaco(new Blob([], { type: 'video/webm' })); // size 0
    controle.instancia.emitirPedaco(null); // sem data
    controle.instancia.emitirPedaco(new Blob(['ok'], { type: 'video/webm' }));
    gravacao.parar();

    const blob = await gravacao.finalizado;
    expect(blob.size).toBe(2); // só o pedaço 'ok'
  });

  test('encerra as trilhas ao parar (libera a tela compartilhada)', async () => {
    const stream = criarStream();
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(stream);
    instalarMediaRecorder();

    const gravacao = await iniciarGravacao();
    gravacao.parar();
    await gravacao.finalizado;

    expect(stream.trilha.stop).toHaveBeenCalled();
  });

  test('parar o compartilhamento pela UI do navegador também para a gravação', async () => {
    const trilha = criarTrilha();
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream(trilha));
    const controle = instalarMediaRecorder();

    const gravacao = await iniciarGravacao();
    trilha.disparar('ended'); // usuário clicou em "Parar compartilhamento"

    const blob = await gravacao.finalizado;
    expect(blob.type).toBe('video/webm');
    expect(controle.instancia.state).toBe('inactive');
  });

  test('chamar parar() duas vezes não quebra', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());
    instalarMediaRecorder();

    const gravacao = await iniciarGravacao();
    gravacao.parar();
    expect(() => gravacao.parar()).not.toThrow();

    await expect(gravacao.finalizado).resolves.toBeInstanceOf(Blob);
  });

  test('propaga erro quando o navegador não suporta o formato', async () => {
    navigator.mediaDevices.getDisplayMedia.mockResolvedValue(criarStream());
    instalarMediaRecorder({ mimeSuportado: false });

    await expect(iniciarGravacao()).rejects.toThrow('mimeType não suportado');
  });
});

describe('baixarArquivo', () => {
  test('cria o link temporário, clica e limpa tudo', async () => {
    const cliques = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const blob = new Blob(['conteudo'], { type: 'video/webm' });

    baixarArquivo(blob, 'evidencia.webm');

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(cliques).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:garapuvu/123');
    // O link não pode ficar sobrando no DOM
    expect(document.querySelector('a')).toBeNull();
  });

  test('usa o nome de arquivo informado', async () => {
    let nomeUsado = null;
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      nomeUsado = this.download;
    });

    baixarArquivo(new Blob(['x']), 'bug-2026-08-12.webm');

    expect(nomeUsado).toBe('bug-2026-08-12.webm');
  });
});

describe('blobParaDataUrl', () => {
  test('converte o blob em dataURL base64', async () => {
    const blob = new Blob(['garapuvu'], { type: 'text/plain' });

    const dataUrl = await blobParaDataUrl(blob);

    expect(dataUrl.startsWith('data:text/plain;base64,')).toBe(true);
  });

  test('o conteúdo volta igual depois de decodificar', async () => {
    const dataUrl = await blobParaDataUrl(new Blob(['garapuvu'], { type: 'text/plain' }));
    const base64 = dataUrl.split(',')[1];

    expect(Buffer.from(base64, 'base64').toString()).toBe('garapuvu');
  });

  test('rejeita quando a leitura falha', async () => {
    const leitorQuebrado = {
      readAsDataURL() {
        this.onerror();
      },
      error: new Error('disco cheio')
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => leitorQuebrado);

    await expect(blobParaDataUrl(new Blob(['x']))).rejects.toThrow('disco cheio');
  });

  test('rejeita com mensagem própria quando o leitor não informa o erro', async () => {
    const leitorQuebrado = {
      readAsDataURL() {
        this.onerror();
      },
      error: null
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => leitorQuebrado);

    await expect(blobParaDataUrl(new Blob(['x']))).rejects.toThrow(/Falha ao ler/);
  });
});

describe('formatarTamanho', () => {
  test('mostra bytes abaixo de 1 KB', () => {
    expect(formatarTamanho(0)).toBe('0 B');
    expect(formatarTamanho(512)).toBe('512 B');
    expect(formatarTamanho(1023)).toBe('1023 B');
  });

  test('mostra KB entre 1 KB e 1 MB', () => {
    expect(formatarTamanho(1024)).toBe('1.0 KB');
    expect(formatarTamanho(1536)).toBe('1.5 KB');
  });

  test('mostra MB a partir de 1 MB', () => {
    expect(formatarTamanho(1024 * 1024)).toBe('1.0 MB');
    expect(formatarTamanho(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  test('trata entrada inválida como zero', () => {
    expect(formatarTamanho(null)).toBe('0 B');
    expect(formatarTamanho(undefined)).toBe('0 B');
    expect(formatarTamanho('abc')).toBe('0 B');
  });
});
