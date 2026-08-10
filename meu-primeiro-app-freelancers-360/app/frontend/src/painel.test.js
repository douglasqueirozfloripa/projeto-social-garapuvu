// Testes UNITÁRIOS dos cálculos do painel (base da pirâmide de testes).
// São funções puras: nada de React, nada de API — só entrada → saída.
// TAG: @unitario  → rodar: vitest -t "@unitario"
import { describe, it, expect } from "vitest";
import { resumoDoPainel, proximoPasso } from "./painel.js";

const contratante = { id: 1, papel: "contratante" };
const freela = { id: 9, papel: "freelancer" };

// Atalho para montar contratos de teste sem repetir os campos padrão.
const contrato = (campos) => ({
  id: 1, titulo: "Projeto", contratanteId: 1, freelancerId: null,
  status: "aberto", candidatos: [], avaliadores: [], ...campos,
});

// Pega o valor de um número do resumo pelo id (a ordem não importa no teste).
const valor = (lista, id) => lista.find((n) => n.id === id)?.valor;

describe("@unitario resumoDoPainel (contratante)", () => {
  it("conta apenas os projetos DO contratante logado", () => {
    const resumo = resumoDoPainel([
      contrato({ id: 1, contratanteId: 1 }),
      contrato({ id: 2, contratanteId: 1 }),
      contrato({ id: 3, contratanteId: 77 }), // de outra pessoa: não entra
    ], contratante);

    expect(valor(resumo, "publicados")).toBe(2);
  });

  it("soma as candidaturas recebidas nos projetos publicados", () => {
    const resumo = resumoDoPainel([
      contrato({ id: 1, candidatos: [9, 10] }),
      contrato({ id: 2, candidatos: [11] }),
    ], contratante);

    expect(valor(resumo, "candidaturas")).toBe(3);
  });

  it("agrupa em_aprovacao e em_andamento como 'em processo'", () => {
    const resumo = resumoDoPainel([
      contrato({ id: 1, status: "em_aprovacao" }),
      contrato({ id: 2, status: "em_andamento" }),
      contrato({ id: 3, status: "concluido" }),
    ], contratante);

    expect(valor(resumo, "em-processo")).toBe(2);
    expect(valor(resumo, "concluidos")).toBe(1);
    expect(valor(resumo, "publicados")).toBe(0); // nenhum ainda aberto
  });

  it("devolve tudo zerado quando não há projeto nenhum", () => {
    const resumo = resumoDoPainel([], contratante);
    expect(resumo.every((n) => n.valor === 0)).toBe(true);
    expect(resumo).toHaveLength(4);
  });
});

describe("@unitario resumoDoPainel (freelancer)", () => {
  it("conta as vagas abertas da plataforma (de qualquer contratante)", () => {
    const resumo = resumoDoPainel([
      contrato({ id: 1, contratanteId: 1 }),
      contrato({ id: 2, contratanteId: 77 }),
      contrato({ id: 3, status: "concluido", freelancerId: 9 }),
    ], freela);

    expect(valor(resumo, "vagas")).toBe(2);
  });

  it("conta as candidaturas em que o freelancer aparece", () => {
    const resumo = resumoDoPainel([
      contrato({ id: 1, candidatos: [9] }),
      contrato({ id: 2, candidatos: [10] }), // de outro freelancer
    ], freela);

    expect(valor(resumo, "candidaturas")).toBe(1);
  });

  it("só conta como seus os trabalhos em que ele é o freelancer selecionado", () => {
    const resumo = resumoDoPainel([
      contrato({ id: 1, status: "em_andamento", freelancerId: 9 }),
      contrato({ id: 2, status: "em_andamento", freelancerId: 10 }),
      contrato({ id: 3, status: "concluido", freelancerId: 9 }),
    ], freela);

    expect(valor(resumo, "em-processo")).toBe(1);
    expect(valor(resumo, "concluidos")).toBe(1);
  });
});

describe("@unitario resumoDoPainel (bordas)", () => {
  it("não quebra sem usuário nem sem lista", () => {
    expect(resumoDoPainel([], null)).toEqual([]);
    expect(resumoDoPainel(undefined, contratante)).toHaveLength(4);
  });

  it("trata candidatos/avaliadores ausentes como listas vazias", () => {
    const resumo = resumoDoPainel([{ id: 1, contratanteId: 1, status: "aberto" }], contratante);
    expect(valor(resumo, "candidaturas")).toBe(0);
  });
});

