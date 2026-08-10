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
// O painel inicial é mockado com um botão que dispara aoNavegar: dá para testar
// a navegação DE dentro do painel sem depender da tela real dele (que tem os
// próprios testes em pages/Dashboard.test.jsx).
vi.mock("./pages/Dashboard.jsx", () => ({
  default: ({ aoNavegar }) => (
    <div>
      dashboard-mock
      <button onClick={() => aoNavegar("perfil")}>atalho-para-perfil</button>
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
    await userEvent.click(screen.getByTestId("nav-projetos"));
    expect(screen.getByText("projetos-mock")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("nav-perfil"));
    expect(screen.getByText("perfil-mock")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("nav-projetos"));
    expect(screen.getByText("projetos-mock")).toBeInTheDocument();
  });
});

// A casca logada: qual tela abre primeiro e os recursos de acessibilidade que
// valem para TODAS as páginas (skip link, <main> nomeado, aviso de seção).
describe("@interface App (painel inicial e acessibilidade da casca)", () => {
  const entrar = (user = { id: 3, nome: "Carla", papel: "freelancer" }) => {
    localStorage.setItem(CHAVE, JSON.stringify(user));
    render(<App />);
  };

  it("abre no PAINEL depois do login (não mais em Projetos)", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("ir-login"));
    await userEvent.click(screen.getByText("fazer-login"));

    expect(screen.getByText("dashboard-mock")).toBeInTheDocument();
    expect(screen.queryByText("projetos-mock")).not.toBeInTheDocument();
  });

  it("marca Início como página atual ao entrar", () => {
    entrar();
    expect(screen.getByTestId("nav-inicio")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("nav-projetos")).not.toHaveAttribute("aria-current");
  });

  it("move o aria-current ao navegar", async () => {
    entrar();
    await userEvent.click(screen.getByTestId("nav-projetos"));

    expect(screen.getByTestId("nav-projetos")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("nav-inicio")).not.toHaveAttribute("aria-current");
  });

  it("os atalhos do painel navegam entre os módulos", async () => {
    entrar();
    await userEvent.click(screen.getByText("atalho-para-perfil"));
    expect(screen.getByText("perfil-mock")).toBeInTheDocument();
  });

  it("oferece 'Pular para o conteúdo' apontando para o <main>", () => {
    entrar();
    const link = screen.getByRole("link", { name: "Pular para o conteúdo" });
    expect(link).toHaveAttribute("href", "#conteudo");
    // O destino precisa existir e poder receber foco por programa (tabindex=-1).
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "conteudo");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it("é o PRIMEIRO elemento a receber foco (antes do menu)", async () => {
    entrar();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveFocus();
  });

  it("anuncia a seção atual para quem usa leitor de tela", async () => {
    entrar();
    expect(screen.getByTestId("aviso-secao")).toHaveTextContent("Seção atual: Início");

    await userEvent.click(screen.getByTestId("nav-projetos"));
    expect(screen.getByTestId("aviso-secao")).toHaveTextContent("Seção atual: Projetos");
  });

  it("volta para o painel ao entrar de novo depois de sair de outra aba", async () => {
    entrar({ id: 4, nome: "Dan", papel: "contratante" });
    await userEvent.click(screen.getByTestId("nav-projetos"));
    await userEvent.click(screen.getByTestId("btn-sair"));   // volta à Landing
    await userEvent.click(screen.getByText("ir-login"));
    await userEvent.click(screen.getByText("fazer-login"));

    // A sessão nova começa do zero, no painel — e não na aba antiga.
    expect(screen.getByText("dashboard-mock")).toBeInTheDocument();
  });
});
