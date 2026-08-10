// Perfil.jsx — Mostra a reputação (média 360) e permite editar os dados de contato
// do próprio usuário (nome, telefone e endereço), que são sugeridos ao criar projetos.
import { useEffect, useState } from "react";
import Estrelas from "../components/Estrelas.jsx";
import { api } from "../api.js";

export default function Perfil({ user, aoAtualizar }) {
  const [reputacao, setReputacao] = useState({ media: 0, totalAvaliacoes: 0 });
  const [estado, setEstado] = useState("carregando"); // carregando | ok | erro
  const [msg, setMsg] = useState("");

  // Campos editáveis (iniciam com o que já está no usuário logado).
  const [nome, setNome] = useState(user.nome || "");
  const [telefone, setTelefone] = useState(user.telefone || "");
  const [endereco, setEndereco] = useState(user.endereco || "");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let vivo = true;
    setEstado("carregando");
    api.buscarUsuario(user.id)
      .then((u) => { if (vivo) { setReputacao({ media: u.media, totalAvaliacoes: u.totalAvaliacoes }); setEstado("ok"); } })
      .catch((e) => { if (vivo) { setMsg(e.message); setEstado("erro"); } });
    return () => { vivo = false; };
  }, [user.id]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setSucesso(""); setMsg("");
    try {
      const atualizado = await api.atualizarUsuario(user.id, { nome, telefone, endereco });
      aoAtualizar({ ...user, ...atualizado }); // atualiza o usuário logado (e o localStorage)
      setSucesso("Perfil atualizado!");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card">
      <h2>{user.nome} <span className="badge">{user.papel}</span></h2>

      <p>Reputação (avaliação 360):</p>
      {estado === "carregando" ? <p className="meta">Carregando reputação...</p> : (
        <>
          <Estrelas valor={reputacao.media} somenteLeitura />
          <p>Média <b>{reputacao.media}</b> em {reputacao.totalAvaliacoes} avaliação(ões).</p>
        </>
      )}

      <hr style={{ border: "none", borderTop: "1px solid var(--borda)", margin: "18px 0" }} />

      <h3 style={{ marginTop: 0 }}>Dados de contato</h3>
      <p className="meta">Usados como contato sugerido nos projetos que você publica.</p>
      <form onSubmit={salvar}>
        <label htmlFor="perfil-nome">Nome</label>
        <input id="perfil-nome" data-testid="input-perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />

        <label htmlFor="perfil-telefone">Telefone</label>
        <input id="perfil-telefone" data-testid="input-perfil-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(48) 90000-0000" />

        <label htmlFor="perfil-endereco">Endereço</label>
        <input id="perfil-endereco" data-testid="input-perfil-endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Cidade/UF ou endereço" />

        {msg && <p className="msg-erro" style={{ marginTop: 12 }}>{msg}</p>}
        {sucesso && <p className="msg-ok" style={{ marginTop: 12 }} data-testid="perfil-salvo">{sucesso}</p>}
        <div style={{ marginTop: 14 }}>
          <button type="submit" disabled={salvando} data-testid="salvar-perfil">{salvando ? "Salvando..." : "Salvar dados"}</button>
        </div>
      </form>
    </div>
  );
}
