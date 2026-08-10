// Teste de INTERFACE (componente) — Dashboard (painel inicial).
//
// A API é mockada: o que se testa aqui é a TELA (o que aparece, com que
// semântica e para onde os atalhos levam), não o backend. Os cálculos por trás
// dos números já têm cobertura unitária em painel.test.js.
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../api.js", () => ({
  api: { listarContratos: vi.fn(), buscarUsuario: vi.fn() },
}));
import { api } from "../api.js";
import Dashboard from "./Dashboard.jsx";

const contratante = { id: 1, nome: "Douglas Queiroz", papel: "contratante" };
const freela = { id: 9, nome: "Ana Freela", papel: "freelancer" };

const contrato = (campos) => ({
  id: 1, titulo: "Projeto", contratanteId: 1, freelancerId: null,
  status: "aberto", candidatos: [], avaliadores: [], ...campos,
});

// Monta o painel já com a API respondendo o que o teste precisa.
function montar({ user = contratante, contratos = [], media = 0, totalAvaliacoes = 0 } = {}) {
  api.listarContratos.mockResolvedValue(contratos);
  api.buscarUsuario.mockResolvedValue({ ...user, media, totalAvaliacoes });
  const aoNavegar = vi.fn();
  render(<Dashboard user={user} aoNavegar={aoNavegar} />);
  return { aoNavegar };
}

// Lê o valor mostrado em um cartão de número.
const numero = (id) => within(screen.getByTestId(`numero-${id}`));

beforeEach(() => vi.clearAllMocks());

