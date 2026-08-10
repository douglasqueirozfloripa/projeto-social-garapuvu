// modulos.js — Catálogo dos módulos do app em UM só lugar.
//
// Tanto o menu (MenuPrincipal) quanto os atalhos do painel (Dashboard) leem
// desta lista. Assim, adicionar um módulo novo é mexer em um único arquivo — as
// duas telas acompanham sozinhas, sem risco de o menu e o painel discordarem.
//
// Campos:
//  - id        → identifica a aba no App.jsx (e vira o data-testid `nav-<id>`)
//  - rotulo    → o texto que a pessoa lê (nome acessível do botão)
//  - icone     → nome do desenho em components/Icone.jsx (ícones do Lucide).
//                É decoração: o Icone já sai com aria-hidden, então o leitor de
//                tela anuncia só o rótulo ("Início"), nunca o desenho
//  - atalho    → true = ganha um cartão no painel inicial
//  - descricao → função do papel (contratante/freelancer), porque o mesmo
//                módulo significa coisas diferentes para cada um
export const MODULOS = [
  {
    id: "inicio",
    rotulo: "Início",
    icone: "home",
    atalho: false, // é a própria tela do painel: não faz sentido ter atalho para si mesma
    descricao: () => "Visão geral da sua conta, com números e atalhos.",
  },
  {
    id: "projetos",
    rotulo: "Projetos",
    icone: "clipboard-list",
    atalho: true,
    descricao: (papel) =>
      papel === "contratante"
        ? "Publique vagas, veja os candidatos e conclua os projetos."
        : "Veja as vagas publicadas e candidate-se.",
  },
  {
    id: "perfil",
    rotulo: "Meu perfil",
    icone: "user",
    atalho: true,
    descricao: () => "Sua reputação 360 e os dados de contato.",
  },
  {
    id: "flags",
    rotulo: "Flags",
    icone: "flag",
    atalho: true,
    descricao: () => "Liga e desliga recursos em teste (feature flags).",
  },
];

// Módulo aberto logo depois do login.
export const MODULO_INICIAL = "inicio";

// Nome legível de um módulo — usado no aviso de troca de tela que o leitor de
// tela anuncia ("Seção atual: Projetos").
export const rotuloDoModulo = (id) =>
  MODULOS.find((m) => m.id === id)?.rotulo || id;