describe("@unitario proximoPasso (contratante) — a ordem é a prioridade", () => {
  it("sem projetos: convida a publicar o primeiro", () => {
    const passo = proximoPasso([], contratante);
    expect(passo.texto).toMatch(/primeiro projeto/i);
    expect(passo.modulo).toBe("projetos");
  });

  it("entrega do freelancer vence a seleção pendente", () => {
    const passo = proximoPasso([
      contrato({ id: 1, status: "em_aprovacao" }),
      contrato({ id: 2, status: "em_andamento", freelancerId: 9, avaliadores: [9], titulo: "Site" }),
    ], contratante);

    expect(passo.texto).toContain("Site");
    expect(passo.rotuloAcao).toBe("Concluir projeto");
  });

  it("seleção pendente vence candidatos esperando", () => {
    const passo = proximoPasso([
      contrato({ id: 1, status: "aberto", candidatos: [9, 10] }),
      contrato({ id: 2, status: "em_aprovacao", titulo: "App" }),
    ], contratante);

    expect(passo.texto).toContain("App");
    expect(passo.rotuloAcao).toBe("Iniciar trabalho");
  });

  it("avisa quantos candidatos esperam escolha, no plural certo", () => {
    const passo = proximoPasso([contrato({ candidatos: [9, 10, 11] })], contratante);
    expect(passo.texto).toMatch(/3 candidatos esperam sua escolha em 1 projeto/);
    expect(passo.rotuloAcao).toBe("Ver candidatos");
  });

  it("usa o singular quando é um único candidato", () => {
    const passo = proximoPasso([contrato({ candidatos: [9] })], contratante);
    expect(passo.texto).toMatch(/1 candidato espera sua escolha em 1 projeto\./);
  });

  it("em andamento sem entrega: manda aguardar o freelancer", () => {
    const passo = proximoPasso([contrato({ status: "em_andamento", freelancerId: 9 })], contratante);
    expect(passo.texto).toMatch(/aguardando o freelancer/i);
  });
});

describe("@unitario proximoPasso (freelancer) — a ordem é a prioridade", () => {
  it("trabalho em andamento sem feedback é a maior prioridade", () => {
    const passo = proximoPasso([
      contrato({ id: 1, status: "aberto" }),
      contrato({ id: 2, status: "em_andamento", freelancerId: 9, titulo: "Logo" }),
    ], freela);

    expect(passo.texto).toContain("Logo");
    expect(passo.rotuloAcao).toBe("Finalizar trabalho");
  });

  it("feedback já enviado deixa de ser próximo passo", () => {
    const passo = proximoPasso([
      contrato({ id: 2, status: "em_andamento", freelancerId: 9, avaliadores: [9] }),
      contrato({ id: 3, status: "aberto" }),
    ], freela);

    expect(passo.rotuloAcao).toBe("Ver vagas"); // caiu para a vaga aberta
  });

  it("celebra a seleção quando está em aprovação", () => {
    const passo = proximoPasso([contrato({ status: "em_aprovacao", freelancerId: 9, titulo: "Flyer" })], freela);
    expect(passo.texto).toMatch(/selecionado em “Flyer”/);
  });

  it("ignora vagas em que já se candidatou ao contar as disponíveis", () => {
    const passo = proximoPasso([
      contrato({ id: 1, candidatos: [9] }),
      contrato({ id: 2, candidatos: [] }),
    ], freela);

    expect(passo.texto).toMatch(/1 vaga aberta espera sua candidatura/);
  });

  it("candidatou-se em tudo: manda acompanhar", () => {
    const passo = proximoPasso([contrato({ candidatos: [9] })], freela);
    expect(passo.rotuloAcao).toBe("Acompanhar candidaturas");
  });

  it("sem vaga alguma: manda cuidar do perfil", () => {
    const passo = proximoPasso([], freela);
    expect(passo.modulo).toBe("perfil");
  });

  it("devolve null sem usuário", () => {
    expect(proximoPasso([], null)).toBeNull();
  });
});
