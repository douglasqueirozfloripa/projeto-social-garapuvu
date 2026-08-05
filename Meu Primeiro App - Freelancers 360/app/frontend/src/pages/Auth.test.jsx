// Teste de INTERFACE (componente) — Auth (login/cadastro).
// Mocka api.js para não tocar a rede.
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../api.js", () => ({ api: { login: vi.fn(), cadastrar: vi.fn() } }));
import { api } from "../api.js";
import Auth from "./Auth.jsx";

beforeEach(() => vi.clearAllMocks());

describe("@interface Auth", () => {
  it("no modo login não pede nome; ao trocar para 'Criar conta' mostra nome e papel", async () => {
    render(<Auth modoInicial="login" onLogin={() => {}} onVoltar={() => {}} />);
    expect(screen.queryByTestId("input-nome")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("tab-criar-conta"));
    expect(screen.getByTestId("input-nome")).toBeInTheDocument();
    expect(screen.getByTestId("input-papel")).toBeInTheDocument();
    // volta para a aba Entrar → some o campo nome
    await userEvent.click(screen.getByTestId("tab-entrar"));
    expect(screen.queryByTestId("input-nome")).not.toBeInTheDocument();
  });

  it("faz login e chama onLogin com o usuário retornado pela API", async () => {
    const user = { id: 7, nome: "Ana", papel: "freelancer" };
    api.login.mockResolvedValueOnce(user);
    const onLogin = vi.fn();
    render(<Auth modoInicial="login" onLogin={onLogin} onVoltar={() => {}} />);

    await userEvent.type(screen.getByTestId("input-email"), "ana@x.com");
    await userEvent.type(screen.getByTestId("input-senha"), "1234");
    await userEvent.click(screen.getByTestId("enviar-auth"));

    expect(api.login).toHaveBeenCalledWith({ email: "ana@x.com", senha: "1234" });
    expect(onLogin).toHaveBeenCalledWith(user);
  });

  it("faz cadastro enviando o formulário completo para api.cadastrar", async () => {
    const user = { id: 8, nome: "Bruno", papel: "contratante" };
    api.cadastrar.mockResolvedValueOnce(user);
    const onLogin = vi.fn();
    render(<Auth modoInicial="cadastro" onLogin={onLogin} onVoltar={() => {}} />);

    await userEvent.type(screen.getByTestId("input-nome"), "Bruno");
    await userEvent.selectOptions(screen.getByTestId("input-papel"), "contratante");
    await userEvent.type(screen.getByTestId("input-email"), "bruno@x.com");
    await userEvent.type(screen.getByTestId("input-senha"), "1234");
    await userEvent.click(screen.getByTestId("enviar-auth"));

    expect(api.cadastrar).toHaveBeenCalledTimes(1);
    expect(api.cadastrar.mock.calls[0][0]).toMatchObject({ nome: "Bruno", email: "bruno@x.com", senha: "1234", papel: "contratante" });
    expect(onLogin).toHaveBeenCalledWith(user);
  });

  it("mostra a mensagem de erro quando a API rejeita o login", async () => {
    api.login.mockRejectedValueOnce(new Error("e-mail ou senha inválidos"));
    render(<Auth modoInicial="login" onLogin={() => {}} onVoltar={() => {}} />);
    await userEvent.type(screen.getByTestId("input-email"), "x@x.com");
    await userEvent.type(screen.getByTestId("input-senha"), "9999");
    await userEvent.click(screen.getByTestId("enviar-auth"));
    expect(await screen.findByText("e-mail ou senha inválidos")).toBeInTheDocument();
  });

  it("botão 'Voltar' chama onVoltar", async () => {
    const onVoltar = vi.fn();
    render(<Auth modoInicial="login" onLogin={() => {}} onVoltar={onVoltar} />);
    await userEvent.click(screen.getByTestId("voltar-landing"));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});
