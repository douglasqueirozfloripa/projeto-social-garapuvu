/**
 * Legenda exibida DENTRO da página enquanto o teste roda.
 *
 * Como o Playwright grava a tela da página, tudo o que é desenhado aqui sai no
 * vídeo: a funcionalidade, o cenário, os passos em BDD (com o passo atual em
 * destaque) e o "Visualizador de fala" — as últimas frases que o leitor de tela
 * simulado falou, como o visualizador de fala do próprio NVDA.
 *
 * A caixa é invisível para a acessibilidade (aria-hidden + inert) e não recebe
 * cliques (pointer-events: none), então não interfere nos testes. As análises
 * do axe excluem o seletor #qa-legenda por garantia.
 */

// Roda dentro do navegador, em toda página carregada (addInitScript).
function instalarNoNavegador() {
  const CSS = `
    #qa-legenda { position: fixed; right: 12px; bottom: 12px; z-index: 2147483647;
      width: min(500px, calc(100vw - 16px)); max-height: 58vh; overflow: hidden;
      box-sizing: border-box; padding: 12px 14px; border-radius: 12px;
      background: rgba(6, 10, 18, .9); color: #fff; border: 1px solid rgba(255,255,255,.2);
      box-shadow: 0 10px 30px rgba(0,0,0,.45); pointer-events: none;
      font: 13px/1.4 -apple-system, "Segoe UI", system-ui, sans-serif; text-align: left; }
    #qa-legenda * { box-sizing: border-box; }
    #qa-legenda .qa-func { font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: #8FB3FF; }
    #qa-legenda .qa-cen { font-size: 15px; font-weight: 700; margin: 2px 0 8px; }
    #qa-legenda .qa-passo { display: flex; gap: 8px; padding: 3px 6px; border-radius: 6px; opacity: .5; }
    #qa-legenda .qa-passo.executando { opacity: 1; background: rgba(242,183,5,.2); }
    #qa-legenda .qa-passo.ok { opacity: .95; }
    #qa-legenda .qa-passo.falhou { opacity: 1; background: rgba(220,50,50,.35); }
    #qa-legenda .qa-icone { width: 14px; flex: none; }
    #qa-legenda .qa-kw { color: #F2B705; font-weight: 700; flex: none; }
    #qa-legenda .qa-erro { font-size: 11.5px; color: #FFB4B4; margin: 2px 0 0 22px; white-space: pre-wrap; }
    #qa-legenda .qa-fala { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.18); }
    #qa-legenda .qa-fala-titulo { font-size: 10.5px; font-weight: 700; letter-spacing: .1em;
      text-transform: uppercase; color: #7FE0A8; margin-bottom: 4px; }
    #qa-legenda .qa-frase { opacity: .6; }
    #qa-legenda .qa-frase:last-child { opacity: 1; font-weight: 600; }
    #qa-legenda .qa-final { margin-top: 8px; font-weight: 700; }
    @media (max-width: 480px) {
      #qa-legenda { right: 8px; bottom: 8px; font-size: 11px; max-height: 45vh; padding: 8px 10px; }
      #qa-legenda .qa-cen { font-size: 12.5px; }
    }
  `;

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  window.__qaLegendaRender = (estado) => {
    if (estado) window.__qaLegendaEstado = estado;
    const s = window.__qaLegendaEstado;
    if (!s || !document.body) return;

    if (!document.getElementById('qa-legenda-css')) {
      const style = el('style');
      style.id = 'qa-legenda-css';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    let caixa = document.getElementById('qa-legenda');
    if (!caixa) {
      caixa = el('div');
      caixa.id = 'qa-legenda';
      caixa.setAttribute('aria-hidden', 'true');
      caixa.setAttribute('inert', '');
      document.body.appendChild(caixa);
    }
    caixa.replaceChildren();

    if (s.funcionalidade) caixa.appendChild(el('div', 'qa-func', 'Funcionalidade: ' + s.funcionalidade));
    caixa.appendChild(el('div', 'qa-cen', 'Cenário: ' + s.cenario));

    const ICONES = { pendente: '○', executando: '▶', ok: '✓', falhou: '✗' };
    for (const p of s.passos) {
      const linha = el('div', 'qa-passo ' + p.estado);
      linha.appendChild(el('span', 'qa-icone', ICONES[p.estado]));
      linha.appendChild(el('span', 'qa-kw', p.palavra));
      linha.appendChild(el('span', null, p.texto));
      caixa.appendChild(linha);
      if (p.erro) caixa.appendChild(el('div', 'qa-erro', p.erro));
    }

    if (s.falas.length) {
      const fala = el('div', 'qa-fala');
      fala.appendChild(el('div', 'qa-fala-titulo', '🔊 Visualizador de fala — NVDA simulado'));
      for (const f of s.falas.slice(-4)) fala.appendChild(el('div', 'qa-frase', f));
      caixa.appendChild(fala);
    }

    if (s.focos && s.focos.length) {
      const painel = el('div', 'qa-fala');
      painel.appendChild(el('div', 'qa-fala-titulo', '⌨ Foco do teclado'));
      for (const f of s.focos.slice(-5)) painel.appendChild(el('div', 'qa-frase', f));
      caixa.appendChild(painel);
    }

    if (s.final) {
      const final = el('div', 'qa-final', s.final);
      final.style.color = s.final.startsWith('✓') ? '#7FE0A8' : '#FF8A8A';
      caixa.appendChild(final);
    }
  };

  const redesenhar = () => window.__qaLegendaRender();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', redesenhar, { once: true });
  } else {
    redesenhar();
  }
}

class Legenda {
  constructor(page) {
    this.page = page;
    this.estado = { funcionalidade: '', cenario: '', passos: [], falas: [], focos: [], final: '' };
  }

  async instalar() {
    await this.page.addInitScript(instalarNoNavegador);
    // Depois de um reload, a caixa é recriada vazia pelo init script; aqui ela
    // volta a mostrar o estado atual do cenário.
    this.page.on('domcontentloaded', () => this.desenhar());
  }

  async desenhar() {
    try {
      await this.page.evaluate((s) => window.__qaLegendaRender?.(s), this.estado);
    } catch {
      // A página pode estar navegando ou já fechada — a próxima atualização redesenha.
    }
  }

  async iniciar(funcionalidade, cenario, passos) {
    this.estado.funcionalidade = funcionalidade;
    this.estado.cenario = cenario;
    this.estado.passos = passos.map((p) => ({ palavra: p.palavra, texto: p.texto, estado: 'pendente' }));
    await this.desenhar();
  }

  async passo(indice, estado, erro) {
    Object.assign(this.estado.passos[indice], { estado, erro: erro || '' });
    await this.desenhar();
  }

  async fala(frase) {
    this.estado.falas.push(frase);
    await this.desenhar();
  }

  // Paradas do foco do teclado (Tab / Shift+Tab), num painel separado das falas.
  async foco(descricao) {
    this.estado.focos.push(descricao);
    await this.desenhar();
  }

  async concluir(sucesso) {
    this.estado.final = sucesso ? '✓ Cenário aprovado' : '✗ Cenário reprovado';
    await this.desenhar();
  }
}

module.exports = { Legenda };
