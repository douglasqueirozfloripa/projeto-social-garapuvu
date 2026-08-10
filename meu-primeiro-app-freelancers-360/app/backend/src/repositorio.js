// repositorio.js — Armazenamento EM MEMÓRIA (sem banco).
// Guardamos usuários, contratos e avaliações em arrays. Fica separado da API
// para facilitar os testes. reset() limpa tudo (usado antes de cada teste).
//
// ---------------------------------------------------------------------------
// POR QUE EXISTEM OS "ÍNDICES" (os Map/Set abaixo)
//
// Buscar com `array.find(...)` percorre a lista inteira: é O(n) — dobrou o
// número de usuários, dobrou o tempo da busca. Pior: quando o item NÃO existe
// (o caso normal do cadastro, que checa "esse e-mail já é usado?"), a varredura
// vai até o fim, sempre.
//
// Um índice é um atalho: um `Map` que leva da CHAVE (e-mail, id) direto ao
// objeto, em tempo constante O(1) — é o mesmo papel que um índice cumpre num
// banco de dados de verdade. Aqui isso importa em dois lugares:
//
//   • buscas por e-mail/id (cadastro, login, criação de projeto);
//   • GET /contratos, que para CADA projeto procurava as candidaturas e as
//     avaliações varrendo as listas inteiras — trabalho N×(C+A), quadrático.
//     Com as listas já agrupadas por projeto, virou O(1) por projeto.
//
// A regra do jogo: os arrays continuam sendo a fonte da verdade (a ordem de
// inserção é o que a API devolve), e todo ponto que ESCREVE precisa manter os
// índices em sincronia — é o preço de ter índice, igual num banco.
// ---------------------------------------------------------------------------

/** @typedef {{id:number,nome:string,email:string,papel:string,endereco:string,telefone:string}} Usuario */
/** @typedef {{id:number,titulo:string,descricao:string,contratanteId:number,freelancerId:number|null,email:string,endereco:string,telefone:string,status:string}} Contrato */
/** @typedef {{id:number,contratoId:number,deId:number,paraId:number,nota:number,comentario:string}} Avaliacao */

let usuarios = [];
let contratos = [];
let avaliacoes = [];
let candidaturas = []; // freelancers inscritos em projetos abertos
let notificacoes = []; // avisos gerados quando a flag notificacao_email está ligada
let seq = 1; // gerador de ids simples

// ---------- Índices (atalhos de busca; sempre derivados dos arrays acima) ----------
let usuarioPorEmail = new Map(); // email → Usuario
let usuarioPorId = new Map(); // id → Usuario
let contratoPorId = new Map(); // id → Contrato
let candidaturasPorContrato = new Map(); // contratoId → Candidatura[]
let candidaturaExiste = new Set(); // "contratoId:freelancerId" (dedup em O(1))
let avaliacoesPorPara = new Map(); // paraId → Avaliacao[]
let avaliacoesPorContrato = new Map(); // contratoId → Avaliacao[]
let notificacoesPorPara = new Map(); // paraId → Notificacao[]

/** Acrescenta um item na lista de uma chave do índice (criando a lista se preciso). */
function indexar(mapa, chave, item) {
  const lista = mapa.get(chave);
  if (lista) lista.push(item);
  else mapa.set(chave, [item]);
}

/** Lista de uma chave do índice — sempre uma CÓPIA, para quem chama não
 *  conseguir alterar o índice por acidente (era o que o `filter` garantia). */
function doIndice(mapa, chave) {
  const lista = mapa.get(chave);
  return lista ? lista.slice() : [];
}

/** Limpa todos os dados (usar em testes). */
export function reset() {
  usuarios = [];
  contratos = [];
  avaliacoes = [];
  candidaturas = [];
  notificacoes = [];
  seq = 1;
  usuarioPorEmail = new Map();
  usuarioPorId = new Map();
  contratoPorId = new Map();
  candidaturasPorContrato = new Map();
  candidaturaExiste = new Set();
  avaliacoesPorPara = new Map();
  avaliacoesPorContrato = new Map();
  notificacoesPorPara = new Map();
}

// ---------- Usuários ----------
/** Cria um usuário (guarda a senha internamente; nunca a exponha nas respostas).
 *  Endereço e telefone são opcionais (usados como contato nos projetos). @returns {Usuario} */
