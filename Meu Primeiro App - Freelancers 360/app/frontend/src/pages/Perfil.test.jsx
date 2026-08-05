// Teste de INTERFACE (componente) — Perfil (reputação + edição de contato).
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../api.js", () => ({ api: { buscarUsuario: vi.fn(), atualizarUsuario: vi.fn() } }));
import { api } from "../api.js";
import Perfil from "./Perfil.jsx";

const user = { id: 5, nome: "Ana", papel: "freelancer", telefone: "(48) 90000-0000", endereco: "Floripa/SC" };
beforeEach(() => vi.clearAllMocks());

describe("@interface Perfil", () => {
  it("carrega e exibe a reputação (média e total de avaliações)", async () => {
    api.buscarUsuario.mockResolvedValueOnce({ media: 4.5, totalAvaliacoes: 2 });
    render(<Perfil user={user} aoAtualizar={() => {}} />);
    expect(await screen.findByText(/em 2 avaliação/)).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("salva os dados e chama aoAtualizar, mostrando a confirmação", async () => {
    api.buscarUsuario.mockResolvedValueOnce({ media: 0, totalAvaliacoes: 0 });
    api.atualizarUsuario.mockResolvedValueOnce({ nome: "Ana Silva", telefone: "(48) 91111-1111", endereco: "São José/SC" });
    const aoAtualizar = vi.fn();
    render(<Perfil user={user} aoAtualizar={aoAtualizar} />);

    await waitFor(() => expect(screen.getByTestId("input-perfil-nome")).toHaveValue("Ana"));
    await userEvent.clear(screen.getByTestId("input-perfil-nome"));
    await userEvent.type(screen.getByTestId("input-perfil-nome"), "Ana Silva");
    await userEvent.clear(screen.getByTestId("input-perfil-telefone"));
    await userEvent.type(screen.getByTestId("input-perfil-telefone"), "(48) 91111-1111");
    await userEvent.clear(screen.getByTestId("input-perfil-endereco"));
    await userEvent.type(screen.getByTestId("input-perfil-endereco"), "São José/SC");
    await userEvent.click(screen.getByTestId("salvar-perfil"));

    expect(api.atualizarUsuario).toHaveBeenCalledWith(5, expect.objectContaining({ nome: "Ana Silva" }));
    expect(aoAtualizar).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId("perfil-salvo")).toBeInTheDocument();
  });

  it("mostra erro quando a busca da reputação falha", async () => {
    api.buscarUsuario.mockRejectedValueOnce(new Error("falha ao carregar"));
    render(<Perfil user={user} aoAtualizar={() => {}} />);
    expect(await screen.findByText("falha ao carregar")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro quando o salvamento falha", async () => {
    api.buscarUsuario.mockResolvedValueOnce({ media: 0, totalAvaliacoes: 0 });
    api.atualizarUsuario.mockRejectedValueOnce(new Error("nome não pode ficar vazio"));
    render(<Perfil user={user} aoAtualizar={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("salvar-perfil")).toBeEnabled());
    await userEvent.click(screen.getByTestId("salvar-perfil"));
    expect(await screen.findByText("nome não pode ficar vazio")).toBeInTheDocument();
  });

  it("inicia os campos vazios quando o usuário não tem nome/telefone/endereço", async () => {
    api.buscarUsuario.mockResolvedValueOnce({ media: 0, totalAvaliacoes: 0 });
    const minimo = { id: 6, papel: "freelancer" }; // sem nome/telefone/endereco
    render(<Perfil user={minimo} aoAtualizar={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("input-perfil-nome")).toBeInTheDocument());
    expect(screen.getByTestId("input-perfil-nome")).toHaveValue("");
    expect(screen.getByTestId("input-perfil-telefone")).toHaveValue("");
    expect(screen.getByTestId("input-perfil-endereco")).toHaveValue("");
  });
});
