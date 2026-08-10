// App.jsx — Controla autenticação e navegação.
//  - Sem login: mostra a Landing e a tela de Auth (login/cadastro).
//  - Logado: abre no PAINEL (Dashboard) e navega entre os módulos pelo
//    MenuPrincipal (gaveta ☰ no celular, barra horizontal no desktop).
//
// Acessibilidade da casca:
//  • Link "Pular para o conteúdo" como PRIMEIRO foco da página: quem usa
//    teclado/leitor de tela salta o menu inteiro e cai no conteúdo (WCAG 2.4.1).
//  • <main id="conteudo" tabIndex={-1}> é o destino desse salto — o tabIndex
//    negativo deixa o elemento receber foco por programa sem entrar na ordem
//    natural do Tab.
//  • Como a troca de aba não recarrega a página, um <output> (role="status"
//    implícito) anuncia "Seção atual: Projetos" para quem não vê a mudança.
import { useState } from "react";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Projetos from "./pages/Projetos.jsx";
import Perfil from "./pages/Perfil.jsx";
import Flags from "./pages/Flags.jsx";
import MenuPrincipal from "./components/MenuPrincipal.jsx";
import { api } from "./api.js";
import useFlags from "./hooks/useFlags.js";
import { MODULO_INICIAL, rotuloDoModulo } from "./modulos.js";

const CHAVE = "freelavalia_user";
const carregarUser = () => { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch { return null; } };

export default function App() {
  const [user, setUser] = useState(carregarUser);
  const [publico, setPublico] = useState("landing"); // landing | login | cadastro
  const [aba, setAba] = useState(MODULO_INICIAL);    // inicio | projetos | perfil | flags
  const { ativa } = useFlags(); // feature flags (novo_dashboard, etc.)

  function login(u) { setUser(u); localStorage.setItem(CHAVE, JSON.stringify(u)); }
  // Avisa o servidor (contrato stateless) mas SEMPRE desloga localmente —
  // mesmo se a API falhar, o usuário não pode ficar preso na sessão.
  async function sair() {
    try { if (user) await api.logout(user.id); } catch { /* ignora: logout local mesmo sem rede */ }
    setUser(null); localStorage.removeItem(CHAVE); setPublico("landing"); setAba(MODULO_INICIAL);
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
      <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>

      <MenuPrincipal atual={aba} aoNavegar={setAba} user={user} aoSair={sair} />

      {novoDashboard && (
        <div className="banner-novo" data-testid="banner-novo-dashboard">
          ✨ Você está no <b>novo painel</b> (feature flag <code>novo_dashboard</code> ligada).
        </div>
      )}

      {/* Invisível na tela, audível no leitor de tela: avisa a troca de seção. */}
      <output className="sr-only" data-testid="aviso-secao">Seção atual: {rotuloDoModulo(aba)}</output>

      <main className="container" id="conteudo" tabIndex={-1}>
        {aba === "inicio" && <Dashboard user={user} aoNavegar={setAba} />}
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
