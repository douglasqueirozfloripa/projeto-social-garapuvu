/**
 * CASO 03 — Valor limite (o bug que mora na fronteira)
 * ----------------------------------------------------
 * Classifica a severidade de um bug pelo tempo que o sistema ficou fora do ar.
 * Regra combinada com o time:
 *   >= 240 min  -> 'critica'
 *   >= 60 min   -> 'alta'
 *   >  0 min    -> 'media'
 *   0 min       -> 'baixa'
 *
 * O código usa `>` onde deveria usar `>=`. Testar 300, 120 e 10 minutos
 * executa TODAS as linhas e TODOS os ramos — e passa. O defeito só aparece
 * exatamente em 240 e em 60, que é justamente onde a técnica de
 * Análise de Valor Limite (CTFL 4.0, seção 4.2.2) manda testar.
 *
 * Cobertura de linha e de ramo: 100%.  Defeitos escondidos: 3 (duas fronteiras + entrada negativa aceita).
 */

function classificarSeveridade(minutosForaDoAr) {
  if (minutosForaDoAr > 240) return 'critica';
  if (minutosForaDoAr > 60) return 'alta';
  if (minutosForaDoAr > 0) return 'media';
  return 'baixa';
}

module.exports = { classificarSeveridade };
