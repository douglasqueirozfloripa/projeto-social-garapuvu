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
//                      suave (texto secundário) · linha (bordas) ·
//                      titulo (títulos de seção) · bg-image (imagem de fundo)
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

// ---------- Imagens de fundo (SVG discreto, embutido como data URI) ----------
// São SVGs propositalmente de baixo contraste para não atrapalhar a leitura —
// aparecem sobretudo nas margens (os cartões são translúcidos). Ficam também
// salvos em assets/ como arquivos, para o aluno abrir/reaproveitar.
//
// Cada cena tem DUAS versões: a clara (`garapuvu`) e a escura (`garapuvuEscuro`),
// com o MESMO desenho e só as cores trocadas. Sem a versão escura o fundo
// simplesmente desapareceria para quem usa o sistema em modo escuro.
export const SVG_FUNDO = {
  // Garapuvú florida: copa/flor central, flores e folhas espalhadas e colinas.
  // Motivos distribuídos pelo canvas para o fundo aparecer atrás do conteúdo.
  garapuvu:
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f5f9ee'/><stop offset='1' stop-color='#e7f0d8'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><g fill='#f6c945' opacity='.2'><circle cx='160' cy='210' r='26'/><circle cx='520' cy='150' r='20'/><circle cx='820' cy='250' r='24'/><circle cx='300' cy='430' r='22'/><circle cx='980' cy='470' r='26'/><circle cx='660' cy='370' r='18'/><circle cx='1120' cy='560' r='22'/></g><g fill='#8ec06b' opacity='.16'><circle cx='230' cy='330' r='30'/><circle cx='430' cy='250' r='26'/><circle cx='900' cy='160' r='28'/><circle cx='1080' cy='330' r='30'/><circle cx='560' cy='470' r='24'/><circle cx='120' cy='560' r='26'/><circle cx='760' cy='540' r='28'/></g><path d='M0 600 Q300 540 600 590 T1200 575 V800 H0Z' fill='#cfe3b4' opacity='.5'/><path d='M0 675 Q320 615 640 665 T1200 655 V800 H0Z' fill='#b6d68f' opacity='.55'/><g opacity='.3' fill='#8ec06b'><circle cx='330' cy='155' r='58'/><circle cx='432' cy='155' r='58'/><circle cx='381' cy='104' r='62'/></g><circle cx='381' cy='142' r='44' fill='#f6c945' opacity='.4'/><rect x='373' y='188' width='14' height='92' rx='6' fill='#9c7a4d' opacity='.32'/></svg>",
  // Praia da Joaquina: sol com brilho, faixas de mar no MEIO da tela e dunas.
  joaquina:
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eaf6f8'/><stop offset='.5' stop-color='#eef7f1'/><stop offset='1' stop-color='#f6ecd6'/></linearGradient></defs><rect width='1200' height='800' fill='url(#s)'/><circle cx='1010' cy='150' r='150' fill='#f2cf7e' opacity='.14'/><circle cx='1010' cy='150' r='88' fill='#f2cf7e' opacity='.5'/><path d='M0 360 Q300 320 600 350 T1200 340 V470 H0Z' fill='#7ec9c9' opacity='.4'/><path d='M0 440 Q300 405 600 435 T1200 425 V545 H0Z' fill='#4fb3bf' opacity='.38'/><path d='M0 520 Q300 488 600 515 T1200 508 V605 H0Z' fill='#2f9fb0' opacity='.28'/><path d='M0 585 Q350 545 700 590 T1200 580 V800 H0Z' fill='#eddaa6' opacity='.6'/><path d='M0 670 Q350 628 700 675 T1200 665 V800 H0Z' fill='#e2c98a' opacity='.6'/><g stroke='#4a6b6b' stroke-width='3' fill='none' opacity='.18'><path d='M120 180 q15 -12 30 0 q15 -12 30 0'/><path d='M240 150 q12 -10 24 0 q12 -10 24 0'/></g></svg>",
  // Mesma Garapuvú florida, repintada para o modo escuro (noite no morro).
  garapuvuEscuro:
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0f1a12'/><stop offset='1' stop-color='#16291b'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><g fill='#f6c945' opacity='.12'><circle cx='160' cy='210' r='26'/><circle cx='520' cy='150' r='20'/><circle cx='820' cy='250' r='24'/><circle cx='300' cy='430' r='22'/><circle cx='980' cy='470' r='26'/><circle cx='660' cy='370' r='18'/><circle cx='1120' cy='560' r='22'/></g><g fill='#7cb342' opacity='.14'><circle cx='230' cy='330' r='30'/><circle cx='430' cy='250' r='26'/><circle cx='900' cy='160' r='28'/><circle cx='1080' cy='330' r='30'/><circle cx='560' cy='470' r='24'/><circle cx='120' cy='560' r='26'/><circle cx='760' cy='540' r='28'/></g><path d='M0 600 Q300 540 600 590 T1200 575 V800 H0Z' fill='#1d3a24' opacity='.65'/><path d='M0 675 Q320 615 640 665 T1200 655 V800 H0Z' fill='#25492c' opacity='.7'/><g opacity='.2' fill='#7cb342'><circle cx='330' cy='155' r='58'/><circle cx='432' cy='155' r='58'/><circle cx='381' cy='104' r='62'/></g><circle cx='381' cy='142' r='44' fill='#f6c945' opacity='.22'/><rect x='373' y='188' width='14' height='92' rx='6' fill='#c9a978' opacity='.18'/></svg>",
  // Mesma Praia da Joaquina, repintada para o modo escuro (mar à noite).
  joaquinaEscuro:
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0a1c26'/><stop offset='.5' stop-color='#0d2420'/><stop offset='1' stop-color='#1b2118'/></linearGradient></defs><rect width='1200' height='800' fill='url(#s)'/><circle cx='1010' cy='150' r='150' fill='#f2cf7e' opacity='.07'/><circle cx='1010' cy='150' r='88' fill='#f2cf7e' opacity='.2'/><path d='M0 360 Q300 320 600 350 T1200 340 V470 H0Z' fill='#2f9fb0' opacity='.2'/><path d='M0 440 Q300 405 600 435 T1200 425 V545 H0Z' fill='#2b8d9b' opacity='.22'/><path d='M0 520 Q300 488 600 515 T1200 508 V605 H0Z' fill='#1f7686' opacity='.24'/><path d='M0 585 Q350 545 700 590 T1200 580 V800 H0Z' fill='#8a7444' opacity='.3'/><path d='M0 670 Q350 628 700 675 T1200 665 V800 H0Z' fill='#7a6538' opacity='.35'/><g stroke='#9fd7d7' stroke-width='3' fill='none' opacity='.14'><path d='M120 180 q15 -12 30 0 q15 -12 30 0'/><path d='M240 150 q12 -10 24 0 q12 -10 24 0'/></g></svg>",
};

