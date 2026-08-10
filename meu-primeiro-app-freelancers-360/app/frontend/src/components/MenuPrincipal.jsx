// MenuPrincipal.jsx — Cabeçalho + menu de navegação do app (pós-login).
//
// Mobile-first: no celular o menu vive dentro de uma GAVETA que abre no botão ☰;
// a partir de 700px a mesma marcação vira uma barra horizontal (só CSS muda).
//
// Acessibilidade — o que está aqui e POR QUÊ:
//  • <nav aria-label="Menu principal"> → dá nome à região; quem usa leitor de
//    tela navega direto para ela (e diferencia de outras <nav> da página).
//  • <ul>/<li> → o leitor de tela anuncia "lista com 4 itens", então a pessoa
//    sabe o tamanho do menu antes de percorrer.
//  • aria-current="page" no item ativo → anuncia "página atual". É também o que
//    o CSS usa para pintar o item (estilo que nasce da semântica, não de classe).
//  • aria-expanded + aria-controls no ☰ → informam que ele abre/fecha algo e
//    qual elemento é esse.
//  • Esc fecha e DEVOLVE o foco ao ☰ (WCAG 2.1.2: não prender o teclado).
//  • Abrir leva o foco ao primeiro item; escolher fecha e devolve o foco.
//  • Setas ↑↓←→ andam entre os itens do menu.
//  • Ícones com aria-hidden="true" → senão o leitor anuncia "casa Início".
//
// Sobre NÃO prender o foco (focus trap): este é um menu de divulgação
// (disclosure), não uma janela modal. O padrão ARIA (APG) pede armadilha de
// foco em dialog/aria-modal; em menu de navegação o esperado é justamente
// poder sair com Tab. Por isso: Esc, foco de ida e volta, mas sem trap.
import { useEffect, useRef, useState } from "react";
import { MODULOS } from "../modulos.js";
import Icone from "./Icone.jsx";

const ID_NAV = "menu-principal"; // alvo do aria-controls do botão ☰

export default function MenuPrincipal({ atual, aoNavegar, user, aoSair }) {
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef(null);
  const navRef = useRef(null);

  function fechar({ devolverFoco = true } = {}) {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }

  // Esc fecha a gaveta de onde quer que o foco esteja.
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e) {
      if (e.key === "Escape") fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Ao abrir, o foco entra na gaveta: quem usa teclado não precisa tatear.
  useEffect(() => {
    if (aberto) navRef.current?.querySelector("[data-item-menu]")?.focus();
  }, [aberto]);

  function irPara(id) {
    const estavaAberto = aberto;
    aoNavegar(id);
    // No desktop o menu não abre, então não há foco para devolver: o foco
    // continua no item clicado, que é o comportamento natural.
    if (estavaAberto) fechar();
  }

  // Setas circulam entre os itens (inclui o botão Sair, que também é do menu).
  function navegarComSetas(e) {
    const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!passo) return;
    const itens = [...navRef.current.querySelectorAll("[data-item-menu]")];
    const atualIdx = itens.indexOf(document.activeElement);
    if (atualIdx === -1) return;
    e.preventDefault();
    itens[(atualIdx + passo + itens.length) % itens.length].focus();
  }

  return (
    <header className="topo">
      <div className="marca">
        <span className="leaf" aria-hidden="true">✿</span> FreelaAvalia 360
      </div>

      {/* Só aparece no mobile (CSS o esconde a partir de 700px). */}
      <button
        ref={botaoRef}
        type="button"
        className="menu-toggle"
        data-testid="menu-toggle"
        aria-expanded={aberto}
        aria-controls={ID_NAV}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        onClick={() => (aberto ? fechar({ devolverFoco: false }) : setAberto(true))}
      >
        <Icone nome={aberto ? "x" : "menu"} tamanho={24} />
      </button>

      {/* Fundo escuro: clicar fora fecha (conveniência de MOUSE).
          É um <button> — e não uma <div> com onClick — porque só elemento
          interativo de verdade pode receber clique/tecla. Fica fora da árvore de
          acessibilidade (aria-hidden) e fora da ordem do Tab (tabIndex -1) para
          não virar um "Fechar menu" duplicado: quem usa teclado já tem o Esc e o
          próprio botão ✕. */}
      {aberto && (
        <button
          type="button"
          className="menu-fundo"
          data-testid="menu-fundo"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => fechar()}
        />
      )}

      <nav
        id={ID_NAV}
        ref={navRef}
        className={`nav${aberto ? " aberto" : ""}`}
        aria-label="Menu principal"
        onKeyDown={navegarComSetas}
      >
        <ul className="nav-lista">
          {MODULOS.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                data-item-menu
                data-testid={`nav-${m.id}`}
                className="nav-item"
                aria-current={m.id === atual ? "page" : undefined}
                onClick={() => irPara(m.id)}
              >
                <Icone nome={m.icone} className="ico" />
                {m.rotulo}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-usuario">
          <span className="userchip" data-testid="userchip">
            {user.nome} · {user.papel}
          </span>
          <button type="button" className="ghost" data-item-menu data-testid="btn-sair" onClick={aoSair}>
            Sair
          </button>
        </div>
      </nav>
    </header>
  );
}
