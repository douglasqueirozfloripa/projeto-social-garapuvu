/**
 * CASO 09 — O código que NÃO existe (o furo que a cobertura nunca vê)
 * -------------------------------------------------------------------
 * Este é o caso mais importante da aula e o mais fácil de esquecer:
 *
 *   Cobertura mede a fração do código ESCRITO que foi executado.
 *   Requisito esquecido = nenhuma linha escrita = nenhuma linha descoberta.
 *   O relatório continua marcando 100%.
 *
 * A regra do projeto diz: "só aceitar inscrição se houver vaga na turma".
 * Essa verificação simplesmente não foi implementada. A cobertura é 100%,
 * o teste unitário é verde, e a turma estoura o limite no dia da aula.
 *
 * Nenhuma ferramenta de cobertura acha isto. Quem acha é revisão de
 * requisitos, teste estático e rastreabilidade requisito -> caso de teste
 * (CTFL 4.0, capítulo 3 e seção 1.4.4).
 */

function inscreverAluno(turma, aluno) {
  if (!aluno.nome) {
    throw new Error('nome é obrigatório');
  }
  // FALTA AQUI: validar turma.vagas antes de inscrever.
  turma.inscritos.push(aluno);
  return turma;
}

module.exports = { inscreverAluno };
