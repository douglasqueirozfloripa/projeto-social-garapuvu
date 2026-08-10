// Avaliar.jsx — Formulário de avaliação 360 (usado dentro de um modal).
import { useState } from "react";
import Estrelas from "../components/Estrelas.jsx";
import { api } from "../api.js";

export default function Avaliar({ contrato, deId, paraId, aoConcluir }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | erro
  const [erro, setErro] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando"); setErro("");
    try {
      await api.avaliar({ contratoId: contrato.id, deId, paraId, nota, comentario });
      if (aoConcluir) aoConcluir(); // fecha o modal e recarrega a lista
    } catch (err) {
      setEstado("erro"); setErro(err.message);
    }
  }

  return (
    <form onSubmit={enviar}>
      <p className="meta">Contrato: <b>{contrato.titulo}</b></p>
      <label>Sua nota</label>
      <Estrelas valor={nota} onChange={setNota} />
      <label htmlFor="coment">Comentário</label>
      <textarea id="coment" data-testid="input-comentario" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Como foi a experiência?" />
      {erro && <p className="msg-erro" style={{ marginTop: 10 }}>{erro}</p>}
      <div style={{ marginTop: 14 }}>
        <button type="submit" style={{ width: "100%" }} disabled={estado === "enviando" || nota === 0} data-testid="enviar-avaliacao">
          {estado === "enviando" ? "Enviando..." : "Enviar avaliação"}
        </button>
      </div>
    </form>
  );
}
