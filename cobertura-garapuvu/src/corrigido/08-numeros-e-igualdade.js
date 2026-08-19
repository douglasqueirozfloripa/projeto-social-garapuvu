/**
 * CASO 08 — versão corrigida (2ª rodada)
 * Dinheiro em centavos (inteiros), comparação estrita e Object.is para NaN.
 *
 * ATENÇÃO — esta função já foi corrigida DUAS vezes, e a segunda só apareceu
 * porque a suíte "robustez" testou um valor que ninguém tinha testado antes.
 *
 * A 1ª correção era `Math.round(d * 100)`. Parece resolver o problema do float,
 * e resolve para 0.1 + 0.2. Mas:
 *
 *     1.005 * 100  ===  100.49999999999999   (não 100.5)
 *     Math.round(100.49999999999999)  ===  100   -> R$ 1,00 em vez de R$ 1,01
 *
 * O erro de representação binária não some ao multiplicar por 100: ele só muda
 * de lugar. Normalizar com `toFixed` antes de arredondar tira o ruído da última
 * casa e faz o arredondamento se comportar como a pessoa espera.
 *
 * Moral da história: "corrigido" é sempre "corrigido até o próximo teste".
 */

/** Converte um valor em reais para centavos inteiros, sem ruído de float. */
function paraCentavos(valor) {
  // toFixed(6) descarta o ruído da 15ª casa decimal antes do arredondamento.
  return Math.round(Number((valor * 100).toFixed(6)));
}

function fecharCaixa(doacoes) {
  if (!Array.isArray(doacoes)) {
    throw new TypeError('doacoes deve ser um array');
  }
  const centavos = doacoes.reduce((acc, d) => {
    if (!Number.isFinite(d)) {
      throw new TypeError(`doação inválida: ${String(d)}`);
    }
    return acc + paraCentavos(d);
  }, 0);
  return centavos / 100;
}

function temCupom(codigo) {
  return typeof codigo === 'string' && codigo.trim() !== '';
}

function ehMesmoValor(a, b) {
  return Object.is(a, b);
}

module.exports = { fecharCaixa, temCupom, ehMesmoValor, paraCentavos };
