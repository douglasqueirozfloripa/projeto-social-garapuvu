// app.js — A aplicação Express (API do FreelaAvalia 360).
// Exporta a app SEM chamar listen() — assim os testes usam a app direto,
// sem precisar subir uma porta de rede (integração rápida com Supertest).
import express from "express";
import { validarNota, emailValido, mediaAvaliacoes, podeAvaliar } from "./regras.js";
import * as repo from "./repositorio.js";
import { listarFlags, flagAtiva, definirFlag, flagExiste } from "./flags.js";

/** Remove a senha antes de enviar o usuário na resposta (nunca expor senha).
 *  Exportada para teste unitário (é uma função pura, base da pirâmide). */
export function semSenha(u) {
  if (!u) return u;
  const { senha, ...publico } = u;
  return publico;
}

export function criarApp() {
  const app = express();
  // express.json() GARANTE que req.body é sempre um objeto ({} quando não há
  // corpo JSON). Por isso as rotas desestruturam req.body diretamente, sem o
  // guarda "|| {}" (que seria código morto — nunca alcançável nos testes).
  app.use(express.json());

  // Log detalhado — registra, para TODOS os endpoints, a URL e o corpo da
  // requisição e o corpo da resposta. Interceptamos res.json/res.send para
  // capturar o payload de saída sem alterar cada rota individualmente.
  app.use((req, res, next) => {
    const inicio = Date.now();
    const jsonOriginal = res.json.bind(res);
    const sendOriginal = res.send.bind(res);
    let corpoResposta;

    res.json = (corpo) => {
      corpoResposta = corpo;
      return jsonOriginal(corpo);
    };
    res.send = (corpo) => {
      corpoResposta = corpo;
      return sendOriginal(corpo);
    };

    res.on("finish", () => {
      const ms = Date.now() - inicio;
      console.log(
        `[API] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)\n` +
          `  request.url:  ${req.originalUrl}\n` +
          `  request.body: ${JSON.stringify(req.body)}\n` +
          `  response.body: ${
            corpoResposta === undefined ? "(sem corpo)" : JSON.stringify(corpoResposta)
          }`
      );
    });

    next();
  });

  // CORS — permite que o frontend (ex.: http://localhost:5173) chame esta API.
  // Sem isto, o navegador bloqueia a requisição ("No 'Access-Control-Allow-Origin'").
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204); // resposta ao preflight
    next();
  });

  // ---------- FEATURE FLAGS ----------
  // Rotas sempre liberadas, mesmo em manutenção (para conseguir desligar a flag).
  const SEMPRE_LIBERADO = new Set(["/health", "/flags"]);

  /** GET /health — sonda simples (usada em smoke test e monitoramento). */
  app.get("/health", (_req, res) => res.json({ ok: true }));

  /** GET /flags — lista as feature flags e seus estados (nome, descrição, ativa). */
  app.get("/flags", (_req, res) => res.json(listarFlags()));

  /** PATCH /flags/:nome — liga/desliga uma flag. Body: { ativa: boolean }. */
  app.patch("/flags/:nome", (req, res) => {
    const { nome } = req.params;
    if (!flagExiste(nome)) return res.status(404).json({ erro: "feature flag não encontrada" });
    if (typeof req.body.ativa !== "boolean") return res.status(400).json({ erro: "campo 'ativa' deve ser true ou false" });
    return res.json(definirFlag(nome, req.body.ativa));
  });

  // Middleware do MODO DE MANUTENÇÃO: quando a flag está ligada, todas as rotas
  // (menos /health e /flags) respondem 503. Exemplo clássico de flag "global".
  app.use((req, res, next) => {
    const rotaBase = "/" + (req.path.split("/")[1] || "");
    if (flagAtiva("modo_manutencao") && !SEMPRE_LIBERADO.has(rotaBase)) {
      return res.status(503).json({ erro: "Sistema em manutenção. Tente novamente em instantes.", manutencao: true });
    }
    next();
  });

  /** POST /usuarios — cadastro (e-mail único e válido; papel válido; senha >= 4). */
  app.post("/usuarios", (req, res) => {
    const { nome, email, papel, senha, endereco, telefone } = req.body;
    if (!nome || !emailValido(email)) return res.status(400).json({ erro: "nome ou e-mail inválido" });
    if (!["freelancer", "contratante"].includes(papel)) return res.status(400).json({ erro: "papel inválido" });
    if (typeof senha !== "string" || senha.length < 4) return res.status(400).json({ erro: "senha deve ter ao menos 4 caracteres" });
    if (repo.acharUsuarioPorEmail(email)) return res.status(400).json({ erro: "e-mail já cadastrado" });
    return res.status(201).json(semSenha(repo.criarUsuario({ nome, email, papel, senha, endereco, telefone })));
  });

  /** POST /login — autentica por e-mail e senha; retorna o usuário (sem senha). */
  app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    // Performance: rejeita entrada malformada antes de consultar o repositório —
    // economiza a busca quando o e-mail nem tem formato válido ou a senha veio vazia.
    if (!emailValido(email) || !senha) return res.status(400).json({ erro: "e-mail ou senha inválidos" });

    const u = repo.acharUsuarioPorEmail(email);
    if (!u || u.senha !== senha) return res.status(401).json({ erro: "e-mail ou senha inválidos" });
    return res.json(semSenha(u));
  });

  /** POST /login/google — login social. Só funciona com a flag login_google
   *  LIGADA (senão 403). Autentica pelo e-mail da conta Google já vinculada. */
  app.post("/login/google", (req, res) => {
    if (!flagAtiva("login_google")) return res.status(403).json({ erro: "login com Google indisponível" });
    const { email } = req.body;
    if (!emailValido(email)) return res.status(400).json({ erro: "e-mail do Google inválido" });
    const u = repo.acharUsuarioPorEmail(email);
    if (!u) return res.status(404).json({ erro: "conta Google não vinculada a um usuário" });
    return res.json(semSenha(u));
  });

  /** POST /logout — encerra a sessão do usuário. A autenticação é STATELESS
   *  (a "sessão" vive no localStorage do cliente), então o servidor apenas
   *  confirma o logout de um usuário conhecido. Mantido como contrato de API
   *  para evoluções futuras (ex.: invalidar token/refresh no servidor). */
  app.post("/logout", (req, res) => {
    const { id } = req.body;
    if (id === undefined || id === null || id === "") return res.status(400).json({ erro: "id do usuário é obrigatório" });
    if (!repo.acharUsuario(id)) return res.status(404).json({ erro: "usuário não encontrado" });
    return res.json({ ok: true, mensagem: "sessão encerrada" });
  });

  /** GET /usuarios/:id — usuário + média das avaliações recebidas. */
  app.get("/usuarios/:id", (req, res) => {
    const u = repo.acharUsuario(req.params.id);
    if (!u) return res.status(404).json({ erro: "usuário não encontrado" });
    const notas = repo.avaliacoesRecebidas(u.id).map((a) => a.nota);
    return res.json({ ...semSenha(u), media: mediaAvaliacoes(notas), totalAvaliacoes: notas.length });
  });

  /** PATCH /usuarios/:id — edita o próprio perfil (nome/endereço/telefone). */
  app.patch("/usuarios/:id", (req, res) => {
    const { nome } = req.body;
    if (nome !== undefined && !nome) return res.status(400).json({ erro: "nome não pode ficar vazio" });
    const u = repo.atualizarUsuario(req.params.id, req.body);
    if (!u) return res.status(404).json({ erro: "usuário não encontrado" });
    return res.json(semSenha(u));
  });

  /** POST /contratos — cria um PROJETO ABERTO publicado por um contratante.
   *  freelancerId é opcional (o freelancer entra depois). Os dados de contato
   *  (e-mail/endereço/telefone) vêm do corpo e, se ausentes, do perfil do contratante. */
  app.post("/contratos", (req, res) => {
    const { titulo, descricao, contratanteId, freelancerId, endereco, telefone } = req.body;
    const contratante = repo.acharUsuario(contratanteId);
    if (!titulo || !contratante) return res.status(400).json({ erro: "título e contratante são obrigatórios" });
    // freelancer é opcional; se informado, precisa existir
    if (freelancerId != null && freelancerId !== "" && !repo.acharUsuario(freelancerId))
      return res.status(400).json({ erro: "freelancer informado não existe" });
    return res.status(201).json(repo.criarContrato({
      titulo,
      descricao,
      contratanteId,
      freelancerId: freelancerId != null && freelancerId !== "" ? freelancerId : null,
      email: contratante.email,
      endereco: endereco ?? contratante.endereco,
      telefone: telefone ?? contratante.telefone,
    }));
  });

  /** GET /contratos — lista todos os projetos, já com os ids de quem se
   *  candidatou e de quem já deu feedback (o front usa para montar os botões). */
  app.get("/contratos", (_req, res) => {
    const lista = repo.listarContratos().map((c) => ({
      ...c,
      candidatos: repo.candidaturasDoContrato(c.id).map((cand) => cand.freelancerId),
      avaliadores: repo.avaliadoresDoContrato(c.id),
    }));
    return res.json(lista);
  });

  /** POST /contratos/:id/candidaturas — um FREELANCER se inscreve num projeto aberto. */
  app.post("/contratos/:id/candidaturas", (req, res) => {
    const { freelancerId } = req.body;
    const contrato = repo.acharContrato(req.params.id);
    if (!contrato) return res.status(404).json({ erro: "projeto não encontrado" });
    if (contrato.status !== "aberto") return res.status(400).json({ erro: "projeto não está aberto a candidaturas" });
    const freela = repo.acharUsuario(freelancerId);
    if (!freela || freela.papel !== "freelancer") return res.status(400).json({ erro: "candidato precisa ser um freelancer" });
    if (repo.jaCandidatou(contrato.id, freelancerId)) return res.status(400).json({ erro: "você já se candidatou a este projeto" });
    const candidatura = repo.criarCandidatura({ contratoId: contrato.id, freelancerId });
    // Flag notificacao_email LIGADA: avisa o contratante da nova candidatura.
    if (flagAtiva("notificacao_email")) {
      repo.registrarNotificacao({
        paraId: contrato.contratanteId,
        tipo: "candidatura",
        mensagem: `${freela.nome} se candidatou ao projeto "${contrato.titulo}".`,
      });
    }
    return res.status(201).json(candidatura);
  });

  /** GET /notificacoes/:usuarioId — notificações recebidas (geradas pela flag). */
  app.get("/notificacoes/:usuarioId", (req, res) => res.json(repo.notificacoesDe(req.params.usuarioId)));

  /** PATCH /contratos/:id/destacar — marca um projeto como destaque na busca.
   *  Só funciona com a flag pagamento_destaque LIGADA (senão 403). */
  app.patch("/contratos/:id/destacar", (req, res) => {
    if (!flagAtiva("pagamento_destaque")) return res.status(403).json({ erro: "recurso de destaque indisponível" });
    const c = repo.acharContrato(req.params.id);
    if (!c) return res.status(404).json({ erro: "projeto não encontrado" });
    c.destaque = true;
    return res.json(c);
  });

  /** GET /contratos/:id/candidaturas — lista os candidatos com nome e reputação (média 360). */
  app.get("/contratos/:id/candidaturas", (req, res) => {
    const contrato = repo.acharContrato(req.params.id);
    if (!contrato) return res.status(404).json({ erro: "projeto não encontrado" });
    const candidatos = repo.candidaturasDoContrato(contrato.id).map((cand) => {
      const u = repo.acharUsuario(cand.freelancerId);
      const notas = repo.avaliacoesRecebidas(cand.freelancerId).map((a) => a.nota);
      return { freelancerId: cand.freelancerId, nome: u?.nome || "(desconhecido)", media: mediaAvaliacoes(notas), totalAvaliacoes: notas.length };
    });
    return res.json(candidatos);
  });

  /** PATCH /contratos/:id/selecionar — contratante escolhe um candidato → "em_aprovacao". */
  app.patch("/contratos/:id/selecionar", (req, res) => {
    const { freelancerId } = req.body;
    const contrato = repo.acharContrato(req.params.id);
    if (!contrato) return res.status(404).json({ erro: "projeto não encontrado" });
    if (contrato.status !== "aberto") return res.status(400).json({ erro: "só é possível selecionar em projeto aberto" });
    if (!repo.jaCandidatou(contrato.id, freelancerId)) return res.status(400).json({ erro: "esse freelancer não se candidatou" });
    contrato.freelancerId = Number(freelancerId);
    contrato.status = "em_aprovacao";
    return res.json(contrato);
  });

  /** PATCH /contratos/:id/andamento — contratante confirma o acordo (fechado via WhatsApp) → "em_andamento". */
  app.patch("/contratos/:id/andamento", (req, res) => {
    const contrato = repo.acharContrato(req.params.id);
    if (!contrato) return res.status(404).json({ erro: "projeto não encontrado" });
    if (contrato.status !== "em_aprovacao") return res.status(400).json({ erro: "selecione um freelancer antes de iniciar o trabalho" });
    contrato.status = "em_andamento";
    return res.json(contrato);
  });

  /** PATCH /contratos/:id — edita título/descrição/contato de um projeto. */
  app.patch("/contratos/:id", (req, res) => {
    const { titulo } = req.body;
    if (titulo !== undefined && !titulo) return res.status(400).json({ erro: "título não pode ficar vazio" });
    const c = repo.atualizarContrato(req.params.id, req.body);
    if (!c) return res.status(404).json({ erro: "contrato não encontrado" });
    return res.json(c);
  });

  /** DELETE /contratos/:id/candidaturas/:freelancerId — retira uma candidatura
   *  (pelo próprio freelancer ou pelo contratante). */
  app.delete("/contratos/:id/candidaturas/:freelancerId", (req, res) => {
    const c = repo.acharContrato(req.params.id);
    if (!c) return res.status(404).json({ erro: "projeto não encontrado" });
    if (!repo.removerCandidatura(c.id, req.params.freelancerId)) return res.status(404).json({ erro: "candidatura não encontrada" });
    return res.sendStatus(204);
  });

  /** DELETE /contratos/:id — exclui um projeto. Regras:
   *  - projeto CONCLUÍDO nunca pode ser excluído;
   *  - só projetos PUBLICADOS (aberto) podem ser excluídos pelo contratante;
   *  - se houver candidatos inscritos, é preciso removê-los antes. */
  app.delete("/contratos/:id", (req, res) => {
    const c = repo.acharContrato(req.params.id);
    if (!c) return res.status(404).json({ erro: "projeto não encontrado" });
    if (c.status === "concluido") return res.status(400).json({ erro: "projeto concluído não pode ser excluído" });
    if (c.status !== "aberto") return res.status(400).json({ erro: "apenas projetos publicados podem ser excluídos" });
    if (repo.candidaturasDoContrato(c.id).length > 0) return res.status(400).json({ erro: "remova os candidatos inscritos antes de excluir o projeto" });
    repo.removerContrato(c.id);
    return res.sendStatus(204);
  });

  /** PATCH /contratos/:id/concluir — contratante encerra o projeto → "concluido".
   *  Só a partir de "em_andamento" (o trabalho precisa ter começado). */
  app.patch("/contratos/:id/concluir", (req, res) => {
    const c = repo.acharContrato(req.params.id);
    if (!c) return res.status(404).json({ erro: "contrato não encontrado" });
    if (c.status !== "em_andamento") return res.status(400).json({ erro: "só é possível concluir um projeto em andamento" });
    c.status = "concluido";
    return res.json(c);
  });

  /** POST /avaliacoes — avaliação 360 (só se concluído; nota 1-5; 1 por lado). */
  app.post("/avaliacoes", (req, res) => {
    const { contratoId, deId, paraId, nota, comentario } = req.body;
    const contrato = repo.acharContrato(contratoId);
    if (!contrato) return res.status(404).json({ erro: "contrato não encontrado" });
    if (!podeAvaliar(contrato)) return res.status(400).json({ erro: "só é possível avaliar contrato concluído" });
    if (!validarNota(nota)) return res.status(400).json({ erro: "nota deve ser inteiro de 1 a 5" });
    const envolvidos = [contrato.contratanteId, contrato.freelancerId];
    if (!envolvidos.includes(Number(deId)) || !envolvidos.includes(Number(paraId)))
      return res.status(400).json({ erro: "avaliador e avaliado devem ser as partes do contrato" });
    if (repo.jaAvaliou(contratoId, deId)) return res.status(400).json({ erro: "você já avaliou este contrato" });
    return res.status(201).json(repo.criarAvaliacao({ contratoId, deId, paraId, nota, comentario }));
  });

  /** GET /avaliacoes/usuario/:id — avaliações recebidas por um usuário.
   *  Flag avaliacao_anonima LIGADA: oculta quem avaliou (deId vira null e
   *  marca anonimo: true), preservando a nota e o comentário. */
  app.get("/avaliacoes/usuario/:id", (req, res) => {
    const recebidas = repo.avaliacoesRecebidas(req.params.id);
    if (!flagAtiva("avaliacao_anonima")) return res.json(recebidas);
    return res.json(recebidas.map((a) => ({ ...a, deId: null, anonimo: true })));
  });

  return app;
}
