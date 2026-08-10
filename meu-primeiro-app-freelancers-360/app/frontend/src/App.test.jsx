// Teste de INTERFACE (componente) — App: autenticação, navegação e LOGOUT.
// As páginas são mockadas para isolar a lógica de sessão (login/logout/localStorage).
// Complementa o E2E de logout com um teste de unidade rápido.
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Landing e Auth mockados: expõem botões que disparam os callbacks do App.
vi.mock("./pages/Landing.jsx", () => ({
  default: ({ onEntrar, onCadastrar }) => (
    <div>
      <button onClick={onCadastrar}>ir-cadastro</button>
      <button onClick={onEntrar}>ir-login</button>
    </div>
  ),
}));
vi.mock("./pages/Auth.jsx", () => ({
  default: ({ onLogin, onVoltar }) => (
    <div>
      <button onClick={() => onLogin({ id: 1, nome: "Ana", papel: "freelancer" })}>fazer-login</button>
      <button onClick={onVoltar}>voltar</button>
    </div>
  ),
}));
vi.mock("./pages/Projetos.jsx", () => ({ default: () => <div>projetos-mock</div> }));
vi.mock("./pages/Perfil.jsx", () => ({ default: () => <div>perfil-mock</div> }));
// api.js mockado: o logout avisa o servidor (api.logout) antes de limpar a sessão.
vi.mock("./api.js", () => ({ api: { logout: vi.fn().mockResolvedValue({ ok: true }) } }));
import { api } from "./api.js";

import App from "./App.jsx";

const CHAVE = "freelavalia_user";
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); api.logout.mockResolvedValue({ ok: true }); });

describe("@interface App (auth + logout)", () => {
  it("inicia deslogado na Landing e navega até a tela de login", async () => {
    render(<App />);
    expect(screen.getByText("ir-login")).toBeInTheDocument();
    await userEvent.click(screen.getByText("ir-login"));
    expect(screen.getByText("fazer-login")).toBeInTheDocument();
  });

  it("navega da Landing para o cadastro e volta para a Landing", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("ir-cadastro")); // onCadastrar → tela de Auth
    expect(screen.getByText("voltar")).toBeInTheDocument();
    await userEvent.click(screen.getByText("voltar"));       // onVoltar → Landing
    expect(screen.getByText("ir-login")).toBeInTheDocument();
  });

  it("faz login, entra no app e persiste a sessão no localStorage", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("ir-login"));
    await userEvent.click(screen.getByText("fazer-login"));

    expect(screen.getByTestId("nav-projetos")).toBeInTheDocument();
    expect(screen.getByTestId("userchip")).toHaveTextContent("Ana · freelancer");
    expect(JSON.parse(localStorage.getItem(CHAVE))).toMatchObject({ id: 1, nome: "Ana" });
  });

  it("faz LOGOUT: limpa o localStorage e volta para a Landing", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("ir-login"));
    await userEvent.click(screen.getByText("fazer-login"));
    expect(screen.getByTestId("btn-sair")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("btn-sair"));

    expect(api.logout).toHaveBeenCalledWith(1);              // avisou o servidor com o id do usuário
    expect(localStorage.getItem(CHAVE)).toBeNull();          // sessão limpa
    expect(screen.getByText("ir-login")).toBeInTheDocument(); // de volta à Landing
    expect(screen.queryByTestId("nav-projetos")).not.toBeInTheDocument();
  });

  it("desloga localmente MESMO se a API de logout falhar (não prende o usuário)", async () => {
    api.logout.mockRejectedValueOnce(new Error("Não foi possível conectar ao servidor."));
    render(<App />);
    await userEvent.click(screen.getByText("ir-login"));
    await userEvent.click(screen.getByText("fazer-login"));
    await userEvent.click(screen.getByTestId("btn-sair"));

    expect(api.logout).toHaveBeenCalledWith(1);
    expect(localStorage.getItem(CHAVE)).toBeNull();          // limpou apesar do erro
    expect(screen.getByText("ir-login")).toBeInTheDocument(); // voltou à Landing
  });

  it("não quebra se o localStorage estiver corrompido (JSON inválido) — mostra a Landing", () => {
    localStorage.setItem(CHAVE, "isto-nao-e-json{");
    render(<App />);
    expect(screen.getByText("ir-login")).toBeInTheDocument(); // caiu no catch → deslogado
    expect(screen.queryByTestId("nav-projetos")).not.toBeInTheDocument();
  });

  it("restaura a sessão salva no localStorage ao montar (fica logado)", () => {
    localStorage.setItem(CHAVE, JSON.stringify({ id: 2, nome: "Bruno", papel: "contratante" }));
    render(<App />);
    expect(screen.getByTestId("userchip")).toHaveTextContent("Bruno · contratante");
  });

  it("alterna entre as abas Projetos e Meu perfil", async () => {
    localStorage.setItem(CHAVE, JSON.stringify({ id: 3, nome: "Carla", papel: "freelancer" }));
    render(<App />);
    expect(screen.getByText("projetos-mock")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("nav-perfil"));
    expect(screen.getByText("perfil-mock")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("nav-projetos"));
    expect(screen.getByText("projetos-mock")).toBeInTheDocument();
  });
});
