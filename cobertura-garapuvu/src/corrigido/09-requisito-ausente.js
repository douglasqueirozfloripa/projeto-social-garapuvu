/**
 * CASO 09 — versão corrigida
 * O requisito que faltava virou código — e, principalmente, virou teste.
 */

class TurmaLotadaError extends Error {
  constructor(turma) {
    super(`Turma "${turma.nome}" já atingiu o limite de ${turma.vagas} vagas`);
    this.name = 'TurmaLotadaError';
  }
}

function inscreverAluno(turma, aluno) {
  if (!aluno || !aluno.nome) {
    throw new Error('nome é obrigatório');
  }
  if (turma.inscritos.length >= turma.vagas) {
    throw new TurmaLotadaError(turma);
  }
  turma.inscritos.push(aluno);
  return turma;
}

module.exports = { inscreverAluno, TurmaLotadaError };
