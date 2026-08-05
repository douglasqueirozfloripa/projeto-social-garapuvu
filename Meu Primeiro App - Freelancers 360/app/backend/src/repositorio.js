// repositorio.js — Armazenamento EM MEMÓRIA (sem banco).
// Guardamos usuários, contratos e avaliações em arrays. Fica separado da API
// para facilitar os testes. reset() limpa tudo (usado antes de cada teste).

/** @typedef {{id:number,nome:string,email:string,papel:string,endereco:string,telefone:string}} Usuario */
/** @typedef {{id:number,titulo:string,descricao:string,contratanteId:number,freelancerId:number|null,email:string,endereco:string,telefone:string,status:string}} Contrato */
/** @typedef {{id:number,contratoId:number,deId:number,paraId:number,nota:number,comentario:string}} Avaliacao */

let usuarios = [];
let contratos = [];
let avaliacoes = [];
let candidaturas = []; // freelancers inscritos em projetos abertos
let notificacoes = []; // avisos gerados quando a flag notificacao_email está ligada
let seq = 1; // gerador de ids simples

/** Limpa todos os dados (usar em testes). */
export function reset() {
  usuarios = [];
  contratos = [];
  avaliacoes = [];
  candidaturas = [];
  notificacoes = [];
  seq = 1;
}

// ---------- Usuários ----------
/** Cria um usuário (guarda a senha internamente; nunca a exponha nas respostas).
 *  Endereço e telefone são opcionais (usados como contato nos projetos). @returns {Usuario} */
export function criarUsuario({ nome, email, papel, senha, endereco = "", telefone = "" }) {
  const u = { id: seq++, nome, email, papel, senha, endereco, telefone };
  usuarios.push(u);
  return u;
}
/** Busca usuário por id. @returns {Usuario|undefined} */
export function acharUsuario(id) {
  return usuarios.find((u) => u.id === Number(id));
}
/** Busca usuário por e-mail (para garantir e-mail único). */
export function acharUsuarioPorEmail(email) {
  return usuarios.find((u) => u.email === email);
}
/** Usuários semeados na inicialização do servidor (senha padrão "1234").
 *  Garante que sempre exista um contratante e dois freelancers prontos para login
 *  e para os cenários com dois candidatos disputando a mesma vaga. */
export const USUARIOS_PADRAO = [
  { nome: "Douglas Contratante", email: "dougaq@gmail.com", papel: "contratante", senha: "1234", telefone: "(48) 90000-0000", endereco: "Florianópolis/SC" },
  { nome: "Douglas Freelancer", email: "douglas.queiroz@clinicorp.com", papel: "freelancer", senha: "1234" },
  { nome: "Ana Freelancer", email: "ana.freela@garapuvu.org", papel: "freelancer", senha: "1234" },
];

/** Cria os usuários padrão que ainda não existirem (idempotente por e-mail).
 *  Chamado só no server.js (nunca nos testes, que usam reset()). @returns {Usuario[]} */
export function semearUsuarios() {
  for (const u of USUARIOS_PADRAO) {
    if (!acharUsuarioPorEmail(u.email)) criarUsuario(u);
  }
  return USUARIOS_PADRAO.map((p) => acharUsuarioPorEmail(p.email));
}

/** Atualiza dados editáveis do usuário (nome/endereço/telefone). @returns {Usuario|undefined} */
export function atualizarUsuario(id, campos) {
  const u = acharUsuario(id);
  if (!u) return undefined;
  for (const chave of ["nome", "endereco", "telefone"]) {
    if (campos[chave] !== undefined) u[chave] = campos[chave];
  }
  return u;
}

// ---------- Contratos (projetos) ----------
/** Cria um projeto aberto (status "aberto"). freelancerId é opcional (entra depois).
 *  descricao/email/endereco/telefone são os dados de contato do anúncio. @returns {Contrato} */