// Transforma o SVG num valor CSS pronto para o slot --bg-image.
function fundo(nome) {
  return nome && SVG_FUNDO[nome]
    ? `url("data:image/svg+xml,${encodeURIComponent(SVG_FUNDO[nome])}")`
    : "none";
}

// Monta os SEMÂNTICOS (claro + escuro) a partir de uma paleta primitiva.
// Todo tema usa esta mesma fábrica, garantindo que os slots sejam idênticos.
// `img` / `imgEscuro` (opcionais) são as chaves em SVG_FUNDO que viram a imagem
// de fundo da tela no modo claro e no modo escuro. Se `imgEscuro` não vier, o
// tema simplesmente não tem fundo no escuro (`none`).
function montarTema(p, rotulo, img, imgEscuro) {
  return {
    rotulo,
    claro: {
      // marca (apontam para os primitivos)
      "verde-escuro": p.verdeEscuro, "verde": p.verde, "lima": p.lima, "lima-claro": p.limaClaro,
      "amarelo": p.amarelo, "amarelo-claro": p.amareloClaro, "coral": p.coral,
      // base — card translúcido (rgba) para a imagem de fundo aparecer atrás
      // do conteúdo (efeito "vidro fosco", combinado com backdrop-filter no CSS)
      "bg": "#f3f7ec", "card": "rgba(255,255,255,.82)", "txt": "#16261a", "suave": "#5a6b5c", "linha": "#dbe7cf",
      // estado
      "ok": p.verde, "ok-bg": "#E8F5E9", "erro": "#C62828", "erro-bg": "#fdeceb",
      "acento": p.verde, "alerta": p.coral,
      // cor dos títulos de seção — precisa ser um slot (e não um `@media` solto
      // no report.js) para o botão claro/escuro conseguir trocá-la também
      "titulo": p.verdeEscuro,
      // imagem de fundo da tela (slot novo)
      "bg-image": fundo(img),
    },
    // No escuro só sobrescrevemos o que muda (a marca continua igual).
    // O fundo é a MESMA cena repintada em tons escuros — usar o SVG claro aqui
    // ficaria brilhante demais, e usar `none` faria o fundo desaparecer.
    escuro: {
      "bg": "#0f1a12", "card": "rgba(22,36,26,.82)", "txt": "#e9f0e6", "suave": "#9fb3a2", "linha": "#26382b",
      "ok": p.lima, "ok-bg": "#12301f", "erro": "#ff8a7a", "erro-bg": "#361a17",
      "acento": p.lima, "alerta": p.amarelo,
      "titulo": p.limaClaro,
      "bg-image": fundo(imgEscuro),
    },
  };
}

// ---------- 2) TEMAS (semânticos prontos) ----------
export const TEMAS = {
  garapuvu: montarTema(PRIMITIVOS.garapuvu, "Garapuvu (verde e amarelo)", "garapuvu", "garapuvuEscuro"),
  oceano: montarTema(PRIMITIVOS.oceano, "Oceano (azul e ciano)"),
  uva: montarTema(PRIMITIVOS.uva, "Uva (roxo e magenta)"),
  joaquina: montarTema(PRIMITIVOS.joaquina, "Praia da Joaquina (mar e areia)", "joaquina", "joaquinaEscuro"),
};

export const TEMA_PADRAO = "garapuvu";

// Gera o bloco CSS `:root { --slot: valor }` + as sobrescritas do modo escuro,
// a partir do tema escolhido. É isto que o report.js injeta no <style>.
//
// São TRÊS blocos, e a ordem importa (quem vem depois ganha):
//   1. `:root`                       → claro é a base.
//   2. `@media (prefers-color-scheme: dark)` → escuro quando o SISTEMA pede,
//      mas ignorado se o leitor travou o claro no botão (`[data-tema="claro"]`).
//   3. `:root[data-tema="escuro"]`   → escuro quando o BOTÃO pede, mesmo com o
//      sistema no claro.
// Sem o bloco 3 o botão só conseguiria escurecer quem já estava escuro; sem o
// `:not()` do bloco 2 ele não conseguiria clarear quem está no escuro.
export function cssTokens(nomeTema = TEMA_PADRAO) {
  const tema = TEMAS[nomeTema] || TEMAS[TEMA_PADRAO];
  const linhas = (mapa, ind) =>
    Object.entries(mapa).map(([slot, cor]) => `${ind}--${slot}: ${cor};`).join("\n");
  return `:root{
${linhas(tema.claro, "    ")}
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-tema="claro"]){
${linhas(tema.escuro, "      ")}
    }
  }
  :root[data-tema="escuro"]{
${linhas(tema.escuro, "    ")}
  }`;
}
