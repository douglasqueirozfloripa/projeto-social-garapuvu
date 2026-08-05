// Teste de INTERFACE (componente) — Projetos: o fluxo de recrutamento pela UI.
// Cobre as ações do contratante e do freelancer, o formulário e o modal de candidatos.
// api.js é mockado (sem rede). TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../api.js", () => ({
  api: {
    listarContratos: vi.fn(),
    criarContrato: vi.fn(),
    atualizarContrato: vi.fn(),
    removerContrato: vi.fn(),
    iniciarAndamento: vi.fn(),
    listarCandidatos: vi.fn(),
    selecionarFreelancer: vi.fn(),
    removerCandidatura: vi.fn(),
    candidatar: vi.fn(),
    concluirContrato: vi.fn(),
    avaliar: vi.fn(),
  },
}));
import { api } from "../api.js";
import Projetos from "./Projetos.jsx";

const contratante = { id: 10, nome: "Bruno", papel: "contratante", email: "bruno@x.com", telefone: "(48) 90000-0000", endereco: "Floripa/SC" };
const freelancer = { id: 20, nome: "Ana", papel: "freelancer", email: "ana@x.com" };

beforeEach(() => vi.clearAllMocks());

describe("@interface Projetos — contratante", () => {
  const projetos = [
    { id: 1, titulo: "Aberto", status: "aberto", contratanteId: 10, candidatos: [20], avaliadores: [], email: "bruno@x.com" },
    { id: 2, titulo: "EmAprov", status: "em_aprovacao", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [] },
    { id: 3, titulo: "AndSemEntrega", status: "em_andamento", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [] },
    { id: 4, titulo: "AndComEntrega", status: "em_andamento", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [20] },
    { id: 5, titulo: "Concluido", status: "concluido", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [10, 20] },
  ];

  it("lista os projetos do contratante com as ações certas por status", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    render(<Projetos user={contratante} />);

    expect(await screen.findByText("Aberto")).toBeInTheDocument();
    expect(screen.getByTestId("novo-projeto")).toBeInTheDocument();
    // aberto → ver candidatos (com contagem), editar, excluir
    expect(screen.getByText("Ver candidatos (1)")).toBeInTheDocument();
    // em_aprovacao → iniciar andamento
    expect(screen.getByTestId("iniciar-andamento")).toBeInTheDocument();
    // em_andamento com entrega → concluir e avaliar; sem entrega → dica
    expect(screen.getByTestId("concluir-projeto")).toBeInTheDocument();
    expect(screen.getByText(/Aguardando o freelancer finalizar/)).toBeInTheDocument();
    // concluido → check
    expect(screen.getByText(/Projeto concluído/)).toBeInTheDocument();
  });

  it("inicia o andamento chamando a API e recarregando a lista", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.iniciarAndamento.mockResolvedValueOnce({});
    render(<Projetos user={contratante} />);
    await screen.findByTestId("iniciar-andamento");
    await userEvent.click(screen.getByTestId("iniciar-andamento"));
    expect(api.iniciarAndamento).toHaveBeenCalledWith(2);
    await waitFor(() => expect(api.listarContratos).toHaveBeenCalledTimes(2));
  });

  it("exclui um projeto após confirmação", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.removerContrato.mockResolvedValueOnce({});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("excluir-projeto"));
    expect(api.removerContrato).toHaveBeenCalledWith(1);
  });

  it("NÃO exclui se o usuário cancelar a confirmação", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("excluir-projeto"));
    expect(api.removerContrato).not.toHaveBeenCalled();
  });

  it("cria um novo projeto pelo formulário do modal", async () => {
    api.listarContratos.mockResolvedValue([]);
    api.criarContrato.mockResolvedValueOnce({ id: 99 });
    render(<Projetos user={contratante} />);
    await screen.findByTestId("novo-projeto");
    await userEvent.click(screen.getByTestId("novo-projeto"));

    await userEvent.type(screen.getByTestId("input-titulo"), "Novo site");
    // telefone/endereço vêm pré-preenchidos do perfil
    expect(screen.getByTestId("input-telefone-projeto")).toHaveValue("(48) 90000-0000");
    await userEvent.click(screen.getByTestId("salvar-projeto"));

    expect(api.criarContrato).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Novo site", contratanteId: 10 }));
  });

  it("mostra erro no formulário quando a criação do projeto falha", async () => {
    api.listarContratos.mockResolvedValue([]);
    api.criarContrato.mockRejectedValueOnce(new Error("título não pode ficar vazio"));
    render(<Projetos user={contratante} />);
    await userEvent.click(await screen.findByTestId("novo-projeto"));
    await userEvent.type(screen.getByTestId("input-titulo"), "X");
    await userEvent.click(screen.getByTestId("salvar-projeto"));
    expect(await screen.findByText("título não pode ficar vazio")).toBeInTheDocument();
  });

  it("edita um projeto existente pelo formulário", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.atualizarContrato.mockResolvedValueOnce({});
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("editar-projeto"));

    const titulo = screen.getByTestId("input-titulo");
    expect(titulo).toHaveValue("Aberto"); // veio preenchido
    await userEvent.clear(titulo);
    await userEvent.type(titulo, "Aberto (revisado)");
    await userEvent.click(screen.getByTestId("salvar-projeto"));

    expect(api.atualizarContrato).toHaveBeenCalledWith(1, expect.objectContaining({ titulo: "Aberto (revisado)" }));
  });

  it("renderiza contato completo (email/telefone/endereço) e rótulo de status desconhecido", async () => {
    api.listarContratos.mockResolvedValue([
      { id: 1, titulo: "Rico", status: "aberto", contratanteId: 10, candidatos: [], descricao: "Descrição do projeto", email: "e@x.com", telefone: "(48) 90000-0000", endereco: "Floripa/SC" },
      { id: 2, titulo: "Estranho", status: "xpto", contratanteId: 10, candidatos: [] }, // status fora do mapa
    ]);
    render(<Projetos user={contratante} />);
    await screen.findByText("Rico");
    expect(screen.getByText("Descrição do projeto")).toBeInTheDocument();
    expect(screen.getByText(/e@x.com/)).toBeInTheDocument();
    expect(screen.getByText(/\(48\) 90000-0000/)).toBeInTheDocument();
    expect(screen.getByText(/Floripa\/SC/)).toBeInTheDocument();
    expect(screen.getByText("xpto")).toBeInTheDocument(); // rotulo[status] || status
  });

  it("mostra erro quando uma ação (iniciar andamento) falha", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.iniciarAndamento.mockRejectedValueOnce(new Error("erro ao iniciar"));
    render(<Projetos user={contratante} />);
    await screen.findByText("EmAprov");
    await userEvent.click(screen.getByTestId("iniciar-andamento"));
    expect(await screen.findByText("erro ao iniciar")).toBeInTheDocument();
  });

  it("abre e fecha os modais (novo, editar, candidatos) pelo X", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.listarCandidatos.mockResolvedValue([]);
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");

    await userEvent.click(screen.getByTestId("novo-projeto"));
    await userEvent.click(screen.getByTestId("modal-fechar"));
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("editar-projeto"));
    await userEvent.click(screen.getByTestId("modal-fechar"));
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("ver-candidatos"));
    expect(await screen.findByText(/Ninguém se candidatou/)).toBeInTheDocument(); // lista vazia
    await userEvent.click(screen.getByTestId("modal-fechar"));
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("fecha o modal de avaliação pelo X (sem enviar)", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    render(<Projetos user={contratante} />);
    await screen.findByText("AndComEntrega");
    await userEvent.click(screen.getByTestId("concluir-projeto"));
    expect(await screen.findByTestId("enviar-avaliacao")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("modal-fechar"));
    expect(screen.queryByTestId("enviar-avaliacao")).not.toBeInTheDocument();
  });

  it("edita um projeto com endereço/telefone e altera os campos do formulário", async () => {
    api.listarContratos.mockResolvedValue([
      { id: 1, titulo: "ComContato", status: "aberto", contratanteId: 10, candidatos: [], descricao: "d", telefone: "(48) 90000-0000", endereco: "Floripa/SC" },
    ]);
    api.atualizarContrato.mockResolvedValueOnce({});
    render(<Projetos user={contratante} />);
    await screen.findByText("ComContato");
    await userEvent.click(screen.getByTestId("editar-projeto"));
    // campos vieram do projeto (projeto?.endereco/telefone)
    expect(screen.getByTestId("input-endereco-projeto")).toHaveValue("Floripa/SC");
    expect(screen.getByTestId("input-telefone-projeto")).toHaveValue("(48) 90000-0000");
    // altera descrição, telefone e endereço (onChange de cada campo)
    await userEvent.type(screen.getByTestId("input-descricao"), " (mais detalhes)");
    await userEvent.clear(screen.getByTestId("input-telefone-projeto"));
    await userEvent.type(screen.getByTestId("input-telefone-projeto"), "(11) 91111-1111");
    await userEvent.clear(screen.getByTestId("input-endereco-projeto"));
    await userEvent.type(screen.getByTestId("input-endereco-projeto"), "São José/SC");
    await userEvent.click(screen.getByTestId("salvar-projeto"));
    expect(api.atualizarContrato).toHaveBeenCalledWith(1, expect.objectContaining({ telefone: "(11) 91111-1111", endereco: "São José/SC" }));
  });

  it("novo projeto de um contratante SEM contato: campos iniciam vazios (fallback \"\")", async () => {
    api.listarContratos.mockResolvedValue([]);
    const semContato = { id: 10, papel: "contratante", email: "x@x.com" }; // sem endereco/telefone
    render(<Projetos user={semContato} />);
    await userEvent.click(await screen.findByTestId("novo-projeto"));
    expect(screen.getByTestId("input-telefone-projeto")).toHaveValue("");
    expect(screen.getByTestId("input-endereco-projeto")).toHaveValue("");
  });

  it("abre os candidatos, seleciona um e chama a API de seleção", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.listarCandidatos.mockResolvedValue([{ freelancerId: 20, nome: "Ana", media: 4.5, totalAvaliacoes: 2 }]);
    api.selecionarFreelancer.mockResolvedValueOnce({});
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("ver-candidatos"));

    const candidato = await screen.findByTestId("candidato");
    expect(within(candidato).getByText("Ana")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("selecionar-20"));
    expect(api.selecionarFreelancer).toHaveBeenCalledWith(1, 20);
  });

  it("conclui e avalia o freelancer: abre o modal, envia a avaliação e conclui o contrato", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.avaliar.mockResolvedValueOnce({});
    api.concluirContrato.mockResolvedValueOnce({});
    render(<Projetos user={contratante} />);
    await screen.findByText("AndComEntrega");

    await userEvent.click(screen.getByTestId("concluir-projeto")); // abre a Avaliação 360
    await userEvent.click(await screen.findByTestId("estrela-5"));
    await userEvent.click(screen.getByTestId("enviar-avaliacao"));

    expect(api.avaliar).toHaveBeenCalledWith(expect.objectContaining({ contratoId: 4, deId: 10, paraId: 20, nota: 5 }));
    await waitFor(() => expect(api.concluirContrato).toHaveBeenCalledWith(4)); // concluir:true
  });

  it("trata falha na conclusão do contrato sem travar (fecha o modal e recarrega)", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.avaliar.mockResolvedValueOnce({});
    api.concluirContrato.mockRejectedValueOnce(new Error("erro ao concluir"));
    render(<Projetos user={contratante} />);
    await screen.findByText("AndComEntrega");
    await userEvent.click(screen.getByTestId("concluir-projeto"));
    await userEvent.click(await screen.findByTestId("estrela-5"));
    await userEvent.click(screen.getByTestId("enviar-avaliacao"));
    // a avaliação foi enviada e a conclusão foi tentada (caiu no catch), e o modal fechou
    await waitFor(() => expect(api.concluirContrato).toHaveBeenCalledWith(4));
    await waitFor(() => expect(screen.queryByTestId("enviar-avaliacao")).not.toBeInTheDocument());
  });

  it("no modal de candidatos: mostra erro se a remoção falha", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.listarCandidatos.mockResolvedValue([{ freelancerId: 20, nome: "Ana", media: 0, totalAvaliacoes: 0 }]);
    api.removerCandidatura.mockRejectedValueOnce(new Error("erro ao remover"));
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("ver-candidatos"));
    await screen.findByTestId("candidato");
    await userEvent.click(screen.getByTestId("remover-candidato-20"));
    expect(await screen.findByText("erro ao remover")).toBeInTheDocument();
  });

  it("no modal de candidatos: remove um candidato pela API", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.listarCandidatos.mockResolvedValue([{ freelancerId: 20, nome: "Ana", media: 0, totalAvaliacoes: 0 }]);
    api.removerCandidatura.mockResolvedValueOnce({});
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("ver-candidatos"));
    await screen.findByTestId("candidato");
    await userEvent.click(screen.getByTestId("remover-candidato-20"));
    expect(api.removerCandidatura).toHaveBeenCalledWith(1, 20);
  });

  it("no modal de candidatos: mostra erro se a listagem de candidatos falha", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.listarCandidatos.mockRejectedValueOnce(new Error("falha nos candidatos"));
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("ver-candidatos"));
    expect(await screen.findByText("falha nos candidatos")).toBeInTheDocument();
  });

  it("no modal de candidatos: mostra erro se a seleção falha", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.listarCandidatos.mockResolvedValue([{ freelancerId: 20, nome: "Ana", media: 0, totalAvaliacoes: 0 }]);
    api.selecionarFreelancer.mockRejectedValueOnce(new Error("erro ao selecionar"));
    render(<Projetos user={contratante} />);
    await screen.findByText("Aberto");
    await userEvent.click(screen.getByTestId("ver-candidatos"));
    await screen.findByTestId("candidato");
    await userEvent.click(screen.getByTestId("selecionar-20"));
    expect(await screen.findByText("erro ao selecionar")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro quando a listagem falha", async () => {
    api.listarContratos.mockRejectedValueOnce(new Error("Não foi possível conectar ao servidor."));
    render(<Projetos user={contratante} />);
    expect(await screen.findByText("Não foi possível conectar ao servidor.")).toBeInTheDocument();
  });
});

