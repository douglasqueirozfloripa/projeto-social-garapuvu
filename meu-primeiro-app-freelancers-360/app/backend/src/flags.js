// flags.js — Feature flags (chaves de funcionalidade) em memória.
//
// O que é uma feature flag? Um "interruptor" que liga/desliga um comportamento
// SEM precisar de um novo deploy. Serve para lançar aos poucos (canary), ativar
// por ambiente, esconder algo em construção ou ligar o modo de manutenção.
//
// REGRA DE OURO DE TESTE: toda flag precisa ser testada nos DOIS estados —
// LIGADA (comportamento novo) e DESLIGADA (o comportamento antigo continua
// funcionando). Por isso cada flag deste projeto tem um caso ON e um caso OFF.

/** Catálogo das flags e seu estado padrão (o "default" de fábrica). */
const PADRAO = {
  modo_manutencao:    { descricao: "Bloqueia o sistema exibindo aviso de manutenção", ativa: false },
  pagamento_destaque: { descricao: "Habilita a taxa para destacar um projeto na busca", ativa: false },
  avaliacao_anonima:  { descricao: "Oculta o autor da avaliação (feedback anônimo)", ativa: false },
  notificacao_email:  { descricao: "Notifica o contratante quando um freelancer se candidata", ativa: true },
  login_google:       { descricao: "Habilita o login social com conta Google", ativa: false },
  novo_dashboard:     { descricao: "Exibe o novo layout do painel (apenas interface)", ativa: false },
};

/** Estado atual das flags (mutável em runtime via PATCH /flags/:nome). */
let flags = estadoInicial();

/** Monta o estado inicial a partir dos padrões, permitindo sobrescrever por
 *  variável de ambiente (ex.: FLAG_MODO_MANUTENCAO=true). Assim a mesma imagem
 *  do app pode ter flags diferentes por ambiente, sem mudar o código. */
function estadoInicial() {
  const base = {};
  for (const [nome, cfg] of Object.entries(PADRAO)) {
    const env = process.env[`FLAG_${nome.toUpperCase()}`];
    base[nome] = { ...cfg, ativa: env != null ? env === "true" : cfg.ativa };
  }
  return base;
}

/** Restaura as flags ao estado inicial (usado antes de cada teste). */
export function resetFlags() {
  flags = estadoInicial();
}

/** Lista todas as flags com nome, descrição e estado. @returns {{nome:string,descricao:string,ativa:boolean}[]} */
export function listarFlags() {
  return Object.entries(flags).map(([nome, c]) => ({ nome, descricao: c.descricao, ativa: c.ativa }));
}

/** Diz se uma flag está LIGADA. Flag inexistente conta como desligada. */
export function flagAtiva(nome) {
  return !!flags[nome]?.ativa;
}

/** Diz se a flag existe no catálogo. */
export function flagExiste(nome) {
  return Object.prototype.hasOwnProperty.call(flags, nome);
}

/** Liga/desliga uma flag. @returns a flag atualizada, ou undefined se não existir. */
export function definirFlag(nome, ativa) {
  if (!flagExiste(nome)) return undefined;
  flags[nome].ativa = !!ativa;
  return { nome, descricao: flags[nome].descricao, ativa: flags[nome].ativa };
}
