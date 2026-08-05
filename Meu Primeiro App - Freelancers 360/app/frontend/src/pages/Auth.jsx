// Auth.jsx — Login e Cadastro num só cartão, com abas.
import { useState } from "react";
import { api } from "../api.js";
import useFlags from "../hooks/useFlags.js";

export default function Auth({ modoInicial = "login", onLogin, onVoltar }) {
  const { ativa } = useFlags(); // login_google
  const [modo, setModo] = useState(modoInicial); // "login" | "cadastro"
  const [form, setForm] = useState({ nome: "", email: "", senha: "", papel: "freelancer", endereco: "", telefone: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Login social — só disponível com a flag login_google ligada.
  async function entrarComGoogle() {
    setErro("");
    if (!form.email) { setErro("Informe o e-mail da sua conta Google para entrar."); return; }
    setCarregando(true);
    try { onLogin(await api.loginGoogle(form.email)); }
    catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  }
  // Functional updater: parte sempre do estado mais recente, evitando que
  // onChanges em rápida sucessão (ex.: preenchimento automático) usem um
  // `form` obsoleto do closure e apaguem campos já preenchidos.
  const set = (campo) => (e) => { const { value } = e.target; setForm((f) => ({ ...f, [campo]: value })); };

  async function enviar(e) {
    e.preventDefault();
    setErro(""); setCarregando(true);
    try {
      const user = modo === "cadastro"
        ? await api.cadastrar(form)
        : await api.login({ email: form.email, senha: form.senha });
      onLogin(user);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>FreelaAvalia 360</h2>
        <div className="auth-tabs">
          <button className={modo === "login" ? "" : "secundario"} data-testid="tab-entrar" onClick={() => setModo("login")}>Entrar</button>
          <button className={modo === "cadastro" ? "" : "secundario"} data-testid="tab-criar-conta" onClick={() => setModo("cadastro")}>Criar conta</button>
        </div>
        <form onSubmit={enviar}>
          {modo === "cadastro" && (
            <>
              <label htmlFor="nome">Nome</label>
              <input id="nome" data-testid="input-nome" value={form.nome} onChange={set("nome")} required />
              <label htmlFor="papel">Eu sou</label>
              <select id="papel" data-testid="input-papel" value={form.papel} onChange={set("papel")}>
                <option value="freelancer">Freelancer (quero trabalhar em projetos)</option>
                <option value="contratante">Contratante (quero publicar projetos)</option>
              </select>
              <label htmlFor="endereco">Endereço <span className="opcional">(opcional)</span></label>
              <input id="endereco" data-testid="input-endereco" value={form.endereco} onChange={set("endereco")} placeholder="Cidade/UF ou endereço de contato" />
              <label htmlFor="telefone">Telefone <span className="opcional">(opcional)</span></label>
              <input id="telefone" data-testid="input-telefone" value={form.telefone} onChange={set("telefone")} placeholder="(48) 90000-0000" />
              <p className="meta">Endereço e telefone entram como contato sugerido nos seus projetos. Você pode editar em cada projeto.</p>
            </>
          )}
          <label htmlFor="email">E-mail</label>
          <input id="email" data-testid="input-email" type="email" value={form.email} onChange={set("email")} required />
          <label htmlFor="senha">Senha</label>
          <input id="senha" data-testid="input-senha" type="password" value={form.senha} onChange={set("senha")} required placeholder="mínimo 4 caracteres" />
          {erro && <p className="msg-erro" style={{ marginTop: 12 }}>{erro}</p>}
          <div style={{ marginTop: 16 }}>
            <button type="submit" style={{ width: "100%" }} disabled={carregando} data-testid="enviar-auth">
              {carregando ? "Aguarde..." : modo === "cadastro" ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </form>
        {modo === "login" && ativa("login_google") && (
          <div style={{ marginTop: 12 }}>
            <button className="secundario" style={{ width: "100%" }} disabled={carregando} data-testid="entrar-google" onClick={entrarComGoogle}>
              Entrar com Google
            </button>
            <p className="meta" style={{ textAlign: "center" }}>Usa o e-mail acima para entrar com a conta Google vinculada.</p>
          </div>
        )}
        <p style={{ textAlign: "center", marginTop: 14 }}>
          <button className="link-btn" data-testid="voltar-landing" onClick={onVoltar}>← Voltar para a página inicial</button>
        </p>
      </div>
    </div>
  );
}
