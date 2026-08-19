/**
 * CASO 03 — versão corrigida
 * `>=` nas fronteiras + rejeição de entrada negativa/inválida.
 */

function classificarSeveridade(minutosForaDoAr) {
  // `Number.isFinite` já cobre o teste de tipo — a checagem de typeof era redundante.
  if (!Number.isFinite(minutosForaDoAr) || minutosForaDoAr < 0) {
    throw new TypeError('minutosForaDoAr deve ser um número finito >= 0');
  }
  if (minutosForaDoAr >= 240) return 'critica';
  if (minutosForaDoAr >= 60) return 'alta';
  if (minutosForaDoAr > 0) return 'media';
  return 'baixa';
}

module.exports = { classificarSeveridade };
