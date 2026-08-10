// Teste de INTERFACE (unidade) dos sub-componentes de ação do Projetos.
// Testa AcoesContratante e AcoesFreelancer isoladamente, com props sob medida,
// para cobrir todas as ramificações por papel/status (inclusive os guards
// defensivos `|| []` e o estado "vaga com outro freelancer").
// TAG: @interface
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcoesContratante, AcoesFreelancer } from "./Projetos.jsx";

const noop = vi.fn();
const propsContratante = (c) => ({ c, user: { id: 10 }, setVerCandidatos: noop, setEditando: noop, excluir: noop, acao: noop, setAvaliando: noop });
const propsFreelancer = (c) => ({ c, user: { id: 20 }, acao: noop, setAvaliando: noop });

describe("@interface AcoesContratante", () => {
  it("aberto: mostra ver candidatos (com contagem), editar e excluir", () => {
    render(<AcoesContratante {...propsContratante({ id: 1, status: "aberto", candidatos: [20, 30] })} />);
    expect(screen.getByText("Ver candidatos (2)")).toBeInTheDocument();
    expect(screen.getByTestId("editar-projeto")).toBeInTheDocument();
  });

  it("aberto sem o campo candidatos: usa fallback [] (contagem 0)", () => {
    render(<AcoesContratante {...propsContratante({ id: 1, status: "aberto" })} />); // sem candidatos
    expect(screen.getByText("Ver candidatos (0)")).toBeInTheDocument();
  });

  it("em_aprovacao: mostra iniciar andamento", () => {
    render(<AcoesContratante {...propsContratante({ id: 1, status: "em_aprovacao", freelancerId: 20 })} />);
    expect(screen.getByTestId("iniciar-andamento")).toBeInTheDocument();
  });

  it("em_andamento com entrega: mostra concluir; sem entrega: mostra dica", () => {
    const { unmount } = render(<AcoesContratante {...propsContratante({ id: 1, status: "em_andamento", freelancerId: 20, avaliadores: [20] })} />);
    expect(screen.getByTestId("concluir-projeto")).toBeInTheDocument();
    unmount();
    render(<AcoesContratante {...propsContratante({ id: 2, status: "em_andamento", freelancerId: 20 })} />); // avaliadores undefined → || []
    expect(screen.getByText(/Aguardando o freelancer/)).toBeInTheDocument();
  });

  it("concluido: mostra o selo de concluído", () => {
    render(<AcoesContratante {...propsContratante({ id: 1, status: "concluido", freelancerId: 20, avaliadores: [10, 20] })} />);
    expect(screen.getByText(/Projeto concluído/)).toBeInTheDocument();
  });
});

describe("@interface AcoesFreelancer", () => {
  it("aberto, ainda não candidatado: mostra candidatar", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "aberto", candidatos: [] })} />);
    expect(screen.getByTestId("candidatar")).toBeInTheDocument();
  });

  it("aberto, já candidatado: mostra retirar candidatura", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "aberto", candidatos: [20] })} />);
    expect(screen.getByTestId("retirar-candidatura")).toBeInTheDocument();
  });

  it("aberto sem o campo candidatos: usa fallback [] (mostra candidatar)", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "aberto" })} />);
    expect(screen.getByTestId("candidatar")).toBeInTheDocument();
  });

  it("projeto de OUTRO freelancer (não selecionado): mostra 'vaga já em processo'", () => {
    // guarda defensivo: freelancerId != user.id e status != aberto
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "em_andamento", freelancerId: 99 })} />);
    expect(screen.getByText(/Vaga já em processo com outro/)).toBeInTheDocument();
  });

  it("selecionado em aprovação: mensagem de parabéns", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "em_aprovacao", freelancerId: 20 })} />);
    expect(screen.getByText(/Você foi selecionado/)).toBeInTheDocument();
  });

  it("em andamento, ainda não avaliou: mostra finalizar trabalho", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "em_andamento", freelancerId: 20, avaliadores: [] })} />);
    expect(screen.getByTestId("finalizar-trabalho")).toBeInTheDocument();
  });

  it("em andamento, já avaliou (sem campo avaliadores usa []): mostra feedback enviado", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "em_andamento", freelancerId: 20, avaliadores: [20] })} />);
    expect(screen.getByText(/Feedback enviado/)).toBeInTheDocument();
  });

  it("concluido: mostra o selo de concluído", () => {
    render(<AcoesFreelancer {...propsFreelancer({ id: 1, status: "concluido", freelancerId: 20 })} />);
    expect(screen.getByText(/Projeto concluído/)).toBeInTheDocument();
  });
});
