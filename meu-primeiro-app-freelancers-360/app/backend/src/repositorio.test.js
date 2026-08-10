// Testes UNITÁRIOS do repositório em memória (base da pirâmide).
// O repositório é lógica pura (arrays + find/filter), sem rede nem framework —
// ideal para testes rápidos e determinísticos. reset() isola cada caso.
// TAG: @unitario  → grep: grep -rl "@unitario" backend/  |  rodar: vitest -t "@unitario"
import { describe, it, expect, beforeEach } from "vitest";
import * as repo from "./repositorio.js";

beforeEach(() => repo.reset());

describe("@unitario repositorio · usuários", () => {
  it("cria usuário com ids sequenciais e aplica defaults de endereço/telefone", () => {
    const a = repo.criarUsuario({ nome: "Ana", email: "a@x.com", papel: "freelancer", senha: "1234" });
    const b = repo.criarUsuario({ nome: "Bea", email: "b@x.com", papel: "contratante", senha: "1234", endereco: "Floripa/SC", telefone: "(48) 9" });
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
    expect(a.endereco).toBe("");   // default
    expect(a.telefone).toBe("");   // default
    expect(b.endereco).toBe("Floripa/SC");
  });

  it("acha usuário por id (coagindo string) e por e-mail; retorna undefined quando não existe", () => {
    const u = repo.criarUsuario({ nome: "Ana", email: "a@x.com", papel: "freelancer", senha: "1234" });
    expect(repo.acharUsuario(u.id)).toBe(u);
    expect(repo.acharUsuario(String(u.id))).toBe(u);     // "1" → 1
    expect(repo.acharUsuario(999)).toBeUndefined();
    expect(repo.acharUsuarioPorEmail("a@x.com")).toBe(u);
    expect(repo.acharUsuarioPorEmail("naoexiste@x.com")).toBeUndefined();
  });

  it("atualiza só os campos enviados, ignora undefined e devolve undefined se não existe", () => {
    const u = repo.criarUsuario({ nome: "Ana", email: "a@x.com", papel: "freelancer", senha: "1234", telefone: "(48) 1" });
    const upd = repo.atualizarUsuario(u.id, { nome: "Ana Silva", endereco: "São José/SC", papel: "contratante" });
    expect(upd.nome).toBe("Ana Silva");
    expect(upd.endereco).toBe("São José/SC");
    expect(upd.telefone).toBe("(48) 1"); // não foi enviado → mantém
    expect(upd.papel).toBe("freelancer"); // papel não é editável → ignorado
    expect(repo.atualizarUsuario(999, { nome: "X" })).toBeUndefined();
  });

  it("semearUsuarios cria os padrões uma vez e é idempotente (não duplica)", () => {
    const primeira = repo.semearUsuarios();
    expect(primeira).toHaveLength(repo.USUARIOS_PADRAO.length);
    const totalApos1 = repo.semearUsuarios().length; // roda de novo
    // nenhum e-mail padrão foi duplicado
    for (const p of repo.USUARIOS_PADRAO) {
      const encontrados = [p].filter(() => repo.acharUsuarioPorEmail(p.email));
      expect(encontrados).toHaveLength(1);
    }
    expect(totalApos1).toBe(repo.USUARIOS_PADRAO.length);
  });
});

describe("@unitario repositorio · contratos", () => {
  it("cria contrato aberto com defaults e lista todos", () => {
    const c = repo.criarContrato({ titulo: "Site", contratanteId: 1 });
    expect(c.id).toBe(1);
    expect(c.status).toBe("aberto");
    expect(c.freelancerId).toBeNull();
    expect(c.descricao).toBe("");
    expect(repo.listarContratos()).toHaveLength(1);
    expect(repo.acharContrato(c.id)).toBe(c);
  });

  it("atualiza campos editáveis, ignora não editáveis e devolve undefined se não existe", () => {
    const c = repo.criarContrato({ titulo: "Velho", contratanteId: 1 });
    const upd = repo.atualizarContrato(c.id, { titulo: "Novo", descricao: "x", status: "concluido", contratanteId: 99 });
    expect(upd.titulo).toBe("Novo");
    expect(upd.descricao).toBe("x");
    expect(upd.status).toBe("aberto");        // status não muda por aqui
    expect(upd.contratanteId).toBe(1);        // dono não muda por aqui
    expect(repo.atualizarContrato(999, { titulo: "X" })).toBeUndefined();
  });

  it("remove contrato: true quando remove, false quando o id não existe", () => {
    const c = repo.criarContrato({ titulo: "Some", contratanteId: 1 });
    expect(repo.removerContrato(c.id)).toBe(true);
    expect(repo.listarContratos()).toHaveLength(0);
    expect(repo.removerContrato(c.id)).toBe(false); // já foi
  });
});

