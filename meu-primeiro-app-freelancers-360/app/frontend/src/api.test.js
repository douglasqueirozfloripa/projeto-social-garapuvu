// Teste de INTERFACE (unidade) — camada api.js (tradução de erros do fetch).
// Mocka o fetch global para não tocar a rede.
// TAG: @interface
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./api.js";

beforeEach(() => { global.fetch = vi.fn(); });
afterEach(() => { vi.restoreAllMocks(); });

function respostaOk(dado) {
  return { ok: true, status: 200, json: async () => dado };
}
function respostaErro(status, corpo) {
  return { ok: false, status, json: async () => corpo };
}

describe("@interface api.js", () => {
  it("faz POST em /login e retorna o corpo em caso de sucesso", async () => {
    global.fetch.mockResolvedValueOnce(respostaOk({ id: 1, nome: "Ana" }));
    const r = await api.login({ email: "ana@x.com", senha: "1234" });
    expect(r).toEqual({ id: 1, nome: "Ana" });
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3001/login");
    expect(opcoes.method).toBe("POST");
    expect(JSON.parse(opcoes.body)).toEqual({ email: "ana@x.com", senha: "1234" });
  });

  it("faz POST em /logout com o id do usuário", async () => {
    global.fetch.mockResolvedValueOnce(respostaOk({ ok: true, mensagem: "sessão encerrada" }));
    const r = await api.logout(7);
    expect(r).toMatchObject({ ok: true });
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3001/logout");
    expect(opcoes.method).toBe("POST");
    expect(JSON.parse(opcoes.body)).toEqual({ id: 7 });
  });

  it("propaga a mensagem 'erro' vinda da API quando a resposta não é ok", async () => {
    global.fetch.mockResolvedValueOnce(respostaErro(400, { erro: "e-mail já cadastrado" }));
    await expect(api.cadastrar({ email: "dup@x.com" })).rejects.toThrow("e-mail já cadastrado");
  });

  it("usa mensagem genérica com o status quando a API não manda 'erro'", async () => {
    global.fetch.mockResolvedValueOnce(respostaErro(500, {}));
    await expect(api.listarContratos()).rejects.toThrow(/Erro 500/);
  });

  it("traduz falha de rede em mensagem amigável sobre a API fora do ar", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(api.listarContratos()).rejects.toThrow(/Não foi possível conectar ao servidor/);
  });

  it("expõe todos os verbos do CRUD/recrutamento nas rotas certas", async () => {
    global.fetch.mockResolvedValue(respostaOk({}));
    await api.cadastrar({ nome: "A" });
    await api.atualizarUsuario(1, { nome: "B" });
    await api.criarContrato({ titulo: "T" });
    await api.atualizarContrato(2, { titulo: "T2" });
    await api.candidatar(2, 5);
    await api.listarCandidatos(2);
    await api.removerCandidatura(2, 5);
    await api.selecionarFreelancer(2, 5);
    await api.iniciarAndamento(2);
    await api.concluirContrato(2);
    await api.avaliar({ contratoId: 2, nota: 5 });
    const rotas = global.fetch.mock.calls.map(([url, o]) => `${o?.method || "GET"} ${url.replace("http://localhost:3001", "")}`);
    expect(rotas).toEqual([
      "POST /usuarios",
      "PATCH /usuarios/1",
      "POST /contratos",
      "PATCH /contratos/2",
      "POST /contratos/2/candidaturas",
      "GET /contratos/2/candidaturas",
      "DELETE /contratos/2/candidaturas/5",
      "PATCH /contratos/2/selecionar",
      "PATCH /contratos/2/andamento",
      "PATCH /contratos/2/concluir",
      "POST /avaliacoes",
    ]);
  });

  it("monta corretamente as rotas com parâmetros (buscarUsuario, removerContrato)", async () => {
    global.fetch.mockResolvedValueOnce(respostaOk({ id: 9 }));
    await api.buscarUsuario(9);
    expect(global.fetch.mock.calls[0][0]).toBe("http://localhost:3001/usuarios/9");

    global.fetch.mockResolvedValueOnce(respostaOk({}));
    await api.removerContrato(4);
    const [url, opcoes] = global.fetch.mock.calls[1];
    expect(url).toBe("http://localhost:3001/contratos/4");
    expect(opcoes.method).toBe("DELETE");
  });
});
