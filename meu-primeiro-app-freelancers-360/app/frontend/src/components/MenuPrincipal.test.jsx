// Teste de INTERFACE (componente) — MenuPrincipal.
//
// O foco aqui é a ACESSIBILIDADE, e é por isso que teste de componente é o
// lugar ideal: as consultas do Testing Library (getByRole, aria-*) enxergam a
// tela do mesmo jeito que um leitor de tela. Se o teste só passa com
// getByTestId, é sinal de que a semântica está faltando.
//
// O que está coberto:
//  • nome acessível da região de navegação e da lista de itens
//  • aria-current="page" marcando só o módulo atual
//  • aria-expanded/aria-controls do botão ☰ e o par abrir/fechar
//  • Esc fecha a gaveta E devolve o foco ao ☰ (WCAG 2.1.2)
//  • abrir leva o foco ao 1º item; escolher fecha e devolve o foco
//  • setas ↑↓ circulam entre os itens
//  • emojis decorativos ficam fora do nome acessível
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenuPrincipal from "./MenuPrincipal.jsx";

const user = { id: 1, nome: "Douglas Queiroz", papel: "contratante" };

function montar(props = {}) {
  const aoNavegar = vi.fn();
  const aoSair = vi.fn();
  const utils = render(
    <MenuPrincipal atual="inicio" aoNavegar={aoNavegar} user={user} aoSair={aoSair} {...props} />,
  );
  return { aoNavegar, aoSair, ...utils };
}

const toggle = () => screen.getByRole("button", { name: /abrir menu|fechar menu/i });

beforeEach(() => vi.clearAllMocks());

describe("@interface MenuPrincipal (semântica)", () => {
  it("expõe uma região de navegação com nome acessível", () => {
    montar();
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toBeInTheDocument();
  });

  it("apresenta os módulos como uma lista (o leitor anuncia quantos são)", () => {
    montar();
    const lista = screen.getByRole("list");
    expect(within(lista).getAllByRole("listitem")).toHaveLength(4);
  });

  it("cada módulo é um botão localizável pelo nome visível", () => {
    montar();
    for (const nome of ["Início", "Projetos", "Meu perfil", "Flags"]) {
      expect(screen.getByRole("button", { name: nome })).toBeInTheDocument();
    }
  });

  it("não deixa o emoji decorativo entrar no nome acessível", () => {
    montar();
    // O nome é exatamente "Início" — sem o 🏠, que tem aria-hidden.
    const inicio = screen.getByRole("button", { name: "Início" });
    expect(inicio).toHaveAccessibleName("Início");
  });

  it("marca APENAS o módulo atual com aria-current=page", () => {
    montar({ atual: "projetos" });

    expect(screen.getByRole("button", { name: "Projetos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Início" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Flags" })).not.toHaveAttribute("aria-current");
  });

  it("mostra quem está logado e o papel", () => {
    montar();
    expect(screen.getByTestId("userchip")).toHaveTextContent("Douglas Queiroz · contratante");
  });
});

describe("@interface MenuPrincipal (navegação)", () => {
  it("avisa qual módulo foi escolhido", async () => {
    const { aoNavegar } = montar();
    await userEvent.click(screen.getByRole("button", { name: "Meu perfil" }));
    expect(aoNavegar).toHaveBeenCalledWith("perfil");
  });

  it("chama o logout no botão Sair", async () => {
    const { aoSair } = montar();
    await userEvent.click(screen.getByTestId("btn-sair"));
    expect(aoSair).toHaveBeenCalledTimes(1);
  });
});

describe("@interface MenuPrincipal (gaveta ☰ no celular)", () => {
  it("começa fechada, com aria-expanded=false apontando para a nav", () => {
    montar();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveAttribute("aria-controls", "menu-principal");
    // aria-controls precisa apontar para um id que EXISTE.
    expect(document.getElementById("menu-principal")).toBeInTheDocument();
  });

  it("abre e fecha alternando aria-expanded e o rótulo do botão", async () => {
    montar();
    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(toggle()).toHaveAccessibleName("Fechar menu");

    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveAccessibleName("Abrir menu");
  });

  it("leva o foco ao primeiro item ao abrir", async () => {
    montar();
    await userEvent.click(toggle());
    expect(screen.getByRole("button", { name: "Início" })).toHaveFocus();
  });

  it("Esc fecha a gaveta E devolve o foco ao botão ☰", async () => {
    montar();
    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");

    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus(); // não deixa o foco perdido no vazio
  });

  it("escolher um módulo fecha a gaveta e devolve o foco ao ☰", async () => {
    const { aoNavegar } = montar();
    await userEvent.click(toggle());
    await userEvent.click(screen.getByRole("button", { name: "Flags" }));

    expect(aoNavegar).toHaveBeenCalledWith("flags");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveFocus();
  });

  it("clicar no fundo escuro fecha a gaveta", async () => {
    montar();
    await userEvent.click(toggle());
    expect(screen.getByTestId("menu-fundo")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("menu-fundo"));

    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("menu-fundo")).not.toBeInTheDocument();
  });
});

describe("@interface MenuPrincipal (teclado)", () => {
  it("setas para baixo/cima circulam entre os itens", async () => {
    montar();
    await userEvent.click(toggle()); // foco no 1º item (Início)

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Projetos" })).toHaveFocus();

    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: "Início" })).toHaveFocus();

    // Para trás no primeiro item: volta pelo fim da lista (é circular).
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByTestId("btn-sair")).toHaveFocus();
  });

  it("é operável só com Tab e Enter, sem mouse", async () => {
    const { aoNavegar } = montar();
    await userEvent.tab();                      // ☰
    expect(toggle()).toHaveFocus();
    await userEvent.keyboard("{Enter}");        // abre → foco no 1º item
    await userEvent.tab();                      // Projetos
    await userEvent.keyboard("{Enter}");

    expect(aoNavegar).toHaveBeenCalledWith("projetos");
  });
});
