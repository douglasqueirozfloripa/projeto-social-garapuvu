// Teste de INTERFACE (componente) — Icone.
//
// O contrato deste componente é curto e importa muito para a acessibilidade:
// o ícone é DECORAÇÃO. Se um dia ele deixar de sair com aria-hidden, todo botão
// da interface passa a ter o desenho no nome acessível — e o leitor de tela
// começa a anunciar ruído. É isso que estes testes travam.
// TAG: @interface
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Icone from "./Icone.jsx";

const svg = (nome) => document.querySelector(`svg[data-icone="${nome}"]`);

describe("@interface Icone", () => {
  it("desenha o ícone pedido", () => {
    render(<Icone nome="home" />);
    expect(svg("home")).toBeInTheDocument();
  });

  it("fica FORA da árvore de acessibilidade (é decoração)", () => {
    render(<Icone nome="flag" />);
    const icone = svg("flag");
    expect(icone).toHaveAttribute("aria-hidden", "true");
    expect(icone).toHaveAttribute("focusable", "false");
  });

  it("não vira imagem para o leitor de tela", () => {
    render(<Icone nome="user" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("herda a cor do texto ao redor (stroke=currentColor)", () => {
    // É o que faz o ícone sair branco no cabeçalho escuro e verde no item ativo.
    render(<Icone nome="clipboard-list" />);
    expect(svg("clipboard-list")).toHaveAttribute("stroke", "currentColor");
  });

  it("aceita tamanho customizado", () => {
    render(<Icone nome="lightbulb" tamanho={32} />);
    const icone = svg("lightbulb");
    expect(icone).toHaveAttribute("width", "32");
    expect(icone).toHaveAttribute("height", "32");
    expect(icone).toHaveAttribute("viewBox", "0 0 24 24"); // o desenho não distorce
  });

  it("nome desconhecido não desenha nada (e não quebra a tela)", () => {
    const { container } = render(<Icone nome="nao-existe" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("tem um desenho para cada ícone usado na interface", () => {
    // Se alguém apagar um traço sem querer, o ícone sumiria silenciosamente.
    for (const nome of ["home", "clipboard-list", "user", "flag", "menu", "x", "lightbulb", "arrow-right"]) {
      const { unmount } = render(<Icone nome={nome} />);
      expect(svg(nome)).toBeInTheDocument();
      unmount();
    }
  });
});
