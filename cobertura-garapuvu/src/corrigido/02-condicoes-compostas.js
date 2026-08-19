/**
 * CASO 02 — versão corrigida
 * O operador certo é `&&` entre idade e autorização; `||` só para o atalho
 * do voluntário já cadastrado. Os testes agora cobrem a tabela-verdade útil.
 */

function podeInscrever(idade, autorizouImagem, jaEhVoluntario) {
  if (jaEhVoluntario === true) {
    return true;
  }
  return idade >= 16 && autorizouImagem === true;
}

module.exports = { podeInscrever };
