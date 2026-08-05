// Testes de INTERFACE do painel de flags (topo da pirâmide, com Testing Library).
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Flags from "./Flags.jsx";

vi.mock("../api.js", () => ({
  api: { listarFlags: vi.fn(), definirFlag: vi.fn().mockResolvedValue({}) },
}));
import { api } from "../api.js";

const FLAGS = [
  { nome: "login_google", descricao: "Login social com Google", ativa: false },
  { nome: "modo_manutencao", descricao: "Bloqueia o sistema", ativa: true },
];

beforeEach(() => {
  api.listarFlags.mockResolvedValue(FLAGS);
  api.definirFlag.mockClear();
});

describe("@interface Painel de flags", () => {
  it("lista as flags com o estado (LIGADA/desligada)", async () => {
    render(<Flags />);
    expect(await screen.findByTestId("flag-login_google")).toHaveTextContent("desligada");
    expect(screen.getByTestId("flag-modo_manutencao")).toHaveTextContent("LIGADA");
  });

  it("ao clicar em Ligar, chama a API com o novo estado", async () => {
    render(<Flags />);
    fireEvent.click(await screen.findByTestId("toggle-login_google"));
    await waitFor(() => expect(api.definirFlag).toHaveBeenCalledWith("login_google", true));
  });
});
