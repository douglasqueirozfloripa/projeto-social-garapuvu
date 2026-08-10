// Dashboard.jsx — Painel inicial: a primeira tela depois do login.
//
// Responde três perguntas, nesta ordem:
//   1. "como estou?"        → os quatro números do resumo (por papel)
//   2. "o que faço agora?"  → o cartão de próximo passo, com atalho direto
//   3. "onde fica cada coisa?" → os cartões dos módulos
//
// Os cálculos ficam em painel.js (funções puras, testadas à parte). Aqui é só
// buscar os dados e desenhar.
//
// Acessibilidade:
//  • <h1> único da tela; os blocos são <section> com <h2> — a hierarquia de
//    títulos é como quem usa leitor de tela "folheia" a página.
//  • Os números vão em <dl>: o rótulo (<dt>) fica ligado ao valor (<dd>), então
//    o leitor anuncia "Projetos publicados, 3" em vez de um "3" solto.
//  • <output> no aviso de carregando → tem role="status" implícito, ou seja, é
//    anunciado pelo leitor de tela sem roubar o foco de onde a pessoa estava.
//  • Cada atalho é um <button> de verdade (não uma <div> clicável): já vem com
//    foco, Enter/Espaço e anúncio de "botão" de graça.
//  • O emoji de cada cartão tem aria-hidden: o nome do módulo já está no texto.
//  • Se a API cair, os atalhos CONTINUAM na tela — o erro tira os números, não
//    a navegação.
import { useEffect, useState } from "react";
import { api } from "../api.js";
import Estrelas from "../components/Estrelas.jsx";
import Icone from "../components/Icone.jsx";
import { MODULOS } from "../modulos.js";
import { proximoPasso, resumoDoPainel } from "../painel.js";

export default function Dashboard({ user, aoNavegar }) {
  const [contratos, setContratos] = useState(null);
  const [reputacao, setReputacao] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    setErro("");
    Promise.all([api.listarContratos(), api.buscarUsuario(user.id)])
      .then(([lista, dados]) => {
        if (!vivo) return;
        setContratos(lista);
        setReputacao({ media: dados.media, totalAvaliacoes: dados.totalAvaliacoes });
      })
      .catch((e) => { if (vivo) setErro(e.message); });
    return () => { vivo = false; };
  }, [user.id]);

  const carregando = !contratos && !erro;
  const numeros = contratos ? resumoDoPainel(contratos, user) : [];
  const passo = contratos ? proximoPasso(contratos, user) : null;
  const atalhos = MODULOS.filter((m) => m.atalho);
  const primeiroNome = (user.nome || "").split(" ")[0];

  return (
    <div className="painel" data-testid="painel">
      <h1 className="painel-titulo">
        Olá, {primeiroNome} <span aria-hidden="true">👋</span>
      </h1>
      <p className="painel-sub">
        Você está no painel do <b>FreelaAvalia 360</b> como{" "}
        <b data-testid="painel-papel">{user.papel}</b>.
      </p>

      {/* <output> já tem role="status" implícito: o aviso é anunciado pelo leitor
          de tela sem roubar o foco de onde a pessoa estava. */}
      {carregando && <output className="meta" data-testid="painel-carregando">Carregando seu resumo...</output>}
      {erro && (
        <p className="msg-erro" data-testid="painel-erro">
          {erro} Os atalhos abaixo continuam funcionando.
        </p>
      )}

      {contratos && (
        <section aria-labelledby="titulo-resumo">
          <h2 id="titulo-resumo" className="painel-secao">Seu resumo</h2>
          <dl className="painel-numeros" data-testid="painel-numeros">
            {/* Dentro de <dl> só entram <dt>, <dd> ou <div> agrupando os dois —
                por isso a dica de cada número mora DENTRO do <dd>. */}
            {numeros.map((n) => (
              <div className="numero" key={n.id} data-testid={`numero-${n.id}`}>
                <dt>{n.rotulo}</dt>
                <dd>
                  <span className="numero-valor">{n.valor}</span>
                  <span className="numero-dica">{n.dica}</span>
                </dd>
              </div>
            ))}
            <div className="numero" data-testid="numero-reputacao">
              <dt>Sua reputação 360</dt>
              <dd>
                <span className="numero-valor">
                  {reputacao ? reputacao.media : 0}
                  <span className="unidade"> / 5</span>
                </span>
                <Estrelas valor={reputacao?.media || 0} somenteLeitura />
                <span className="numero-dica">
                  {reputacao?.totalAvaliacoes || 0} avaliação(ões) recebida(s)
                </span>
              </dd>
            </div>
          </dl>
        </section>
      )}

      {passo && (
        <section aria-labelledby="titulo-passo" className="painel-passo" data-testid="painel-passo">
          <Icone nome="lightbulb" tamanho={26} className="ico" />
          <div>
            <h2 id="titulo-passo" className="painel-passo-titulo">Próximo passo</h2>
            <p className="painel-passo-texto">{passo.texto}</p>
            <button type="button" className="amarelo" data-testid="painel-passo-acao" onClick={() => aoNavegar(passo.modulo)}>
              {passo.rotuloAcao}
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-modulos">
        <h2 id="titulo-modulos" className="painel-secao">Módulos</h2>
        <ul className="painel-modulos">
          {atalhos.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="modulo-card"
                data-testid={`atalho-${m.id}`}
                onClick={() => aoNavegar(m.id)}
              >
                <span className="ico" aria-hidden="true">
                  <Icone nome={m.icone} tamanho={24} />
                </span>
                <span className="modulo-texto">
                  <span className="modulo-titulo">{m.rotulo}</span>
                  <span className="modulo-descricao">{m.descricao(user.papel)}</span>
                </span>
                <Icone nome="arrow-right" className="seta" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