describe("@unitario repositorio · candidaturas", () => {
  it("registra candidatura, lista por contrato e detecta duplicidade", () => {
    repo.criarCandidatura({ contratoId: 1, freelancerId: 10 });
    repo.criarCandidatura({ contratoId: 1, freelancerId: 20 });
    repo.criarCandidatura({ contratoId: 2, freelancerId: 10 });
    expect(repo.candidaturasDoContrato(1)).toHaveLength(2);
    expect(repo.jaCandidatou(1, 10)).toBe(true);
    expect(repo.jaCandidatou(1, "10")).toBe(true);   // coerção de string
    expect(repo.jaCandidatou(1, 99)).toBe(false);
  });

  it("remove candidatura: true quando remove, false quando não havia", () => {
    repo.criarCandidatura({ contratoId: 1, freelancerId: 10 });
    expect(repo.removerCandidatura(1, 10)).toBe(true);
    expect(repo.jaCandidatou(1, 10)).toBe(false);
    expect(repo.removerCandidatura(1, 10)).toBe(false);
  });
});

describe("@unitario repositorio · avaliações", () => {
  it("cria avaliação (comentário default vazio) e lista as recebidas por usuário", () => {
    const a = repo.criarAvaliacao({ contratoId: 1, deId: 10, paraId: 20, nota: 5 });
    expect(a.comentario).toBe("");
    repo.criarAvaliacao({ contratoId: 1, deId: 20, paraId: 10, nota: 4, comentario: "ok" });
    expect(repo.avaliacoesRecebidas(20)).toHaveLength(1);
    expect(repo.avaliacoesRecebidas("20")).toHaveLength(1); // coerção
    expect(repo.avaliacoesRecebidas(99)).toHaveLength(0);
  });

  it("jaAvaliou identifica o lado que já avaliou o contrato", () => {
    repo.criarAvaliacao({ contratoId: 1, deId: 10, paraId: 20, nota: 5 });
    expect(repo.jaAvaliou(1, 10)).toBe(true);
    expect(repo.jaAvaliou(1, 20)).toBe(false);
  });

  it("avaliadoresDoContrato retorna os ids (numéricos) de quem já avaliou aquele contrato", () => {
    repo.criarAvaliacao({ contratoId: 1, deId: 10, paraId: 20, nota: 5 });
    repo.criarAvaliacao({ contratoId: 1, deId: 20, paraId: 10, nota: 4 });
    repo.criarAvaliacao({ contratoId: 2, deId: 30, paraId: 40, nota: 3 });
    expect(repo.avaliadoresDoContrato(1).sort()).toEqual([10, 20]);
    expect(repo.avaliadoresDoContrato(2)).toEqual([30]);
    expect(repo.avaliadoresDoContrato(999)).toEqual([]);
  });
});

describe("@unitario repositorio · reset", () => {
  it("zera todas as coleções e o gerador de ids", () => {
    repo.criarUsuario({ nome: "Ana", email: "a@x.com", papel: "freelancer", senha: "1234" });
    repo.criarContrato({ titulo: "Site", contratanteId: 1 });
    repo.reset();
    expect(repo.listarContratos()).toHaveLength(0);
    expect(repo.acharUsuarioPorEmail("a@x.com")).toBeUndefined();
    // seq reiniciou: o próximo id volta a ser 1
    expect(repo.criarUsuario({ nome: "Nova", email: "n@x.com", papel: "freelancer", senha: "1234" }).id).toBe(1);
  });
});
