// Testes UNITÁRIOS do módulo de feature flags (base da pirâmide).
// Funções puras de estado — sem Express, sem rede.
// TAG: @unitario
import { describe, it, expect, beforeEach } from "vitest";
import { listarFlags, flagAtiva, flagExiste, definirFlag, resetFlags } from "./flags.js";

beforeEach(() => resetFlags());

describe("@unitario flags: catálogo e estado padrão", () => {
  it("lista 6 flags com nome, descrição e estado", () => {
    const flags = listarFlags();
    expect(flags).toHaveLength(6);
    for (const f of flags) {
      expect(typeof f.nome).toBe("string");
      expect(typeof f.descricao).toBe("string");
      expect(typeof f.ativa).toBe("boolean");
    }
  });
  it("só notificacao_email vem ligada por padrão", () => {
    expect(flagAtiva("notificacao_email")).toBe(true);
    expect(flagAtiva("modo_manutencao")).toBe(false);
    expect(flagAtiva("login_google")).toBe(false);
  });
});

describe("@unitario flags: existência e checagem", () => {
  it("flagExiste reconhece só as flags do catálogo", () => {
    expect(flagExiste("modo_manutencao")).toBe(true);
    expect(flagExiste("inventada")).toBe(false);
  });
  it("flagAtiva de flag inexistente é false (nunca quebra)", () => {
    expect(flagAtiva("inventada")).toBe(false);
  });
});

describe("@unitario flags: ligar/desligar", () => {
  it("definirFlag liga e desliga uma flag existente", () => {
    expect(definirFlag("login_google", true)).toMatchObject({ nome: "login_google", ativa: true });
    expect(flagAtiva("login_google")).toBe(true);
    definirFlag("login_google", false);
    expect(flagAtiva("login_google")).toBe(false);
  });
  it("definirFlag em flag inexistente retorna undefined", () => {
    expect(definirFlag("inventada", true)).toBeUndefined();
  });
  it("resetFlags volta ao estado padrão", () => {
    definirFlag("modo_manutencao", true);
    expect(flagAtiva("modo_manutencao")).toBe(true);
    resetFlags();
    expect(flagAtiva("modo_manutencao")).toBe(false);
  });
});
