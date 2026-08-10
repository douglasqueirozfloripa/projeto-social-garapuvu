// Landing.jsx — Página inicial: explica o app e a história do Projeto Garapuvu.
export default function Landing({ onEntrar, onCadastrar }) {
  return (
    <div>
      <section className="hero">
        <div className="marca"><span className="leaf">✿</span> FreelaAvalia 360</div>
        <div className="selo360">Avaliação 360° entre freelancers e contratantes</div>
        <h1>Confiança que se constrói dos dois lados</h1>
        <p className="tag">Contratantes publicam projetos, freelancers participam e, ao final, os dois se avaliam.
          Reputação transparente para todo mundo trabalhar melhor.</p>
        <div className="cta">
          <button className="amarelo" data-testid="landing-criar-conta" onClick={onCadastrar}>Criar minha conta</button>
          <button className="ghost" data-testid="landing-entrar" onClick={onEntrar}>Entrar</button>
        </div>
      </section>

      <section className="secao">
        <h2>Como funciona</h2>
        <div className="features">
          <div className="feature"><div className="ico">📝</div><h3>Publique um projeto</h3><p>Contratantes criam projetos e definem o freelancer. Simples e rápido.</p></div>
          <div className="feature"><div className="ico" style={{ background: "var(--amarelo)", color: "#14401A" }}>⭐</div><h3>Avaliação 360°</h3><p>Ao concluir, freelancer e contratante se avaliam com nota de 1 a 5 e comentário.</p></div>
          <div className="feature"><div className="ico" style={{ background: "var(--azul)" }}>🛡️</div><h3>Reputação real</h3><p>A média das avaliações aparece no perfil de cada pessoa. Nada de avaliação de um lado só.</p></div>
        </div>
      </section>

      <section className="secao">
        <div className="sobre">
          <h2 style={{ textAlign: "left" }}>Sobre o projeto</h2>
          <p>O <b>FreelaAvalia 360</b> é um projeto-escola criado no <b>Projeto Social Garapuvu</b> para ensinar,
            na prática, desenvolvimento e testes de software.</p>
          <p>O Garapuvu — nome da árvore símbolo de Florianópolis — ensina tecnologia de forma <b>100% gratuita e remota
            desde 2020</b>. Já formou pessoas de vários estados do Brasil e até da Guiné-Bissau, conectando gente de
            diferentes lugares pelo mesmo propósito: aprender e abrir portas na tecnologia.</p>
        </div>
      </section>

      <footer className="rodape">
        Feito com 💚 no Projeto Social Garapuvu — conheça em{" "}
        <a href="https://projeto-garapuvu.web.app/" target="_blank" rel="noreferrer">projeto-garapuvu.web.app</a><br />
        Instrutor: Douglas Adriano Queiroz
      </footer>
    </div>
  );
}
