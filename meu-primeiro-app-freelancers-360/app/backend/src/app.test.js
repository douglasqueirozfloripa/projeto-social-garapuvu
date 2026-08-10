// Testes de INTEGRAÇÃO da API (meio da pirâmide) com Vitest + Supertest.
// Usam a app direto (sem subir porta). reset() limpa os dados antes de cada teste.
// TAG: @integracao  → grep: grep -rl "@integracao" backend/  |  rodar: vitest -t "@integracao"
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { criarApp, semSenha } from "./app.js";
import { reset, criarCandidatura } from "./repositorio.js";
import { resetFlags } from "./flags.js";

const app = criarApp();
beforeEach(() => { reset(); resetFlags(); });

async function criarUsuario(papel, email) {
  const r = await request(app).post("/usuarios").send({ nome: "Fulano", email, papel, senha: "1234" });
  return r.body;
}

describe("@integracao Usuários e login", () => {
  it("cria usuário válido (201) e não retorna a senha", async () => {
    const r = await request(app).post("/usuarios").send({ nome: "Ana", email: "ana@x.com", papel: "freelancer", senha: "1234" });
    expect(r.status).toBe(201);
    expect(r.body.id).toBeDefined();
    expect(r.body.senha).toBeUndefined();
  });
  it("rejeita e-mail duplicado (400)", async () => {
    await criarUsuario("freelancer", "dup@x.com");
    const r = await request(app).post("/usuarios").send({ nome: "Outro", email: "dup@x.com", papel: "contratante", senha: "1234" });
    expect(r.status).toBe(400);
  });
  it("rejeita papel inválido (400)", async () => {
    const r = await request(app).post("/usuarios").send({ nome: "X", email: "x@x.com", papel: "admin", senha: "1234" });
    expect(r.status).toBe(400);
  });
  it("rejeita senha curta (400)", async () => {
    const r = await request(app).post("/usuarios").send({ nome: "X", email: "y@x.com", papel: "freelancer", senha: "12" });
    expect(r.status).toBe(400);
  });
  it("edita o próprio perfil (nome/endereço/telefone) e valida nome vazio", async () => {
    const u = await request(app).post("/usuarios")
      .send({ nome: "Zé", email: "perfil@x.com", papel: "contratante", senha: "1234" });
    const r = await request(app).patch(`/usuarios/${u.body.id}`)
      .send({ endereco: "Palhoça/SC", telefone: "(48) 97777-7777" });
    expect(r.status).toBe(200);
    expect(r.body.endereco).toBe("Palhoça/SC");
    expect(r.body.telefone).toBe("(48) 97777-7777");
    expect(r.body.senha).toBeUndefined();
    const vazio = await request(app).patch(`/usuarios/${u.body.id}`).send({ nome: "" });
    expect(vazio.status).toBe(400);
    const inexistente = await request(app).patch(`/usuarios/9999`).send({ telefone: "x" });
    expect(inexistente.status).toBe(404);
  });

  it("faz login com credenciais corretas e recusa as erradas", async () => {
    await criarUsuario("contratante", "log@x.com");
    const ok = await request(app).post("/login").send({ email: "log@x.com", senha: "1234" });
    expect(ok.status).toBe(200);
    expect(ok.body.senha).toBeUndefined();
    const bad = await request(app).post("/login").send({ email: "log@x.com", senha: "errada" });
    expect(bad.status).toBe(401);
  });

  it("recusa login de e-mail inexistente (401) sem vazar se o e-mail existe", async () => {
    const r = await request(app).post("/login").send({ email: "ninguem@x.com", senha: "1234" });
    expect(r.status).toBe(401);
    expect(r.body.erro).toBe("e-mail ou senha inválidos"); // mesma mensagem de senha errada
    expect(r.body.senha).toBeUndefined();
  });

  it("retorna 404 ao buscar usuário inexistente e traz média/total ao buscar um válido", async () => {
    const inexistente = await request(app).get("/usuarios/9999");
    expect(inexistente.status).toBe(404);

    const u = await criarUsuario("freelancer", "perfilget@x.com");
    const ok = await request(app).get(`/usuarios/${u.id}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ id: u.id, media: 0, totalAvaliacoes: 0 });
    expect(ok.body.senha).toBeUndefined(); // nunca expor a senha
  });
});

describe("@integracao Logout", () => {
  it("confirma o logout de um usuário conhecido (200 { ok: true })", async () => {
    const u = await criarUsuario("freelancer", "sai@x.com");
    const r = await request(app).post("/logout").send({ id: u.id });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true });
  });

  it("rejeita logout sem id (400)", async () => {
    const semId = await request(app).post("/logout").send({});
    expect(semId.status).toBe(400);
    const vazio = await request(app).post("/logout").send({ id: "" });
    expect(vazio.status).toBe(400);
  });

  it("retorna 404 ao deslogar um usuário inexistente", async () => {
    const r = await request(app).post("/logout").send({ id: 9999 });
    expect(r.status).toBe(404);
  });
});

describe("@integracao CRUD de projetos", () => {
  it("cria projeto ABERTO sem freelancer e usa o contato do perfil do contratante", async () => {
    const c = await request(app).post("/usuarios")
      .send({ nome: "Contra", email: "dono@x.com", papel: "contratante", senha: "1234", endereco: "Floripa/SC", telefone: "(48) 90000-0000" });
    const r = await request(app).post("/contratos")
      .send({ titulo: "Landing page", descricao: "Site de uma página", contratanteId: c.body.id });
    expect(r.status).toBe(201);
    expect(r.body.freelancerId).toBeNull();
    expect(r.body.descricao).toBe("Site de uma página");
    expect(r.body.email).toBe("dono@x.com");     // puxado do perfil
    expect(r.body.endereco).toBe("Floripa/SC");
    expect(r.body.telefone).toBe("(48) 90000-0000");
  });

  it("permite sobrescrever endereço/telefone só naquele projeto", async () => {
    const c = await criarUsuario("contratante", "dono2@x.com");
    const r = await request(app).post("/contratos")
      .send({ titulo: "App", contratanteId: c.id, endereco: "Rua B, 10", telefone: "(11) 91111-1111" });
    expect(r.body.endereco).toBe("Rua B, 10");
    expect(r.body.telefone).toBe("(11) 91111-1111");
  });

  it("rejeita projeto sem título ou sem contratante válido (400)", async () => {
    const semTitulo = await request(app).post("/contratos").send({ contratanteId: 999 });
    expect(semTitulo.status).toBe(400);
    const semDono = await request(app).post("/contratos").send({ titulo: "X", contratanteId: 999 });
    expect(semDono.status).toBe(400);
  });

  it("edita (PATCH) título/descrição/contato do projeto", async () => {
    const c = await criarUsuario("contratante", "edit@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Velho", contratanteId: c.id })).body;
    const r = await request(app).patch(`/contratos/${proj.id}`)
      .send({ titulo: "Novo", descricao: "atualizada", telefone: "(48) 98888-8888" });
    expect(r.status).toBe(200);
    expect(r.body.titulo).toBe("Novo");
    expect(r.body.descricao).toBe("atualizada");
    expect(r.body.telefone).toBe("(48) 98888-8888");
  });

  it("não deixa esvaziar o título na edição (400) e 404 em projeto inexistente", async () => {
    const c = await criarUsuario("contratante", "edit2@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Tem título", contratanteId: c.id })).body;
    const vazio = await request(app).patch(`/contratos/${proj.id}`).send({ titulo: "" });
    expect(vazio.status).toBe(400);
    const inexistente = await request(app).patch(`/contratos/9999`).send({ titulo: "x" });
    expect(inexistente.status).toBe(404);
  });

  it("exclui (DELETE) um projeto publicado sem candidatos e some da listagem", async () => {
    const c = await criarUsuario("contratante", "del@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Some depois", contratanteId: c.id })).body;
    const del = await request(app).delete(`/contratos/${proj.id}`);
    expect(del.status).toBe(204);
    const lista = await request(app).get("/contratos");
    expect(lista.body.find((p) => p.id === proj.id)).toBeUndefined();
    const denovo = await request(app).delete(`/contratos/${proj.id}`);
    expect(denovo.status).toBe(404);
  });

  it("não exclui projeto com candidatos; permite após removê-los", async () => {
    const c = await criarUsuario("contratante", "delc@x.com");
    const f = await criarUsuario("freelancer", "delf@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Com candidato", contratanteId: c.id })).body;
    await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: f.id });

    // com candidato inscrito → 400
    const bloqueado = await request(app).delete(`/contratos/${proj.id}`);
    expect(bloqueado.status).toBe(400);

    // remove a candidatura (pode ser o freelancer ou o contratante) → 204
    const removeu = await request(app).delete(`/contratos/${proj.id}/candidaturas/${f.id}`);
    expect(removeu.status).toBe(204);

    // agora exclui
    const del = await request(app).delete(`/contratos/${proj.id}`);
    expect(del.status).toBe(204);
  });

  it("nunca exclui projeto concluído (nem em aprovação/andamento)", async () => {
    const c = await criarUsuario("contratante", "delcc@x.com");
    const f = await criarUsuario("freelancer", "delff@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "Não apaga" });

    // em andamento → não pode excluir
    expect((await request(app).delete(`/contratos/${proj.id}`)).status).toBe(400);

    // conclui e tenta excluir → não pode
    await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: f.id, paraId: c.id, nota: 5 });
    await request(app).patch(`/contratos/${proj.id}/concluir`);
    expect((await request(app).delete(`/contratos/${proj.id}`)).status).toBe(400);
  });
});

// Leva um projeto do "aberto" até "em_andamento" passando por candidatura → seleção → acordo.
async function levarAteAndamento({ contratante, freela, titulo }) {
  const proj = (await request(app).post("/contratos").send({ titulo, contratanteId: contratante.id })).body;
  await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: freela.id });
  await request(app).patch(`/contratos/${proj.id}/selecionar`).send({ freelancerId: freela.id });
  await request(app).patch(`/contratos/${proj.id}/andamento`);
  return proj;
}

describe("@integracao Fluxo de recrutamento (candidatura → seleção → andamento)", () => {
  it("freelancer se candidata, contratante vê candidatos com a reputação e seleciona", async () => {
    const contratante = await criarUsuario("contratante", "rec@x.com");
    const f1 = await criarUsuario("freelancer", "f1@x.com");
    const f2 = await criarUsuario("freelancer", "f2@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Logo", contratanteId: contratante.id })).body;

    // os dois freelancers se candidatam
    expect((await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: f1.id })).status).toBe(201);
    expect((await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: f2.id })).status).toBe(201);
    // não pode candidatar duas vezes
    expect((await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: f1.id })).status).toBe(400);
    // contratante não pode se candidatar (não é freelancer)
    expect((await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: contratante.id })).status).toBe(400);

    // lista de candidatos vem com nome e média
    const candidatos = (await request(app).get(`/contratos/${proj.id}/candidaturas`)).body;
    expect(candidatos).toHaveLength(2);
    expect(candidatos[0]).toMatchObject({ freelancerId: f1.id, media: 0, totalAvaliacoes: 0 });

    // só dá pra selecionar quem se candidatou
    expect((await request(app).patch(`/contratos/${proj.id}/selecionar`).send({ freelancerId: 999 })).status).toBe(400);
    const sel = await request(app).patch(`/contratos/${proj.id}/selecionar`).send({ freelancerId: f2.id });
    expect(sel.status).toBe(200);
    expect(sel.body.status).toBe("em_aprovacao");
    expect(sel.body.freelancerId).toBe(f2.id);
  });

  it("GET /contratos traz cada projeto com os ids de candidatos e avaliadores", async () => {
    const c = await criarUsuario("contratante", "listagem@x.com");
    const f = await criarUsuario("freelancer", "listaf@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "Com dados" });
    await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: f.id, paraId: c.id, nota: 5 });

    const lista = (await request(app).get("/contratos")).body;
    const alvo = lista.find((p) => p.id === proj.id);
    expect(alvo.candidatos).toContain(f.id);   // candidatou-se
    expect(alvo.avaliadores).toContain(f.id);  // já avaliou
  });

  it("respeita a ordem dos status (não inicia sem selecionar, não conclui sem andamento)", async () => {
    const contratante = await criarUsuario("contratante", "ord@x.com");
    const freela = await criarUsuario("freelancer", "ordf@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "X", contratanteId: contratante.id })).body;

    // não dá pra ir a andamento sem selecionar
    expect((await request(app).patch(`/contratos/${proj.id}/andamento`)).status).toBe(400);
    // não dá pra concluir um projeto aberto
    expect((await request(app).patch(`/contratos/${proj.id}/concluir`)).status).toBe(400);

    await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: freela.id });
    await request(app).patch(`/contratos/${proj.id}/selecionar`).send({ freelancerId: freela.id });
    const and = await request(app).patch(`/contratos/${proj.id}/andamento`);
    expect(and.body.status).toBe("em_andamento");
  });
});

describe("@integracao Fluxo de avaliação 360", () => {
  it("não deixa avaliar antes do trabalho começar (400) e calcula a média depois", async () => {
    const contratante = await criarUsuario("contratante", "c@x.com");
    const freela = await criarUsuario("freelancer", "f@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Logo", contratanteId: contratante.id })).body;
    await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: freela.id });

    // tentar avaliar antes do andamento -> 400
    const cedo = await request(app).post("/avaliacoes")
      .send({ contratoId: proj.id, deId: contratante.id, paraId: freela.id, nota: 5 });
    expect(cedo.status).toBe(400);

    // seleciona e inicia o trabalho
    await request(app).patch(`/contratos/${proj.id}/selecionar`).send({ freelancerId: freela.id });
    await request(app).patch(`/contratos/${proj.id}/andamento`);

    // freelancer finaliza dando feedback ao contratante; contratante conclui e avalia o freelancer
    const a2 = await request(app).post("/avaliacoes")
      .send({ contratoId: proj.id, deId: freela.id, paraId: contratante.id, nota: 4 });
    const a1 = await request(app).post("/avaliacoes")
      .send({ contratoId: proj.id, deId: contratante.id, paraId: freela.id, nota: 5, comentario: "ótimo" });
    expect(a1.status).toBe(201);
    expect(a2.status).toBe(201);
    const fim = await request(app).patch(`/contratos/${proj.id}/concluir`);
    expect(fim.body.status).toBe("concluido");

    // média do freelancer = 5.0
    const perfil = await request(app).get(`/usuarios/${freela.id}`);
    expect(perfil.body.media).toBe(5);
    expect(perfil.body.totalAvaliacoes).toBe(1);
  });

  it("impede avaliar o mesmo contrato duas vezes pelo mesmo lado (400)", async () => {
    const c = await criarUsuario("contratante", "c2@x.com");
    const f = await criarUsuario("freelancer", "fdup@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "Site" });
    await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: c.id, paraId: f.id, nota: 5 });
    const dupe = await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: c.id, paraId: f.id, nota: 3 });
    expect(dupe.status).toBe(400);
  });

  it("rejeita nota fora de 1-5 (400)", async () => {
    const c = await criarUsuario("contratante", "c3@x.com");
    const f = await criarUsuario("freelancer", "f3@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "App" });
    const r = await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: c.id, paraId: f.id, nota: 9 });
    expect(r.status).toBe(400);
  });

  it("rejeita avaliação para alguém que não é parte do contrato (400)", async () => {
    const c = await criarUsuario("contratante", "c4@x.com");
    const f = await criarUsuario("freelancer", "f4@x.com");
    const estranho = await criarUsuario("freelancer", "estranho@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "X" });
    const r = await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: c.id, paraId: estranho.id, nota: 5 });
    expect(r.status).toBe(400); // paraId não é uma das partes
  });
});

// ---------------------------------------------------------------------------
// BORDAS E EXCEÇÕES: caminhos defensivos da API (corpo ausente, ids
// inexistentes, valores-limite). Garantem que a API não quebra com entradas
// ruins — e fecham a cobertura de branches (100%).
// ---------------------------------------------------------------------------
describe("@unitario semSenha (função pura)", () => {
  it("remove a senha de um usuário e devolve valores falsy inalterados", () => {
    expect(semSenha({ id: 1, nome: "Ana", senha: "1234" })).toEqual({ id: 1, nome: "Ana" });
    expect(semSenha(null)).toBeNull();          // branch defensivo !u
    expect(semSenha(undefined)).toBeUndefined();
  });
});

describe("@integracao Bordas e exceções", () => {
  it("aceita requisições SEM corpo sem quebrar (express.json garante req.body = {})", async () => {
    expect((await request(app).post("/usuarios")).status).toBe(400);
    expect((await request(app).post("/login")).status).toBe(400); // sem corpo → falha na validação antes de consultar o repositório
    expect((await request(app).post("/logout")).status).toBe(400);
    expect((await request(app).post("/contratos")).status).toBe(400);
    expect((await request(app).post("/avaliacoes")).status).toBe(404); // sem contratoId → contrato não encontrado
  });

  it("candidatura em projeto NÃO aberto → 400", async () => {
    const c = await criarUsuario("contratante", "candfech@x.com");
    const f = await criarUsuario("freelancer", "candfechf@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "Fechado" });
    const nova = await criarUsuario("freelancer", "tarde@x.com");
    const r = await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: nova.id });
    expect(r.status).toBe(400); // projeto não está aberto a candidaturas
  });

  it("rejeita cadastro com nome válido mas e-mail inválido (400)", async () => {
    const r = await request(app).post("/usuarios").send({ nome: "Tem nome", email: "sem-arroba", papel: "freelancer", senha: "1234" });
    expect(r.status).toBe(400);
  });

  it("cria projeto COM freelancerId válido e rejeita freelancerId inexistente", async () => {
    const c = await criarUsuario("contratante", "cf@x.com");
    const f = await criarUsuario("freelancer", "ff@x.com");
    const ok = await request(app).post("/contratos").send({ titulo: "Com freela", contratanteId: c.id, freelancerId: f.id });
    expect(ok.status).toBe(201);
    expect(ok.body.freelancerId).toBe(f.id);   // ternário do freelancerId (ramo verdadeiro)
    const ruim = await request(app).post("/contratos").send({ titulo: "X", contratanteId: c.id, freelancerId: 9999 });
    expect(ruim.status).toBe(400);              // freelancer informado não existe
  });

  it("usa fallback vazio de endereço/telefone quando nem o corpo nem o perfil têm (?? \"\")", async () => {
    const c = await criarUsuario("contratante", "semcontato@x.com"); // criado sem endereco/telefone
    const r = await request(app).post("/contratos").send({ titulo: "Sem contato", contratanteId: c.id });
    expect(r.status).toBe(201);
    expect(r.body.endereco).toBe("");
    expect(r.body.telefone).toBe("");
  });

  it("PATCH /usuarios/:id sem corpo não altera nada e retorna 200", async () => {
    const u = await criarUsuario("freelancer", "patchvazio@x.com");
    const r = await request(app).patch(`/usuarios/${u.id}`);
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(u.id);
  });

  it("candidatura: 404 em projeto inexistente; 400 sem freelancerId em projeto aberto", async () => {
    const c = await criarUsuario("contratante", "cand@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Aberto", contratanteId: c.id })).body;
    expect((await request(app).post("/contratos/9999/candidaturas").send({ freelancerId: 1 })).status).toBe(404);
    expect((await request(app).post(`/contratos/${proj.id}/candidaturas`)).status).toBe(400); // freelancerId ausente → freela undefined
  });

  it("GET /contratos/:id/candidaturas → 404 em projeto inexistente", async () => {
    expect((await request(app).get("/contratos/9999/candidaturas")).status).toBe(404);
  });

  it("lista candidato ÓRFÃO como '(desconhecido)' (freelancer não existe mais)", async () => {
    const c = await criarUsuario("contratante", "orf@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Órfão", contratanteId: c.id })).body;
    criarCandidatura({ contratoId: proj.id, freelancerId: 9999 }); // candidatura apontando para id inexistente
    const lista = (await request(app).get(`/contratos/${proj.id}/candidaturas`)).body;
    expect(lista[0].nome).toBe("(desconhecido)"); // fallback u?.nome || "(desconhecido)"
  });

  it("selecionar/andamento/concluir → 404 em projeto inexistente", async () => {
    expect((await request(app).patch("/contratos/9999/selecionar").send({ freelancerId: 1 })).status).toBe(404);
    expect((await request(app).patch("/contratos/9999/andamento")).status).toBe(404);
    expect((await request(app).patch("/contratos/9999/concluir")).status).toBe(404);
  });

  it("selecionar em projeto NÃO aberto → 400", async () => {
    const c = await criarUsuario("contratante", "sel@x.com");
    const f = await criarUsuario("freelancer", "self@x.com");
    const proj = await levarAteAndamento({ contratante: c, freela: f, titulo: "Já andando" });
    const r = await request(app).patch(`/contratos/${proj.id}/selecionar`).send({ freelancerId: f.id });
    expect(r.status).toBe(400); // só seleciona em projeto aberto
  });

  it("PATCH /contratos/:id → 404 em projeto inexistente", async () => {
    expect((await request(app).patch("/contratos/9999").send({ titulo: "X" })).status).toBe(404);
  });

  it("DELETE candidatura → 404 em projeto inexistente", async () => {
    expect((await request(app).delete("/contratos/9999/candidaturas/1")).status).toBe(404);
  });

  it("DELETE candidatura inexistente em projeto existente → 404", async () => {
    const c = await criarUsuario("contratante", "delcand@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Sem cand", contratanteId: c.id })).body;
    expect((await request(app).delete(`/contratos/${proj.id}/candidaturas/9999`)).status).toBe(404);
  });

  it("PATCH /contratos/:id com título vazio → 400", async () => {
    const c = await criarUsuario("contratante", "pt@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Tem", contratanteId: c.id })).body;
    expect((await request(app).patch(`/contratos/${proj.id}`).send({ titulo: "" })).status).toBe(400);
  });

  it("responde ao preflight CORS (OPTIONS → 204)", async () => {
    expect((await request(app).options("/contratos")).status).toBe(204);
  });

  it("não quebra o log ao servir rota inexistente (resposta sem corpo capturado)", async () => {
    const r = await request(app).get("/rota-que-nao-existe");
    expect(r.status).toBe(404); // 404 padrão do Express, sem passar pelo res.json interceptado
  });
});

// Liga/desliga uma flag pela API (o mesmo endpoint que o painel usa no front).
const setFlag = (nome, ativa) => request(app).patch(`/flags/${nome}`).send({ ativa });

describe("@integracao Feature flags — endpoints e catálogo", () => {
  it("GET /flags lista as 6 flags com o estado padrão", async () => {
    const r = await request(app).get("/flags");
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(6);
    const porNome = Object.fromEntries(r.body.map((f) => [f.nome, f.ativa]));
    expect(porNome.notificacao_email).toBe(true);   // única ligada por padrão
    expect(porNome.modo_manutencao).toBe(false);
    expect(porNome.login_google).toBe(false);
  });

  it("PATCH /flags/:nome liga e desliga uma flag existente", async () => {
    const on = await setFlag("login_google", true);
    expect(on.status).toBe(200);
    expect(on.body).toMatchObject({ nome: "login_google", ativa: true });
    const off = await setFlag("login_google", false);
    expect(off.body.ativa).toBe(false);
  });

  it("PATCH /flags rejeita flag inexistente (404) e valor não-booleano (400)", async () => {
    expect((await setFlag("nao_existe", true)).status).toBe(404);
    expect((await request(app).patch("/flags/login_google").send({ ativa: "sim" })).status).toBe(400);
  });
});

describe("@integracao Feature flag: modo_manutencao (ON x OFF)", () => {
  it("OFF: as rotas funcionam normalmente", async () => {
    expect((await request(app).get("/contratos")).status).toBe(200);
  });
  it("ON: bloqueia as rotas (503) mas mantém /flags e /health acessíveis", async () => {
    await setFlag("modo_manutencao", true);
    const bloqueado = await request(app).get("/contratos");
    expect(bloqueado.status).toBe(503);
    expect(bloqueado.body.manutencao).toBe(true);
    expect((await request(app).get("/flags")).status).toBe(200); // dá pra desligar a flag
    expect((await request(app).get("/health")).status).toBe(200);
  });
});

describe("@integracao Feature flag: pagamento_destaque (ON x OFF)", () => {
  it("OFF: destacar projeto é recusado (403)", async () => {
    const c = await criarUsuario("contratante", "dest-off@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Sem destaque", contratanteId: c.id })).body;
    expect(proj.destaque).toBe(false);
    expect((await request(app).patch(`/contratos/${proj.id}/destacar`)).status).toBe(403);
  });
  it("ON: destacar projeto funciona (200, destaque=true)", async () => {
    await setFlag("pagamento_destaque", true);
    const c = await criarUsuario("contratante", "dest-on@x.com");
    const proj = (await request(app).post("/contratos").send({ titulo: "Com destaque", contratanteId: c.id })).body;
    const r = await request(app).patch(`/contratos/${proj.id}/destacar`);
    expect(r.status).toBe(200);
    expect(r.body.destaque).toBe(true);
  });
});

describe("@integracao Feature flag: login_google (ON x OFF)", () => {
  it("OFF: login com Google indisponível (403)", async () => {
    await criarUsuario("freelancer", "g@x.com");
    expect((await request(app).post("/login/google").send({ email: "g@x.com" })).status).toBe(403);
  });
  it("ON: loga por e-mail vinculado (200) e recusa e-mail sem conta (404)", async () => {
    await setFlag("login_google", true);
    await criarUsuario("freelancer", "g2@x.com");
    const ok = await request(app).post("/login/google").send({ email: "g2@x.com" });
    expect(ok.status).toBe(200);
    expect(ok.body.senha).toBeUndefined();
    expect((await request(app).post("/login/google").send({ email: "naoexiste@x.com" })).status).toBe(404);
  });
});

describe("@integracao Feature flag: avaliacao_anonima (ON x OFF)", () => {
  async function contratoAvaliado(sufixo) {
    const contratante = await criarUsuario("contratante", `an-c${sufixo}@x.com`);
    const freela = await criarUsuario("freelancer", `an-f${sufixo}@x.com`);
    const proj = await levarAteAndamento({ contratante, freela, titulo: "Projeto avaliado" });
    await request(app).post("/avaliacoes").send({ contratoId: proj.id, deId: freela.id, paraId: contratante.id, nota: 5, comentario: "ótimo" });
    return { contratante, freela };
  }
  it("OFF: a avaliação mostra quem avaliou (deId presente)", async () => {
    const { contratante, freela } = await contratoAvaliado("off");
    const r = await request(app).get(`/avaliacoes/usuario/${contratante.id}`);
    expect(r.body[0].deId).toBe(freela.id);
    expect(r.body[0].anonimo).toBeUndefined();
  });
  it("ON: oculta o autor (deId null, anonimo=true) mas mantém nota e comentário", async () => {
    const { contratante } = await contratoAvaliado("on");
    await setFlag("avaliacao_anonima", true);
    const r = await request(app).get(`/avaliacoes/usuario/${contratante.id}`);
    expect(r.body[0].deId).toBeNull();
    expect(r.body[0].anonimo).toBe(true);
    expect(r.body[0].nota).toBe(5);
    expect(r.body[0].comentario).toBe("ótimo");
  });
});

describe("@integracao Feature flag: notificacao_email (ON x OFF)", () => {
  async function candidatar(sufixo) {
    const contratante = await criarUsuario("contratante", `nt-c${sufixo}@x.com`);
    const freela = await criarUsuario("freelancer", `nt-f${sufixo}@x.com`);
    const proj = (await request(app).post("/contratos").send({ titulo: "Vaga", contratanteId: contratante.id })).body;
    await request(app).post(`/contratos/${proj.id}/candidaturas`).send({ freelancerId: freela.id });
    return contratante;
  }
  it("ON (padrão): candidatura gera notificação para o contratante", async () => {
    const contratante = await candidatar("on");
    const r = await request(app).get(`/notificacoes/${contratante.id}`);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].tipo).toBe("candidatura");
  });
  it("OFF: candidatura não gera notificação", async () => {
    await setFlag("notificacao_email", false);
    const contratante = await candidatar("off");
    const r = await request(app).get(`/notificacoes/${contratante.id}`);
    expect(r.body).toHaveLength(0);
  });
});
