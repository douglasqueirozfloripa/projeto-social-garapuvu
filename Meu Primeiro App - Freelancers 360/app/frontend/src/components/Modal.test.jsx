// Teste de INTERFACE (componente) — Modal.
// TAG: @interface
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal.jsx";

describe("@interface Modal", () => {
  it("mostra título e conteúdo (children)", () => {
    render(<Modal titulo="Título X" aoFechar={() => {}}><p>conteúdo interno</p></Modal>);
    expect(screen.getByText("Título X")).toBeInTheDocument();
    expect(screen.getByText("conteúdo interno")).toBeInTheDocument();
  });

  it("fecha no X e ao clicar fora (overlay), mas NÃO ao clicar dentro", async () => {
    const aoFechar = vi.fn();
    render(<Modal titulo="T" aoFechar={aoFechar}><p>dentro</p></Modal>);

    // clicar dentro do modal não fecha (stopPropagation)
    await userEvent.click(screen.getByText("dentro"));
    expect(aoFechar).not.toHaveBeenCalled();

    // clicar no X fecha
    await userEvent.click(screen.getByTestId("modal-fechar"));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });
});