export function criarContrato({ titulo, descricao = "", contratanteId, freelancerId = null, email = "", endereco = "", telefone = "" }) {
  // destaque: projeto em destaque na busca. Só é ligado quando a feature flag
  // "pagamento_destaque" está ativa (via PATCH /contratos/:id/destacar).
  const c = { id: seq++, titulo, descricao, contratanteId, freelancerId, email, endereco, telefone, status: "aberto", destaque: false };
  contratos.push(c);
  return c;
}
/** Busca contrato por id. @returns {Contrato|undefined} */
export function acharContrato(id) {
  return contratos.find((c) => c.id === Number(id));
}
/** Lista todos os contratos. @returns {Contrato[]} */
export function listarContratos() {
  return contratos;
}
/** Atualiza os campos editáveis de um projeto (título/descrição/contato).
 *  Ignora campos não enviados. @returns {Contrato|undefined} o contrato atualizado. */
export function atualizarContrato(id, campos) {
  const c = acharContrato(id);
  if (!c) return undefined;
  for (const chave of ["titulo", "descricao", "endereco", "telefone"]) {
    if (campos[chave] !== undefined) c[chave] = campos[chave];
  }
  return c;
}
/** Remove um contrato pelo id. @returns {boolean} true se removeu algo. */
export function removerContrato(id) {
  const antes = contratos.length;
  contratos = contratos.filter((c) => c.id !== Number(id));
  return contratos.length < antes;
}

// ---------- Candidaturas (freelancer se inscreve num projeto aberto) ----------
/** Registra a candidatura de um freelancer a um projeto. @returns {{id:number,contratoId:number,freelancerId:number}} */
export function criarCandidatura({ contratoId, freelancerId }) {
  const cand = { id: seq++, contratoId: Number(contratoId), freelancerId: Number(freelancerId) };
  candidaturas.push(cand);
  return cand;
}
/** Lista as candidaturas de um projeto. */
export function candidaturasDoContrato(contratoId) {
  return candidaturas.filter((c) => c.contratoId === Number(contratoId));
}
/** Diz se um freelancer já se candidatou a este projeto (evita duplicidade). */
export function jaCandidatou(contratoId, freelancerId) {
  return candidaturas.some((c) => c.contratoId === Number(contratoId) && c.freelancerId === Number(freelancerId));
}
/** Remove a candidatura de um freelancer (retirada pelo próprio ou pelo contratante). @returns {boolean} */
export function removerCandidatura(contratoId, freelancerId) {
  const antes = candidaturas.length;
  candidaturas = candidaturas.filter((c) => !(c.contratoId === Number(contratoId) && c.freelancerId === Number(freelancerId)));
  return candidaturas.length < antes;
}

// ---------- Avaliações ----------
/** Cria uma avaliação 360. @returns {Avaliacao} */
export function criarAvaliacao({ contratoId, deId, paraId, nota, comentario }) {
  const a = { id: seq++, contratoId, deId, paraId, nota, comentario: comentario || "" };
  avaliacoes.push(a);
  return a;
}
/** Retorna as avaliações recebidas por um usuário. @returns {Avaliacao[]} */
export function avaliacoesRecebidas(paraId) {
  return avaliacoes.filter((a) => a.paraId === Number(paraId));
}
/** Verifica se já existe avaliação de 'deId' neste contrato (1 por lado). */
export function jaAvaliou(contratoId, deId) {
  return avaliacoes.some((a) => a.contratoId === Number(contratoId) && a.deId === Number(deId));
}
/** Ids de quem já avaliou um contrato (para o front saber quem já deu feedback). */
export function avaliadoresDoContrato(contratoId) {
  return avaliacoes.filter((a) => a.contratoId === Number(contratoId)).map((a) => Number(a.deId));
}

// ---------- Notificações (geradas pela flag notificacao_email) ----------
/** Registra uma notificação para um usuário. @returns {{id:number,paraId:number,tipo:string,mensagem:string}} */
export function registrarNotificacao({ paraId, tipo, mensagem }) {
  const n = { id: seq++, paraId: Number(paraId), tipo, mensagem, lida: false };
  notificacoes.push(n);
  return n;
}
/** Lista as notificações de um usuário. @returns notificações do destinatário. */
export function notificacoesDe(paraId) {
  return notificacoes.filter((n) => n.paraId === Number(paraId));
}
