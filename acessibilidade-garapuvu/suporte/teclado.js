/**
 * Ajudantes de navegação por teclado (Tab / Shift+Tab).
 *
 * Os players do YouTube são iframes: dentro deles, cada Tab passa por um
 * controle do próprio YouTube, mas o foco DA PÁGINA continua no <iframe>.
 * Por isso as paradas repetidas seguidas contam como uma só — é o que a pessoa
 * percebe ("estou no vídeo").
 */

// Descreve o elemento com foco: "tag: nome acessível".
async function focoAtual(page) {
  return page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body || a === document.documentElement) return 'body';
    const nome = a.getAttribute('aria-label') || a.getAttribute('title') || (a.innerText || a.textContent).trim().replace(/\s+/g, ' ');
    return `${a.tagName.toLowerCase()}: ${nome.slice(0, 90)}`;
  });
}

/**
 * Aperta `tecla` repetidamente e devolve as paradas do foco (sem repetições
 * seguidas). Para quando `parar(foco)` for verdadeiro ou no `limite`.
 * Cada parada nova aparece no painel "Foco do teclado" da legenda.
 */
async function navegar(page, legenda, tecla, parar, limite = 150) {
  const paradas = [];
  const simbolo = tecla === 'Tab' ? 'Tab →' : '⇧Tab ←';
  for (let i = 0; i < limite; i++) {
    await page.keyboard.press(tecla);
    const foco = await focoAtual(page);
    if (foco === paradas.at(-1)) continue;
    paradas.push(foco);
    if (legenda) await legenda.foco(`${simbolo} ${foco}`);
    if (parar && parar(foco)) break;
  }
  return paradas;
}

// Uma tecla só, registrando a parada na legenda.
async function apertar(page, legenda, tecla) {
  await page.keyboard.press(tecla);
  await page.waitForTimeout(150);
  const foco = await focoAtual(page);
  if (legenda) await legenda.foco(`${tecla === 'Shift+Tab' ? '⇧Tab ←' : tecla + ' →'} ${foco}`);
  return foco;
}

module.exports = { focoAtual, navegar, apertar };
