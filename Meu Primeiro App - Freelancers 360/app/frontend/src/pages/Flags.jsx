// Flags.jsx — Painel de feature flags: liga/desliga cada chave em tempo real.
// Serve de demonstração em aula: mude a flag aqui e veja o app reagir (o botão
// do Google aparece, o destaque libera, o modo manutenção bloqueia, etc.).
import { useState } from "react";
import { api } from "../api.js";
import useFlags from "../hooks/useFlags.js";

export default function Flags() {
  const { flags, carregando, recarregar } = useFlags();
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState("");

  async function alternar(nome, ativa) {
    setErro(""); setSalvando(nome);
    try { await api.definirFlag(nome, ativa); await recarregar(); }
    catch (e) { setErro(e.message); }
    finally { setSalvando(""); }
  }

  return (
    <div>
      <div className="projetos-head">
        <h2 style={{ margin: 0 }}>Feature flags</h2>
        <span className="badge aberto">Ligue/desligue funcionalidades sem novo deploy</span>
      </div>
      <p className="meta">
        Regra de ouro de teste: toda flag deve ser verificada nos DOIS estados — ligada e desligada.
      </p>
      {erro && <p className="msg-erro">{erro}</p>}
      {carregando && <p className="meta">Carregando flags...</p>}

      <ul className="candidatos-lista">
        {flags.map((f) => (
          <li key={f.nome} className="candidato" data-testid={`flag-${f.nome}`}>
            <div>
              <b>{f.nome}</b>{" "}
              <span className={`badge ${f.ativa ? "em_andamento" : "aberto"}`}>{f.ativa ? "LIGADA" : "desligada"}</span>
              <div className="meta">{f.descricao}</div>
            </div>
            <div className="candidato-acoes">
              <button
                className={f.ativa ? "perigo" : ""}
                data-testid={`toggle-${f.nome}`}
                disabled={salvando === f.nome}
                onClick={() => alternar(f.nome, !f.ativa)}
              >
                {salvando === f.nome ? "..." : f.ativa ? "Desligar" : "Ligar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
