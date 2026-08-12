/**
 * app.js — Liga a interface aos módulos (validators, os-detect, storage, capture, api).
 *
 * Aula B4 — Abertura e Documentação de Bugs (Projeto Social Garapuvu)
 */

/* global GarapuvuValidators, GarapuvuOS, GarapuvuStorage, GarapuvuCapture, GarapuvuApi, GarapuvuBdd, GarapuvuCsv */

(function iniciar() {
  const $ = (id) => document.getElementById(id);

  const storage = GarapuvuStorage.criarStorage(window.localStorage);
  const api = GarapuvuApi.criarClienteApi({ storage });

  // ---------- Detecção de SO e botão de captura nativa ----------
  const so = GarapuvuOS.detectarSO(navigator.userAgent);
  const captura = GarapuvuOS.infoCaptura(so);

  const nomesSO = { mac: 'macOS', windows: 'Windows', outro: 'outro SO' };
  $('badge-so').textContent = `💻 ${nomesSO[so]}`;
  $('btn-captura-nativa').textContent = captura.rotuloBotao;

  // Ambiente preenchido automaticamente
  $('ambiente').value = `${nomesSO[so]} · ${navigator.userAgent.split(') ')[0]})`;

  // ---------- Modal com instruções do app nativo ----------
  $('btn-captura-nativa').addEventListener('click', () => {
    $('modal-titulo').textContent = captura.nomeApp;
    $('modal-atalho').textContent = captura.atalho;
    const ol = $('modal-instrucoes');
    ol.innerHTML = '';
    captura.instrucoes.forEach((passo) => {
      const li = document.createElement('li');
      li.textContent = passo;
      ol.appendChild(li);
    });
    $('modal-captura').classList.add('visivel');
  });

  $('btn-fechar-modal').addEventListener('click', () => {
    $('modal-captura').classList.remove('visivel');
  });

  // ---------- Captura pelo navegador ----------
  // Vídeo em base64 cresce ~33%: acima disso o localStorage estoura a cota.
  const LIMITE_EVIDENCIA_BYTES = 3 * 1024 * 1024;

  let evidenciaAtual = null; // { dados: dataURL, tipo: 'imagem'|'video', nome?: string }

  /** Mostra a evidência atual no preview (imagem ou player de vídeo). */
  function mostrarEvidencia(info) {
    const img = $('img-evidencia');
    const video = $('video-evidencia');
    const ehVideo = info.tipo === 'video';

    img.src = ehVideo ? '' : info.dados;
    img.hidden = ehVideo;

    video.src = ehVideo ? info.dados : '';
    video.hidden = !ehVideo;

    $('info-evidencia').textContent = info.legenda || '';
    $('preview-evidencia').classList.add('visivel');
  }

  function limparEvidencia() {
    evidenciaAtual = null;
    $('img-evidencia').src = '';
    $('video-evidencia').pause();
    $('video-evidencia').removeAttribute('src');
    $('info-evidencia').textContent = '';
    $('preview-evidencia').classList.remove('visivel');
  }

  $('btn-screenshot').addEventListener('click', async () => {
    try {
      const dados = await GarapuvuCapture.capturarScreenshot();
      evidenciaAtual = { dados, tipo: 'imagem' };
      mostrarEvidencia({ ...evidenciaAtual, legenda: 'Screenshot anexado ao bug.' });
      avisar('Screenshot capturado e anexado ao bug! 📸');
    } catch (_erro) {
      avisar('Captura cancelada ou não permitida.', true);
    }
  });

  let gravacao = null;

  /** Fim da gravação: baixa o arquivo e anexa o vídeo como evidência. */
  async function aoTerminarGravacao(blob) {
    const nome = GarapuvuOS.nomeArquivoEvidencia(new Date(), 'video');
    const tamanho = GarapuvuCapture.formatarTamanho(blob.size);

    // Sempre entrega o arquivo: serve de anexo no Jira/Trello
    GarapuvuCapture.baixarArquivo(blob, nome);

    if (blob.size > LIMITE_EVIDENCIA_BYTES) {
      avisar(
        `Gravação salva como ${nome} (${tamanho}) — grande demais para anexar aqui, ` +
          'anexe o arquivo no ticket.',
        true
      );
      return;
    }

    try {
      const dados = await GarapuvuCapture.blobParaDataUrl(blob);
      evidenciaAtual = { dados, tipo: 'video', nome };
      mostrarEvidencia({ ...evidenciaAtual, legenda: `🎥 ${nome} · ${tamanho}` });
      avisar(`Gravação anexada ao bug e baixada como ${nome} 🎥`);
    } catch (_erro) {
      avisar(`Gravação salva como ${nome}, mas não deu para anexar aqui.`, true);
    }
  }

  $('btn-gravar').addEventListener('click', async () => {
    const botao = $('btn-gravar');
    try {
      if (!gravacao) {
        gravacao = await GarapuvuCapture.iniciarGravacao();
        botao.textContent = '⏹️ Parar gravação';
        avisar('Gravando a tela… clique de novo para parar.');
        gravacao.finalizado.then(async (blob) => {
          botao.textContent = '🎥 Gravar tela pelo navegador';
          gravacao = null;
          await aoTerminarGravacao(blob);
        });
      } else {
        gravacao.parar();
      }
    } catch (_erro) {
      avisar('Gravação cancelada ou não permitida.', true);
      gravacao = null;
      botao.textContent = '🎥 Gravar tela pelo navegador';
    }
  });

  $('btn-remover-evidencia').addEventListener('click', limparEvidencia);

  // ---------- Anexar arquivo (seletor ou arrastar e soltar) ----------
  const EXTENSOES_VIDEO = ['.webm', '.mp4', '.mov', '.m4v', '.ogv'];
  const EXTENSOES_IMAGEM = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif'];

  /**
   * Descobre o tipo da evidência. Alguns arquivos chegam com file.type vazio
   * (é o caso do .webm arrastado em certos navegadores), então cai na extensão.
   * @returns {'imagem'|'video'|null}
   */
  function tipoDoArquivo(arquivo) {
    const mime = (arquivo.type || '').toLowerCase();
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('image/')) return 'imagem';

    const nome = (arquivo.name || '').toLowerCase();
    if (EXTENSOES_VIDEO.some((ext) => nome.endsWith(ext))) return 'video';
    if (EXTENSOES_IMAGEM.some((ext) => nome.endsWith(ext))) return 'imagem';

    return null;
  }

  async function anexarArquivo(arquivo) {
    if (!arquivo) return;

    const tipo = tipoDoArquivo(arquivo);
    if (!tipo) {
      avisar(`"${arquivo.name}" não é imagem nem vídeo. Anexe um print ou uma gravação.`, true);
      return;
    }

    const tamanho = GarapuvuCapture.formatarTamanho(arquivo.size);
    if (arquivo.size > LIMITE_EVIDENCIA_BYTES) {
      avisar(`"${arquivo.name}" tem ${tamanho} — o limite para anexar aqui é 3 MB.`, true);
      return;
    }

    try {
      const dados = await GarapuvuCapture.blobParaDataUrl(arquivo);
      evidenciaAtual = { dados, tipo, nome: arquivo.name };
      const icone = tipo === 'video' ? '🎥' : '🖼️';
      mostrarEvidencia({ ...evidenciaAtual, legenda: `${icone} ${arquivo.name} · ${tamanho}` });
      avisar(`"${arquivo.name}" anexado ao bug! 📎`);
    } catch (_erro) {
      avisar(`Não deu para ler "${arquivo.name}".`, true);
    }
  }

  $('btn-anexar').addEventListener('click', () => $('arquivo-evidencia').click());

  $('arquivo-evidencia').addEventListener('change', async (evento) => {
    await anexarArquivo(evento.target.files[0]);
    evento.target.value = ''; // permite reanexar o mesmo arquivo depois
  });

  // Arrastar e soltar na área de evidência
  const areaCaptura = $('area-captura');

  ['dragenter', 'dragover'].forEach((evt) =>
    areaCaptura.addEventListener(evt, (evento) => {
      evento.preventDefault();
      evento.dataTransfer.dropEffect = 'copy';
      areaCaptura.classList.add('arrastando');
    })
  );

  ['dragleave', 'dragend'].forEach((evt) =>
    areaCaptura.addEventListener(evt, (evento) => {
      // Ignora o dragleave disparado ao passar por elementos filhos
      if (evento.relatedTarget && areaCaptura.contains(evento.relatedTarget)) return;
      areaCaptura.classList.remove('arrastando');
    })
  );

  areaCaptura.addEventListener('drop', async (evento) => {
    evento.preventDefault();
    areaCaptura.classList.remove('arrastando');
    await anexarArquivo(evento.dataTransfer.files[0]);
  });

  // Sem isso, soltar o arquivo fora da área faz o navegador abrir o vídeo
  // em outra aba e o usuário perde o formulário preenchido.
  ['dragover', 'drop'].forEach((evt) =>
    window.addEventListener(evt, (evento) => {
      if (!areaCaptura.contains(evento.target)) evento.preventDefault();
    })
  );

  // ---------- Geração do cenário BDD ----------
  function dadosDoFormulario() {
    return {
      titulo: $('titulo').value,
      prerequisitos: $('prerequisitos').value,
      passos: $('passos').value,
      esperado: $('esperado').value,
      obtido: $('obtido').value,
      severidade: $('severidade').value,
      prioridade: $('prioridade').value,
      ambiente: $('ambiente').value,
      bdd: $('bdd').value
    };
  }

  $('btn-gerar-bdd').addEventListener('click', () => {
    const dados = dadosDoFormulario();

    if (!dados.passos.trim()) {
      avisar('Preencha os passos para reproduzir antes de gerar o BDD.', true);
      $('passos').focus();
      return;
    }

    $('bdd').value = GarapuvuBdd.gerarBdd(dados);
    salvarRascunho();
    avisar('Cenário BDD gerado! Revise e ajuste se precisar. 🥒');
  });

  $('btn-copiar-bdd').addEventListener('click', async () => {
    const texto = $('bdd').value;
    if (!texto.trim()) {
      avisar('Nada para copiar — gere o BDD primeiro.', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      avisar('Cenário BDD copiado para a área de transferência. 📋');
    } catch (_erro) {
      // Sem permissão de clipboard (ou http): seleciona o texto para copiar à mão
      $('bdd').select();
      avisar('Não deu para copiar automaticamente — use Ctrl/Cmd+C.', true);
    }
  });

  // ---------- Rascunho automático (localStorage) ----------
  const campos = [
    'titulo',
    'prerequisitos',
    'passos',
    'esperado',
    'obtido',
    'severidade',
    'prioridade',
    'bdd'
  ];

  const rascunho = storage.lerRascunho();
  if (rascunho) {
    campos.forEach((campo) => {
      if (rascunho[campo] !== undefined) $(campo).value = rascunho[campo];
    });
    avisar('Rascunho recuperado do localStorage. ✍️');
  }

  campos.forEach((campo) => {
    $(campo).addEventListener('input', salvarRascunho);
    $(campo).addEventListener('change', salvarRascunho);
  });

  function salvarRascunho() {
    const dados = {};
    campos.forEach((campo) => (dados[campo] = $(campo).value));
    storage.salvarRascunho(dados);
  }

  // ---------- Abertura do bug ----------
  $('form-bug').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const dados = {
      ...dadosDoFormulario(),
      evidencia: evidenciaAtual?.dados || null,
      evidenciaTipo: evidenciaAtual?.tipo || null,
      evidenciaNome: evidenciaAtual?.nome || null
    };

    const validacao = GarapuvuValidators.validarBug(dados);
    if (!validacao.valido) {
      avisar(validacao.erros[0], true);
      return;
    }

    try {
      await api.criarBug(GarapuvuValidators.normalizarBug(dados));
      storage.limparRascunho();
      $('form-bug').reset();
      limparEvidencia();
      $('ambiente').value = `${nomesSO[so]} · ${navigator.userAgent.split(') ')[0]})`;
      avisar('Bug aberto com sucesso! 🐛✅');
      await renderizarLista();
    } catch (erro) {
      avisar(erro.detalhes?.[0] || erro.message, true);
    }
  });

  // ---------- Lista, filtros e mudanças de status ----------
  $('filtro-status').addEventListener('change', aoFiltrar);
  $('filtro-severidade').addEventListener('change', aoFiltrar);

  function aoFiltrar() {
    storage.salvarPreferencias({
      filtroStatus: $('filtro-status').value,
      filtroSeveridade: $('filtro-severidade').value
    });
    renderizarLista();
  }

  // ---------- Exportação CSV ----------
  $('btn-exportar-csv').addEventListener('click', () => {
    const bugs = bugsVisiveis();

    if (bugs.length === 0) {
      avisar('Nenhum bug para exportar com os filtros atuais.', true);
      return;
    }

    const csv = GarapuvuCsv.gerarCsv(bugs);
    const nome = GarapuvuCsv.nomeArquivoCsv(new Date());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    GarapuvuCapture.baixarArquivo(blob, nome);
    avisar(`${bugs.length} bug(s) exportados para ${nome} 📄`);
  });

  // Restaura filtros salvos
  const prefs = storage.lerPreferencias();
  if (prefs.filtroStatus) $('filtro-status').value = prefs.filtroStatus;
  if (prefs.filtroSeveridade) $('filtro-severidade').value = prefs.filtroSeveridade;

  const rotulosStatus = {
    aberto: 'Aberto',
    em_analise: 'Em análise',
    corrigido: 'Corrigido',
    fechado: 'Fechado'
  };

  /** Monta o HTML da evidência de um bug: player de vídeo ou miniatura da imagem. */
  function evidenciaDoBug(bug) {
    if (!bug.evidencia) return '';

    const legenda = bug.evidenciaNome ? `<p class="dica">📎 ${escapar(bug.evidenciaNome)}</p>` : '';

    if (bug.evidenciaTipo === 'video') {
      return `${legenda}<video class="evidencia-video" data-testid="evidencia-video" controls
                     playsinline preload="metadata" src="${bug.evidencia}"
                     aria-label="Gravação do bug #${bug.id}"></video>`;
    }

    return `${legenda}<img class="evidencia-mini" src="${bug.evidencia}"
                   alt="Evidência do bug #${bug.id}" />`;
  }

  /** Aplica os filtros da tela a uma lista de bugs. */
  function aplicarFiltros(lista) {
    const fStatus = $('filtro-status').value;
    const fSev = $('filtro-severidade').value;

    return lista
      .filter((b) => fStatus === 'todos' || b.status === fStatus)
      .filter((b) => fSev === 'todas' || b.severidade === fSev);
  }

  /**
   * Bugs do localStorage que estão visíveis na tela.
   * O localStorage é a cópia que api.listarBugs() mantém espelhada da API.
   */
  function bugsVisiveis() {
    return aplicarFiltros(storage.lerBugsOffline());
  }

  async function renderizarLista() {
    const bugs = aplicarFiltros(await api.listarBugs());
    $('badge-offline').classList.toggle('visivel', api.offline);

    $('contador').textContent = `${bugs.length} bug${bugs.length === 1 ? '' : 's'}`;

    const lista = $('lista-bugs');
    lista.innerHTML = '';

    if (bugs.length === 0) {
      const semFiltro =
        $('filtro-status').value === 'todos' && $('filtro-severidade').value === 'todas';
      lista.innerHTML = semFiltro
        ? '<p class="lista-vazia">Nenhum bug registrado ainda. Que tal abrir o primeiro? 🎉</p>'
        : '<p class="lista-vazia">Nenhum bug encontrado com esses filtros. 🎉</p>';
      return;
    }

    bugs
      .slice()
      .reverse()
      .forEach((bug) => {
        const artigo = document.createElement('article');
        artigo.className = 'bug';
        artigo.dataset.severidade = bug.severidade;
        artigo.dataset.testid = 'bug-item';

        const opcoesStatus = Object.entries(rotulosStatus)
          .map(
            ([valor, rotulo]) =>
              `<option value="${valor}" ${valor === bug.status ? 'selected' : ''}>${rotulo}</option>`
          )
          .join('');

        artigo.innerHTML = `
          <div class="topo">
            <h3><span class="id">#${bug.id}</span> ${escapar(bug.titulo)}</h3>
          </div>
          <div class="etiquetas">
            <span class="etiqueta severidade-${bug.severidade}">sev: ${bug.severidade}</span>
            <span class="etiqueta prioridade">prio: ${bug.prioridade}</span>
            ${bug.ambiente ? `<span class="etiqueta ambiente">${escapar(bug.ambiente)}</span>` : ''}
          </div>
          ${bug.prerequisitos ? `<p class="detalhes"><strong>Pré-requisitos:</strong> ${escapar(bug.prerequisitos)}</p>` : ''}
          <p class="detalhes"><strong>Passos:</strong> ${escapar(bug.passos)}</p>
          <p class="detalhes"><strong>Esperado:</strong> ${escapar(bug.esperado)} ·
             <strong>Obtido:</strong> ${escapar(bug.obtido)}</p>
          ${bug.bdd ? `<details class="bdd-bug" data-testid="bdd-bug"><summary>🥒 Cenário BDD</summary><pre>${escapar(bug.bdd)}</pre></details>` : ''}
          ${evidenciaDoBug(bug)}
          <div class="rodape">
            <label style="margin:0">Status:</label>
            <select data-testid="status-bug" aria-label="Status do bug #${bug.id}">${opcoesStatus}</select>
            <button type="button" class="btn-perigo" data-testid="btn-excluir">🗑️ Excluir</button>
          </div>`;

        artigo.querySelector('select').addEventListener('change', async (e) => {
          try {
            await api.atualizarBug(bug.id, { ...bug, status: e.target.value });
            avisar(`Bug #${bug.id} agora está "${rotulosStatus[e.target.value]}".`);
            renderizarLista();
          } catch (erro) {
            avisar(erro.message, true);
          }
        });

        artigo.querySelector('[data-testid="btn-excluir"]').addEventListener('click', async () => {
          try {
            await api.removerBug(bug.id);
            avisar(`Bug #${bug.id} excluído.`);
            renderizarLista();
          } catch (erro) {
            avisar(erro.message, true);
          }
        });

        lista.appendChild(artigo);
      });
  }

  // ---------- Utilitários ----------
  let timerToast = null;
  function avisar(mensagem, ehErro = false) {
    const toast = $('toast');
    toast.textContent = mensagem;
    toast.classList.toggle('erro', ehErro);
    toast.classList.add('visivel');
    clearTimeout(timerToast);
    timerToast = setTimeout(() => toast.classList.remove('visivel'), 3500);
  }

  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  renderizarLista();
})();
