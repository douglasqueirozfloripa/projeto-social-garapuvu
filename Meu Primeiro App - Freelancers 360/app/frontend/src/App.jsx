// App.jsx — Controla autenticação e navegação.
//  - Sem login: mostra a Landing e a tela de Auth (login/cadastro).
//  - Logado: mostra o app (Projetos e Perfil), com opções conforme o papel.
import { useState } from "react";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Projetos from "./pages/Projetos.jsx";
import Perfil from "./pages/Perfil.jsx";
import Flags from "./pages/Flags.jsx";
import { api } from "./api.js";
import useFlags from "./hooks/useFlags.js";

const CHAVE = "freelavalia_user";
const carregarUser = () => { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch { return null; } };

export default function App() {
  const [user, setUser] = useState(carregarUser);
  const [publico, setPublico] = useState("landing"); // landing | login | cadastro
  const [aba, setAba] = useState("projetos");
  const { ativa } = useFlags(); // feature flags (novo_dashboard, etc.)

  function login(u) { setUser(u); localStorage.setItem(CHAVE, JSON.stringify(u)); }
  // Avisa o servidor (contrato stateless) mas SEMPRE desloga localmente —
  // mesmo se a API falhar, o usuário não pode ficar preso na sessão.
  async function sair() {
    try { if (user) await api.logout(user.id); } catch { /* ignora: logout local mesmo sem rede */ }
    setUser(null); localStorage.removeItem(CHAVE); setPublico("landing");
  }

  // ---- Não logado ----
  if (!user) {
    if (publico === "landing")
      return <Landing onEntrar={() => setPublico("login")} onCadastrar={() => setPublico("cadastro")} />;
    return <Auth modoInicial={publico} onLogin={login} onVoltar={() => setPublico("landing")} />;
  }

  // ---- Logado ----
  const novoDashboard = ativa("novo_dashboard");
  return (
    <div className={`app-shell${novoDashboard ? " tema-novo" : ""}`}>
      <header className="topo">
        <div className="marca"><span className="leaf">✿</span> FreelaAvalia 360</div>
        <nav className="nav">
          <button className={aba === "projetos" ? "" : "secundario"} data-testid="nav-projetos" onClick={() => setAba("projetos")}>Projetos</button>
          <button className={aba === "perfil" ? "" : "secundario"} data-testid="nav-perfil" onClick={() => setAba("perfil")}>Meu perfil</button>
          <button className={aba === "flags" ? "" : "secundario"} data-testid="nav-flags" onClick={() => setAba("flags")}>Flags</button>
          <span className="userchip" data-testid="userchip">{user.nome} · {user.papel}</span>
          <button className="ghost" data-testid="btn-sair" onClick={sair}>Sair</button>
        </nav>
      </header>
      {novoDashboard && (
        <div className="banner-novo" data-testid="banner-novo-dashboard">
          ✨ Você está no <b>novo painel</b> (feature flag <code>novo_dashboard</code> ligada).
        </div>
      )}
      <main className="container">
        {aba === "projetos" && <Projetos user={user} />}
        {aba === "perfil" && <Perfil user={user} aoAtualizar={login} />}
        {aba === "flags" && <Flags />}
      </main>
      <footer className="rodape">
        Projeto Social Garapuvu · <a href="https://projeto-garapuvu.web.app/" target="_blank" rel="noreferrer">projeto-garapuvu.web.app</a>
      </footer>
    </div>
  );
}