describe("@interface Projetos — freelancer", () => {
  const projetos = [
    { id: 1, titulo: "AbertoLivre", status: "aberto", contratanteId: 10, candidatos: [], avaliadores: [] },
    { id: 2, titulo: "AbertoCandidatei", status: "aberto", contratanteId: 10, candidatos: [20], avaliadores: [] },
    { id: 3, titulo: "AndamentoMeu", status: "em_andamento", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [] },
    { id: 4, titulo: "AprovMeu", status: "em_aprovacao", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [] },
  ];

  it("mostra 'Candidatar-se' em vaga aberta e envia a candidatura", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.candidatar.mockResolvedValueOnce({});
    render(<Projetos user={freelancer} />);
    await screen.findByText("AbertoLivre");
    await userEvent.click(screen.getByTestId("candidatar"));
    expect(api.candidatar).toHaveBeenCalledWith(1, 20);
  });

  it("permite retirar a candidatura já enviada", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.removerCandidatura.mockResolvedValueOnce({});
    render(<Projetos user={freelancer} />);
    await screen.findByText("AbertoCandidatei");
    await userEvent.click(screen.getByTestId("retirar-candidatura"));
    expect(api.removerCandidatura).toHaveBeenCalledWith(2, 20);
  });

  it("mostra o botão de finalizar trabalho quando selecionado e em andamento", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    render(<Projetos user={freelancer} />);
    await screen.findByText("AndamentoMeu");
    expect(screen.getByTestId("finalizar-trabalho")).toBeInTheDocument();
    // em_aprovacao selecionado → mensagem de "foi selecionado"
    expect(screen.getByText(/Você foi selecionado/)).toBeInTheDocument();
  });

  it("finaliza o trabalho enviando o feedback (avaliação) ao contratante", async () => {
    api.listarContratos.mockResolvedValue(projetos);
    api.avaliar.mockResolvedValueOnce({});
    render(<Projetos user={freelancer} />);
    await screen.findByText("AndamentoMeu");
    await userEvent.click(screen.getByTestId("finalizar-trabalho"));
    await userEvent.click(await screen.findByTestId("estrela-4"));
    await userEvent.click(screen.getByTestId("enviar-avaliacao"));
    // paraId = contratante; concluir:false (freelancer não conclui o projeto)
    expect(api.avaliar).toHaveBeenCalledWith(expect.objectContaining({ contratoId: 3, deId: 20, paraId: 10, nota: 4 }));
    expect(api.concluirContrato).not.toHaveBeenCalled();
  });

  it("mostra os estados finais do freelancer: feedback enviado e projeto concluído", async () => {
    api.listarContratos.mockResolvedValue([
      { id: 3, titulo: "JaAvaliei", status: "em_andamento", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [20] },
      { id: 5, titulo: "Concluido", status: "concluido", contratanteId: 10, freelancerId: 20, candidatos: [20], avaliadores: [10, 20] },
    ]);
    render(<Projetos user={freelancer} />);
    await screen.findByText("JaAvaliei");
    expect(screen.getByText(/Feedback enviado/)).toBeInTheDocument();  // jaAvaliei
    expect(screen.getByText(/Projeto concluído/)).toBeInTheDocument(); // concluido
  });
});
