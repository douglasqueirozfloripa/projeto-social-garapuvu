// Teste de INTERFACE (componente) — Avaliar (avaliação 360).
// TAG: @interface
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../api.js", () => ({ api: { avaliar: vi.fn() } }));
import { api } from "../api.js";
import Avaliar from "./Avaliar.jsx";

const contrato = { id: 3, titulo: "Landing page" };
beforeEach(() => vi.clearAllMocks());

describe("@interface Avaliar", () => {
  it("mantém o botão desabilitado enquanto a nota for 0", () => {
    render(<Avaliar contrato={contrato} deId={1} paraId={2} aoConcluir={() => {}} />);
    expect(screen.getByTestId("enviar-avaliacao")).toBeDisabled();
  });

  it("escolhe nota, envia à API e chama aoConcluir", async () => {
    api.avaliar.mockResolvedValueOnce({ id: 99 });
    const aoConcluir = vi.fn();
    render(<Avaliar contrato={contrato} deId={1} paraId={2} aoConcluir={aoConcluir} />);

    await userEvent.click(screen.getByTestId("estrela-4"));
    await userEvent.type(screen.getByTestId("input-comentario"), "muito bom");
    expect(screen.getByTestId("enviar-avaliacao")).toBeEnabled();
    await userEvent.click(screen.getByTestId("enviar-avaliacao"));

    expect(api.avaliar).toHaveBeenCalledWith({ contratoId: 3, deId: 1, paraId: 2, nota: 4, comentario: "muito bom" });
    expect(aoConcluir).toHaveBeenCalledTimes(1);
  });

  it("mostra a mensagem de erro quando a API falha", async () => {
    api.avaliar.mockRejectedValueOnce(new Error("você já avaliou este contrato"));
    render(<Avaliar contrato={contrato} deId={1} paraId={2} aoConcluir={() => {}} />);
    await userEvent.click(screen.getByTestId("estrela-5"));
    await userEvent.click(screen.getByTestId("enviar-avaliacao"));
    expect(await screen.findByText("você já avaliou este contrato")).toBeInTheDocument();
  });
});
