/**
 * CASO 02 — Cobertura de DECISÃO ≠ cobertura de CONDIÇÃO (MC/DC)
 * --------------------------------------------------------------
 * Regra de negócio: pode se inscrever no curso quem tem 16 anos ou mais
 * E autorizou o uso de imagem — OU quem já é voluntário cadastrado.
 *
 * O `if` tem 3 condições atômicas. Com 2 testes eu já pinto a linha de verde
 * e ainda passo pelos dois lados da decisão (verdadeiro e falso).
 * Mas nunca provei o efeito INDEPENDENTE de cada condição — e é ali que mora o bug:
 * o operador correto entre idade e autorização é `&&`, não `||`.
 *
 * Cobertura de linha: 100%.  Cobertura de decisão: 100%.  Defeitos escondidos: 1.
 */

function podeInscrever(idade, autorizouImagem, jaEhVoluntario) {
  if (idade >= 16 || autorizouImagem || jaEhVoluntario) {
    return true;
  }
  return false;
}

module.exports = { podeInscrever };
