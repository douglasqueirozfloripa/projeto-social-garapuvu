// Teste de INTERFACE (componente) com Vitest + React Testing Library.
// TAG: @interface  → grep: grep -rl "@interface" frontend/src  |  rodar: vitest -t "@interface"
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Estrelas from "./Estrelas.jsx";

describe("@interface Estrelas", () => {
  it("mostra 3 estrelas preenchidas quando valor = 3", () => {
    render(<Estrelas valor={3} />);
    const cheias = screen.getAllByRole("button").filter((b) => b.textContent === "★");
    expect(cheias).toHaveLength(3);
  });

  it("chama onChange com 5 ao clicar na 5ª estrela", async () => {
    const onChange = vi.fn();
    render(<Estrelas valor={0} onChange={onChange} />);
    await userEvent.click(screen.getByTestId("estrela-5"));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("não permite clique quando somenteLeitura", async () => {
    const onChange = vi.fn();
    render(<Estrelas valor={4} onChange={onChange} somenteLeitura />);
    await userEvent.click(screen.getByTestId("estrela-1"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
