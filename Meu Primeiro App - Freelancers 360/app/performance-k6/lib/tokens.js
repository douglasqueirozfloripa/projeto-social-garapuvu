// lib/tokens.js — DESIGN TOKENS de cor do relatório de performance.
//
// O que são design tokens? São os "valores de marca" (cores, aqui) guardados
// com NOME, num único lugar, em vez de espalhados como hex pelo código. Assim,
// trocar a identidade visual = trocar um mapa, não caçar "#2E7D32" em 10 lugares.
//
// Usamos DOIS NÍVEIS (padrão de mercado):
//
//   1) PRIMITIVOS  → a paleta crua ("as tintas"): verdeEscuro, verde, amarelo...
//                    Não são usados direto na interface.
//   2) SEMÂNTICOS  → PAPÉIS que a interface usa: bg, card, txt, ok, erro,
//                    acento... Cada papel APONTA para um primitivo.
//
// A interface (report.js) só conhece os semânticos (as variáveis CSS --bg,
// --verde, --amarelo, ...). Para trocar de tema, troca-se para onde os
// semânticos apontam — a interface nem percebe.
//
// -----------------------------------------------------------------------------
// COMO O ALUNO CRIA UM TEMA NOVO
//   1. Copie um bloco de PRIMITIVOS (ex.: `garapuvu`) e mude as cores.
//   2. Copie um bloco de TEMAS (claro + escuro) preenchendo os MESMOS "slots".
//   3. Rode escolhendo o tema:  k6 run -e TEMA=oceano load.js
// Os "slots" (nomes dos semânticos) precisam ser sempre os mesmos — é o
// "contrato" que o relatório espera. Veja a tabela de slots abaixo.
// -----------------------------------------------------------------------------
//
// SLOTS (papéis) que todo tema precisa preencher:
//   Marca/identidade:  verde-escuro (primária forte) · verde (primária) ·
//                      lima (secundária) · lima-claro (secundária clara) ·
//                      amarelo (destaque) · amarelo-claro (destaque claro) ·
//                      coral (ênfase/alerta forte)
//   Base da página:    bg (fundo) · card (cartão) · txt (texto) ·
//                      suave (texto secundário) · linha (bordas)
//   Estado:            ok / ok-bg (sucesso) · erro / erro-bg (falha) ·
//                      acento (gráficos) · alerta (atenção)

// ---------- 1) PRIMITIVOS (paletas cruas) ----------
const PRIMITIVOS = {
  garapuvu: {
    verdeEscuro: "#14401A", verde: "#2E7D32", lima: "#7CB342", limaClaro: "#9CCC65",
    amarelo: "#F9A825", amareloClaro: "#FBC02D", coral: "#EF6C00",
  },
  // Exemplo de tema alternativo (azul/ciano) — feito só para mostrar que basta
  // preencher os mesmos slots com outra paleta.
  oceano: {
    verdeEscuro: "#0D3B66", verde: "#1565C0", lima: "#0097A7", limaClaro: "#4DD0E1",
    amarelo: "#F4C430", amareloClaro: "#FFE08A", coral: "#EE6C4D",
  },
  // Segundo exemplo (roxo/uva) — outro ponto de partida para o aluno copiar.
  uva: {
    verdeEscuro: "#3B0A58", verde: "#6A1B9A", lima: "#8E24AA", limaClaro: "#CE93D8",
    amarelo: "#FDD835", amareloClaro: "#FFF176", coral: "#D81B60",
  },
  // Tema "Praia da Joaquina" (Floripa): mar/turquesa, areia dourada e o coral
  // do pôr do sol. Bom exemplo de tema criado pelo aluno.
  joaquina: {
    verdeEscuro: "#0A4C6A", verde: "#1CA6B2", lima: "#59C3C3", limaClaro: "#A7E0DD",
    amarelo: "#E6B14C", amareloClaro: "#F3D9A0", coral: "#E4572E",
  },
};