export function criarUsuario({ nome, email, papel, senha, endereco = "", telefone = "" }) {
  const u = { id: seq++, nome, email, papel, senha, endereco, telefone };
  usuarios.push(u);
  usuarioPorEmail.set(email, u);
  usuarioPorId.set(u.id, u);
  return u;
}
/** Busca usuário por id — O(1) pelo índice. @returns {Usuario|undefined} */
export function acharUsuario(id) {
  return usuarioPorId.get(Number(id));
}
/** Busca usuário por e-mail (para garantir e-mail único) — O(1) pelo índice. */
export function acharUsuarioPorEmail(email) {
  return usuarioPorEmail.get(email);
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

/** Atualiza dados editáveis do usuário (nome/endereço/telefone). @returns {Usuario|undefined}
 *  Nada aqui mexe em id nem e-mail, então os índices seguem válidos. */
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
  contratoPorId.set(c.id, c);
  return c;
}
/** Busca contrato por id — O(1) pelo índice. @returns {Contrato|undefined} */
export function acharContrato(id) {
  return contratoPorId.get(Number(id));
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
  const alvo = Number(id);
  if (!contratoPorId.has(alvo)) return false;
  contratoPorId.delete(alvo);
  contratos = contratos.filter((c) => c.id !== alvo);
  return true;
}

// ---------- Candidaturas (freelancer se inscreve num projeto aberto) ----------
/** Chave do índice de duplicidade: um freelancer não se candidata duas vezes. */
function chaveCandidatura(contratoId, freelancerId) {
  return `${Number(contratoId)}:${Number(freelancerId)}`;
}
/** Registra a candidatura de um freelancer a um projeto. @returns {{id:number,contratoId:number,freelancerId:number}} */
export function criarCandidatura({ contratoId, freelancerId }) {
  const cand = { id: seq++, contratoId: Number(contratoId), freelancerId: Number(freelancerId) };
  candidaturas.push(cand);
  indexar(candidaturasPorContrato, cand.contratoId, cand);
  candidaturaExiste.add(chaveCandidatura(cand.contratoId, cand.freelancerId));
  return cand;
}
/** Lista as candidaturas de um projeto — O(1) + tamanho da lista do projeto. */
export function candidaturasDoContrato(contratoId) {
  return doIndice(candidaturasPorContrato, Number(contratoId));
}
/** Diz se um freelancer já se candidatou a este projeto (evita duplicidade) — O(1). */
export function jaCandidatou(contratoId, freelancerId) {
  return candidaturaExiste.has(chaveCandidatura(contratoId, freelancerId));
}
/** Remove a candidatura de um freelancer (retirada pelo próprio ou pelo contratante). @returns {boolean} */
export function removerCandidatura(contratoId, freelancerId) {
  const chave = chaveCandidatura(contratoId, freelancerId);
  if (!candidaturaExiste.has(chave)) return false;
  candidaturaExiste.delete(chave);
  const alvoContrato = Number(contratoId);
  const alvoFreela = Number(freelancerId);
  const mesma = (c) => c.contratoId === alvoContrato && c.freelancerId === alvoFreela;
  candidaturas = candidaturas.filter((c) => !mesma(c));
  const lista = candidaturasPorContrato.get(alvoContrato);
  if (lista) candidaturasPorContrato.set(alvoContrato, lista.filter((c) => !mesma(c)));
  return true;
}

// ---------- Avaliações ----------
/** Cria uma avaliação 360. @returns {Avaliacao} */
export function criarAvaliacao({ contratoId, deId, paraId, nota, comentario }) {
  const a = { id: seq++, contratoId, deId, paraId, nota, comentario: comentario || "" };
  avaliacoes.push(a);
  // Os ids entram no índice normalizados para número (podem chegar como string
  // do corpo da requisição), mas o objeto guardado fica como veio — mudar isso
  // alteraria o JSON que a API devolve.
  indexar(avaliacoesPorPara, Number(paraId), a);
  indexar(avaliacoesPorContrato, Number(contratoId), a);
  return a;
}
/** Retorna as avaliações recebidas por um usuário. @returns {Avaliacao[]} */
export function avaliacoesRecebidas(paraId) {
  return doIndice(avaliacoesPorPara, Number(paraId));
}
/** Verifica se já existe avaliação de 'deId' neste contrato (1 por lado). */
export function jaAvaliou(contratoId, deId) {
  const doContrato = avaliacoesPorContrato.get(Number(contratoId));
  return doContrato ? doContrato.some((a) => Number(a.deId) === Number(deId)) : false;
}
/** Ids de quem já avaliou um contrato (para o front saber quem já deu feedback). */
export function avaliadoresDoContrato(contratoId) {
  const doContrato = avaliacoesPorContrato.get(Number(contratoId));
  return doContrato ? doContrato.map((a) => Number(a.deId)) : [];
}

// ---------- Notificações (geradas pela flag notificacao_email) ----------
/** Registra uma notificação para um usuário. @returns {{id:number,paraId:number,tipo:string,mensagem:string}} */
export function registrarNotificacao({ paraId, tipo, mensagem }) {
  const n = { id: seq++, paraId: Number(paraId), tipo, mensagem, lida: false };
  notificacoes.push(n);
  indexar(notificacoesPorPara, n.paraId, n);
  return n;
}
/** Lista as notificações de um usuário. @returns notificações do destinatário. */
export function notificacoesDe(paraId) {
  return doIndice(notificacoesPorPara, Number(paraId));
}
