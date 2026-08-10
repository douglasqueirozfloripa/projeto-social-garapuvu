// Interface: o botão "Entrar com Google" é gated pela flag login_google.
// Demonstra o teste de flag nos DOIS estados (ligada x desligada).
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Auth from "./Auth.jsx";

vi.mock("../api.js", () => ({
  api: { listarFlags: vi.fn(), login: vi.fn(), cadastrar: vi.fn(), loginGoogle: vi.fn() },
}));
import { api } from "../api.js";

beforeEach(() => { api.loginGoogle.mockReset(); });

describe("@interface Login com Google (flag login_google)", () => {
  it("DESLIGADA: não mostra o botão do Google", async () => {
    api.listarFlags.mockResolvedValue([{ nome: "login_google", descricao: "x", ativa: false }]);
    render(<Auth modoInicial="login" onLogin={vi.fn()} onVoltar={vi.fn()} />);
    // espera o hook carregar as flags
    await waitFor(() => expect(api.listarFlags).toHaveBeenCalled());
    expect(screen.queryByTestId("entrar-google")).toBeNull();
  });

  it("LIGADA: mostra o botão e ao clicar chama loginGoogle com o e-mail", async () => {
    api.listarFlags.mockResolvedValue([{ nome: "login_google", descricao: "x", ativa: true }]);
    api.loginGoogle.mockResolvedValue({ id: 1, nome: "Ana" });
    const onLogin = vi.fn();
    render(<Auth modoInicial="login" onLogin={onLogin} onVoltar={vi.fn()} />);
    const botao = await screen.findByTestId("entrar-google");
    fireEvent.change(screen.getByTestId("input-email"), { target: { value: "ana@x.com" } });
    fireEvent.click(botao);
    await waitFor(() => expect(api.loginGoogle).toHaveBeenCalledWith("ana@x.com"));
    await waitFor(() => expect(onLogin).toHaveBeenCalled());
  });
});