describe("@interface Dashboard (estrutura e semântica)", () => {
  it("dá boas-vindas usando só o primeiro nome, em um <h1> único", async () => {
    montar();
    const titulo = await screen.findByRole("heading", { level: 1 });
    expect(titulo).toHaveTextContent("Olá, Douglas");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("organiza a tela em seções com título de nível 2", async () => {
    montar();
    await screen.findByTestId("painel-numeros");
    const titulos = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titulos).toContain("Seu resumo");
    expect(titulos).toContain("Módulos");
  });

  it("liga cada rótulo ao seu número numa lista de definições (dt + dd)", async () => {
    montar({ contratos: [contrato({ candidatos: [9] })] });
    await screen.findByTestId("painel-numeros");

    // O leitor de tela anuncia "Projetos publicados, 1" porque dt e dd estão no
    // mesmo grupo — e não um "1" solto perdido na tela.
    const cartao = screen.getByTestId("numero-publicados");
    expect(cartao.querySelector("dt")).toHaveTextContent("Projetos publicados");
    expect(cartao.querySelector("dd")).toHaveTextContent("1");
  });

  it("avisa que está carregando sem roubar o foco, e o aviso sai ao terminar", async () => {
    montar();
    // <output> tem role="status" implícito: é anunciado, não focado.
    expect(screen.getByTestId("painel-carregando")).toBeInTheDocument();
    expect(document.body).toHaveFocus();

    // Espera os dados chegarem: o aviso some e dá lugar aos números.
    await screen.findByTestId("painel-numeros");
    expect(screen.queryByTestId("painel-carregando")).not.toBeInTheDocument();
  });
});

describe("@interface Dashboard (números por papel)", () => {
  it("mostra os números do CONTRATANTE", async () => {
    montar({
      user: contratante,
      contratos: [
        contrato({ id: 1, candidatos: [9, 10] }),
        contrato({ id: 2, status: "em_andamento", freelancerId: 9 }),
        contrato({ id: 3, status: "concluido", freelancerId: 9 }),
      ],
    });

    await screen.findByTestId("painel-numeros");
    expect(numero("publicados").getByText("1")).toBeInTheDocument();
    expect(numero("candidaturas").getByText("2")).toBeInTheDocument();
    expect(numero("em-processo").getByText("1")).toBeInTheDocument();
    expect(numero("concluidos").getByText("1")).toBeInTheDocument();
  });

  it("mostra os números do FREELANCER (rótulos diferentes)", async () => {
    montar({
      user: freela,
      contratos: [contrato({ id: 1, candidatos: [9] }), contrato({ id: 2 })],
    });

    await screen.findByTestId("painel-numeros");
    expect(screen.getByText("Vagas abertas")).toBeInTheDocument();
    expect(screen.getByText("Minhas candidaturas")).toBeInTheDocument();
    expect(screen.queryByText("Projetos publicados")).not.toBeInTheDocument();
    expect(numero("vagas").getByText("2")).toBeInTheDocument();
  });

  it("mostra a reputação com as estrelas e o total de avaliações", async () => {
    montar({ media: 4.5, totalAvaliacoes: 2 });
    await screen.findByTestId("numero-reputacao");

    const cartao = numero("reputacao");
    expect(cartao.getByText("4.5")).toBeInTheDocument();
    expect(cartao.getByText(/2 avaliação\(ões\)/)).toBeInTheDocument();
    expect(cartao.getByRole("group", { name: "Nota de 1 a 5" })).toBeInTheDocument();
  });
});

describe("@interface Dashboard (próximo passo)", () => {
  it("sugere publicar o primeiro projeto para quem não tem nenhum", async () => {
    montar({ contratos: [] });
    const passo = await screen.findByTestId("painel-passo");
    expect(passo).toHaveTextContent(/primeiro projeto/i);
  });

  it("o botão do próximo passo navega para o módulo indicado", async () => {
    const { aoNavegar } = montar({ contratos: [contrato({ candidatos: [9] })] });
    const botao = await screen.findByTestId("painel-passo-acao");
    expect(botao).toHaveTextContent("Ver candidatos");

    await userEvent.click(botao);
    expect(aoNavegar).toHaveBeenCalledWith("projetos");
  });

  it("manda o freelancer sem vagas cuidar do perfil", async () => {
    const { aoNavegar } = montar({ user: freela, contratos: [] });
    await userEvent.click(await screen.findByTestId("painel-passo-acao"));
    expect(aoNavegar).toHaveBeenCalledWith("perfil");
  });
});

describe("@interface Dashboard (atalhos dos módulos)", () => {
  it("mostra um atalho por módulo, menos para a própria tela inicial", async () => {
    montar();
    await screen.findByTestId("atalho-projetos");

    expect(screen.getByTestId("atalho-perfil")).toBeInTheDocument();
    expect(screen.getByTestId("atalho-flags")).toBeInTheDocument();
    expect(screen.queryByTestId("atalho-inicio")).not.toBeInTheDocument();
  });

  it("cada atalho é um botão de verdade (foco e Enter de graça)", async () => {
    const { aoNavegar } = montar();
    const atalho = await screen.findByTestId("atalho-projetos");
    expect(atalho.tagName).toBe("BUTTON");

    atalho.focus();
    await userEvent.keyboard("{Enter}");
    expect(aoNavegar).toHaveBeenCalledWith("projetos");
  });

  it("descreve o módulo Projetos conforme o papel de quem olha", async () => {
    montar({ user: contratante });
    expect(await screen.findByText(/Publique vagas, veja os candidatos/i)).toBeInTheDocument();
  });

  it("para o freelancer, a descrição de Projetos fala de candidatura", async () => {
    montar({ user: freela });
    expect(await screen.findByText(/candidate-se/i)).toBeInTheDocument();
  });
});

describe("@interface Dashboard (API fora do ar)", () => {
  it("mostra o erro MAS mantém os atalhos na tela", async () => {
    api.listarContratos.mockRejectedValue(new Error("Não foi possível conectar ao servidor."));
    api.buscarUsuario.mockRejectedValue(new Error("Não foi possível conectar ao servidor."));
    render(<Dashboard user={contratante} aoNavegar={vi.fn()} />);

    const erro = await screen.findByTestId("painel-erro");
    expect(erro).toHaveTextContent(/não foi possível conectar/i);

    // O que importa: a navegação NÃO depende dos números.
    expect(screen.getByTestId("atalho-projetos")).toBeInTheDocument();
    expect(screen.getByTestId("atalho-perfil")).toBeInTheDocument();
    expect(screen.queryByTestId("painel-numeros")).not.toBeInTheDocument();
    expect(screen.queryByTestId("painel-carregando")).not.toBeInTheDocument();
  });

  it("os atalhos continuam navegando mesmo com a API fora", async () => {
    api.listarContratos.mockRejectedValue(new Error("falhou"));
    api.buscarUsuario.mockRejectedValue(new Error("falhou"));
    const aoNavegar = vi.fn();
    render(<Dashboard user={contratante} aoNavegar={aoNavegar} />);

    await userEvent.click(await screen.findByTestId("atalho-perfil"));
    expect(aoNavegar).toHaveBeenCalledWith("perfil");
  });
});
