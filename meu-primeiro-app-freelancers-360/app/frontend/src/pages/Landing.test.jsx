// Teste de INTERFACE (componente) — Landing.
// TAG: @interface
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Landing from "./Landing.jsx";

describe("@interface Landing", () => {
  it("mostra a chamada principal e as seções explicativas", () => {
    render(<Landing onEntrar={() => {}} onCadastrar={() => {}} />);
    expect(screen.getByText("Confiança que se constrói dos dois lados")).toBeInTheDocument();
    expect(screen.getByText("Como funciona")).toBeInTheDocument();
    expect(screen.getAllByText(/Projeto Social Garapuvu/).length).toBeGreaterThan(0);
  });

  it("dispara onCadastrar e onEntrar nos botões da CTA", async () => {
    const onCadastrar = vi.fn();
    const onEntrar = vi.fn();
    render(<Landing onEntrar={onEntrar} onCadastrar={onCadastrar} />);
    await userEvent.click(screen.getByTestId("landing-criar-conta"));
    await userEvent.click(screen.getByTestId("landing-entrar"));
    expect(onCadastrar).toHaveBeenCalledTimes(1);
    expect(onEntrar).toHaveBeenCalledTimes(1);
  });
});
