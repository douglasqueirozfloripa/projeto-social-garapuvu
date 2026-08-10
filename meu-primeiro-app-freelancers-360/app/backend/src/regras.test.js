// Testes UNITÁRIOS das regras de negócio (base da pirâmide de testes).
// TAG: @unitario  → grep: grep -rl "@unitario" backend/  |  rodar: vitest -t "@unitario"
import { describe, it, expect } from "vitest";
import { validarNota, emailValido, mediaAvaliacoes, podeAvaliar } from "./regras.js";

describe("@unitario validarNota", () => {
  it("aceita as notas de 1 a 5", () => {
    for (const n of [1, 2, 3, 4, 5]) expect(validarNota(n)).toBe(true);
  });
  it("rejeita bordas e valores inválidos", () => {
    expect(validarNota(0)).toBe(false);   // abaixo do mínimo
    expect(validarNota(6)).toBe(false);   // acima do máximo
    expect(validarNota(3.5)).toBe(false); // não inteiro
    expect(validarNota("5")).toBe(false); // não é número
  });
});

describe("@unitario emailValido", () => {
  it("aceita e-mail bem formado", () => {
    expect(emailValido("ana@garapuvu.org")).toBe(true);
  });
  it("rejeita e-mail sem @ ou sem domínio", () => {
    expect(emailValido("ana.garapuvu.org")).toBe(false);
    expect(emailValido("ana@")).toBe(false);
    expect(emailValido("")).toBe(false);
    expect(emailValido(null)).toBe(false);
  });
});

describe("@unitario mediaAvaliacoes", () => {
  it("retorna 0 para lista vazia", () => {
    expect(mediaAvaliacoes([])).toBe(0);
  });
  it("calcula a média com 1 casa decimal", () => {
    expect(mediaAvaliacoes([5, 4, 3])).toBe(4);
    expect(mediaAvaliacoes([5, 4])).toBe(4.5);
    expect(mediaAvaliacoes([5, 4, 4])).toBe(4.3); // 13/3 = 4.333 -> 4.3
  });
});

describe("@unitario podeAvaliar", () => {
  it("permite avaliar durante o andamento e após concluir; nega antes disso", () => {
    expect(podeAvaliar({ status: "em_andamento" })).toBe(true); // freelancer entrega/contratante conclui
    expect(podeAvaliar({ status: "concluido" })).toBe(true);
    expect(podeAvaliar({ status: "aberto" })).toBe(false);
    expect(podeAvaliar({ status: "em_aprovacao" })).toBe(false);
    expect(podeAvaliar(null)).toBe(false);
  });
});