// ---------- Imagens de fundo (SVG pálido, embutido como data URI) ----------
// São SVGs propositalmente claros para não atrapalhar a leitura — aparecem
// sobretudo nas margens (os cartões são opacos). Ficam também salvos em
// assets/ como arquivos, para o aluno abrir/reaproveitar.
export const SVG_FUNDO = {
  // Árvore garapuvú florida (copa verde + flores amarelas) sobre colinas.
  garapuvu:
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f5f9ee'/><stop offset='1' stop-color='#e6f1d6'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><path d='M0 640 Q300 560 600 620 T1200 600 V800 H0Z' fill='#cfe3b4' opacity='.5'/><path d='M0 705 Q300 645 600 692 T1200 682 V800 H0Z' fill='#b6d68f' opacity='.55'/><g opacity='.3' fill='#8ec06b'><circle cx='930' cy='205' r='72'/><circle cx='1050' cy='205' r='72'/><circle cx='990' cy='140' r='78'/></g><circle cx='990' cy='180' r='60' fill='#f6c945' opacity='.35'/><rect x='982' y='235' width='16' height='120' rx='6' fill='#9c7a4d' opacity='.35'/></svg>",
  // Praia da Joaquina: sol, faixas de mar turquesa e dunas de areia.
  joaquina:
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eaf6f8'/><stop offset='.55' stop-color='#f1f6ec'/><stop offset='1' stop-color='#f6ecd6'/></linearGradient></defs><rect width='1200' height='800' fill='url(#s)'/><circle cx='1015' cy='165' r='80' fill='#f2cf7e' opacity='.5'/><path d='M0 430 Q300 390 600 420 T1200 410 V520 H0Z' fill='#7ec9c9' opacity='.45'/><path d='M0 500 Q300 468 600 500 T1200 490 V560 H0Z' fill='#4fb3bf' opacity='.4'/><path d='M0 560 Q350 520 700 570 T1200 560 V800 H0Z' fill='#eddaa6' opacity='.6'/><path d='M0 655 Q350 612 700 662 T1200 650 V800 H0Z' fill='#e2c98a' opacity='.6'/></svg>",
};

// Transforma o SVG num valor CSS pronto para o slot --bg-image.
function fundo(nome) {
  return nome && SVG_FUNDO[nome]
    ? `url("data:image/svg+xml,${encodeURIComponent(SVG_FUNDO[nome])}")`
    : "none";
}

// Monta os SEMÂNTICOS (claro + escuro) a partir de uma paleta primitiva.
// Todo tema usa esta mesma fábrica, garantindo que os slots sejam idênticos.
// `img` (opcional) é a chave em SVG_FUNDO que vira a imagem de fundo da tela.
function montarTema(p, rotulo, img) {
  return {
    rotulo,
    claro: {
      // marca (apontam para os primitivos)
      "verde-escuro": p.verdeEscuro, "verde": p.verde, "lima": p.lima, "lima-claro": p.limaClaro,
      "amarelo": p.amarelo, "amarelo-claro": p.amareloClaro, "coral": p.coral,
      // base
      "bg": "#f3f7ec", "card": "#ffffff", "txt": "#16261a", "suave": "#5a6b5c", "linha": "#dbe7cf",
      // estado
      "ok": p.verde, "ok-bg": "#E8F5E9", "erro": "#C62828", "erro-bg": "#fdeceb",
      "acento": p.verde, "alerta": p.coral,
      // imagem de fundo da tela (slot novo)
      "bg-image": fundo(img),
    },
    // No escuro só sobrescrevemos o que muda (a marca continua igual).
    // Sem imagem no escuro (SVG claro ficaria brilhante demais).
    escuro: {
      "bg": "#0f1a12", "card": "#16241a", "txt": "#e9f0e6", "suave": "#9fb3a2", "linha": "#26382b",
      "ok": p.lima, "ok-bg": "#12301f", "erro": "#ff8a7a", "erro-bg": "#361a17",
      "acento": p.lima, "alerta": p.amarelo,
      "bg-image": "none",
    },
  };
}

// ---------- 2) TEMAS (semânticos prontos) ----------
export const TEMAS = {
  garapuvu: montarTema(PRIMITIVOS.garapuvu, "Garapuvu (verde e amarelo)", "garapuvu"),
  oceano: montarTema(PRIMITIVOS.oceano, "Oceano (azul e ciano)"),
  uva: montarTema(PRIMITIVOS.uva, "Uva (roxo e magenta)"),
  joaquina: montarTema(PRIMITIVOS.joaquina, "Praia da Joaquina (mar e areia)", "joaquina"),
};

export const TEMA_PADRAO = "garapuvu";

// Gera o bloco CSS `:root { --slot: valor }` + as sobrescritas do modo escuro,
// a partir do tema escolhido. É isto que o report.js injeta no <style>.
export function cssTokens(nomeTema = TEMA_PADRAO) {
  const tema = TEMAS[nomeTema] || TEMAS[TEMA_PADRAO];
  const linhas = (mapa, ind) =>
    Object.entries(mapa).map(([slot, cor]) => `${ind}--${slot}: ${cor};`).join("\n");
  return `:root{
${linhas(tema.claro, "    ")}
  }
  @media (prefers-color-scheme: dark){
    :root{
${linhas(tema.escuro, "      ")}
    }
  }`;
}
