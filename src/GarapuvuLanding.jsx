import React, { useState, useEffect, useRef } from "react";
import { track } from "./firebase.js";
import useVisitorCount from "./useVisitorCount.js";
import heroBg from "./assets/garapuvu-hero.jpg";

// ─────────────────────────────────────────────────────────────
// Projeto Social Garapuvu 2026 — Landing Page
//
// O rastreamento de eventos (track) é feito via Firebase Analytics —
// veja src/firebase.js. Quando o Analytics não está disponível (SSR,
// navegador sem suporte), o track faz no-op seguro com log no console.
// ─────────────────────────────────────────────────────────────

// Redes sociais do projeto e do instrutor.
const INSTAGRAM_URL = "https://www.instagram.com/projetogarapuvu/";
const LINKEDIN_URL = "https://br.linkedin.com/in/douglas-adriano-queiroz-ctfl-680b1978";
const GITHUB_URL = "https://github.com/douglasqueirozfloripa/projeto-social-garapuvu";
const YOUTUBE_URL = "https://www.youtube.com/@ProjetoGarapuvuFloripa";

// Vídeo de apresentação do projeto, exibido ao lado do texto no topo da página.
// É só o ID do vídeo — o trecho final da URL do YouTube.
// https://youtu.be/9oAqu7JxWo8  →  "9oAqu7JxWo8"
// Deixe "" para tirar o vídeo do ar: com a string vazia o bloco não é renderizado
// e o topo volta a ocupar a largura toda.
const YOUTUBE_ID = "9oAqu7JxWo8";

// ─── Encontros gravados ──────────────────────────────────────────────────
// Playlist "Trilha de Testes e Desenvolvimento de Software com apoio da IA",
// no canal do projeto. Os vídeos ficam aqui só pelo ID — o trecho final da URL:
// https://youtu.be/j0xPg0aR4Hg  →  "j0xPg0aR4Hg"
//
// Para publicar o próximo encontro, acrescente um objeto no FIM da lista. A
// seção se ajusta sozinha (numeração, contagem e total de horas saem daqui).
const PLAYLIST_ID = "PLcGnsisXdbAc";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

const ENCONTROS = [
  {
    id: "j0xPg0aR4Hg",
    title: "Guia de Estudos, Fundamentos de Testes e preparação do ambiente",
    aulas: "Aulas 00 · 0.1 · 01",
    minutos: 63,
    resumo:
      "Abertura da trilha: o guia de estudos e os links do projeto, a preparação do ambiente de desenvolvimento no Windows e no macOS e a primeira aula de teoria — o que é testar, por que testar, os sete princípios e o processo de teste do CTFL 4.0.",
    topics: ["Guia de estudos", "Preparação do ambiente", "Princípios de teste", "CTFL 4.0"],
  },
  {
    id: "ka4T2ZY4Z4I",
    title: "Modelos ágeis, Teste Estático e análise de código",
    aulas: "Aulas 02 · 03",
    minutos: 62,
    resumo:
      "Onde o teste entra no ciclo de desenvolvimento: modelos sequenciais e iterativos, o Manifesto Ágil, DevOps e pipelines de CI/CD. Na segunda metade, teste estático — revisões, inspeções e análise de código — e por que achar o defeito no documento custa menos que achar no software rodando.",
    topics: ["Modelos de desenvolvimento", "Ágil e DevOps", "CI/CD", "Teste estático", "Revisões"],
  },
  {
    id: "4TVc45X4Bxg",
    title: "Meu primeiro app com IA — FreeLancer360 (backend + frontend)",
    aulas: "Prática · Módulos 2 e 3",
    minutos: 72,
    resumo:
      "Mão na massa do começo ao fim: o FreeLancer360 construído do zero — backend e frontend — escrevendo o aplicativo por prompts de IA dentro do Visual Studio Code. É o encontro que mostra o fluxo completo: descrever o requisito, gerar o código, rodar, testar e ajustar.",
    topics: ["Meu primeiro app", "Prompts com IA", "Backend", "Frontend", "FreeLancer360"],
  },
  {
    id: "ozcOjpgV9uY",
    title: "Níveis e tipos de teste + técnicas de caixa preta e branca",
    aulas: "Aulas 04 · 05",
    minutos: 90,
    resumo:
      "Os quatro níveis de teste — componente, integração, sistema e aceitação — e os tipos: funcional, não funcional, de confirmação e de regressão. Depois, as técnicas aplicadas: partição de equivalência, valor limite, tabela de decisão e transição de estados; cobertura de comandos e decisões; e teste baseado em experiência.",
    topics: ["Níveis de teste", "Tipos de teste", "Caixa preta", "Caixa branca", "Baseado em experiência"],
  },
  {
    id: "AK0daIca7Rs",
    title: "Segurança e boas práticas — projeto Catch Request",
    aulas: "Prática · Módulo Bônus",
    minutos: 88,
    resumo:
      "Quatro ferramentas rodando sobre o código real do projeto Catch Request: ESLint para qualidade de código, SonarQube para análise estática, OWASP ZAP para varredura de vulnerabilidades e Lighthouse para performance e boas práticas web.",
    topics: ["Segurança", "ESLint", "SonarQube", "OWASP ZAP", "Lighthouse", "Catch Request"],
  },
  {
    id: "9PoCda7gA5A",
    title: "Quality Gate no Sonar + testes de design (acessibilidade e UX/UI)",
    aulas: "Aula 06 · Prática",
    minutos: 70,
    resumo:
      "Fechando o ciclo do Sonar com o Quality Gate: quando a esteira barra o código e o que fazer com a dívida técnica. Na sequência, os testes de design — acessibilidade, usabilidade e avaliação de UX/UI, o tipo de teste que olha para a pessoa que usa o software.",
    topics: ["Quality Gate", "SonarQube", "Acessibilidade", "Usabilidade", "UX/UI"],
  },
  {
    id: "NghZVfJEY28",
    title: "Gerenciamento e estimativa de testes + rastreabilidade",
    aulas: "Aulas 07 · 11",
    minutos: 112,
    resumo:
      "O encontro mais longo da trilha. Gerenciamento de teste: planejamento, estratégia, estimativas, riscos e monitoramento do progresso. Na parte prática, testes funcionais e a matriz de rastreabilidade, ligando requisito → caso de teste → defeito com os exemplos do próprio projeto.",
    topics: ["Planejamento", "Estimativas", "Riscos", "Testes funcionais", "Rastreabilidade"],
  },
];

// "63" → "1h03"; "47" → "47min". Usado nos cartões e no total da seção.
function formatarDuracao(minutos) {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

// Contato via WhatsApp — formato internacional: 55 (Brasil) + 48 (DDD) + número.
const WHATSAPP_NUMBER = "5548999886724";
const WHATSAPP_MESSAGE =
  "Olá! Tenho interesse no Projeto Social Garapuvu 2026 e gostaria de saber como participar.";

// Abre uma nova conversa no WhatsApp (Web no desktop, app no celular) com a
// mensagem já preenchida, e registra o evento no Analytics.
function openWhatsApp(eventName) {
  track(eventName);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// Rola suavemente até uma seção da página (pelo id) e registra o evento.
function scrollToSection(id, eventName) {
  track(eventName);
  if (typeof document !== "undefined") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ─── Tema ────────────────────────────────────────────────────────────────
// A paleta virou variáveis CSS (ver THEME_CSS abaixo) para o site inteiro poder
// alternar entre escuro e claro sem re-renderizar nada: o React só troca o
// atributo `data-theme` no <html> e o navegador resolve o resto.
//
// Os nomes aqui são SEMÂNTICOS (o que a cor faz), não literais (que cor é).
// Antes, `ink` acumulava três papéis diferentes — texto, fundo das faixas
// escuras e texto sobre o dourado — que no modo escuro precisam divergir.
const COLORS = {
  // Superfícies e texto — mudam com o tema.
  page: "var(--gp-page)",           // fundo geral da página
  surface: "var(--gp-surface)",     // fundo dos cartões
  surfaceAlt: "var(--gp-surface-alt)", // blocos de aviso
  border: "var(--gp-border)",       // bordas e divisórias
  text: "var(--gp-text)",           // texto principal sobre a página
  textSoft: "var(--gp-text-soft)",  // parágrafos de apoio
  muted: "var(--gp-muted)",         // legendas e textos discretos
  branch: "var(--gp-branch)",       // traço do galho desenhado (Branch)
  leaf: "var(--gp-leaf)",           // verde-folha (marcos concluídos)
  bloom: "var(--gp-bloom)",         // ouro da floração — ação e destaque
  bloomDeep: "var(--gp-bloom-deep)", // âmbar de TEXTO — números, legendas e títulos secundários
  bloomWarm: "var(--gp-bloom-warm)", // âmbar DECORATIVO — gradiente do CTA e miolo da flor

  // Faixas escuras (hero, currículo, rodapé) e o dourado são âncoras da marca:
  // ficam escuras/douradas nos DOIS temas, então estas cores não variam.
  band: "var(--gp-band)",           // fundo das faixas escuras
  bandRgb: "var(--gp-band-rgb)",    // mesma cor em canal, para gradientes com alfa
  onBand: "#FBF7EE",                // texto sobre as faixas escuras
  onBandBody: "#C9D4E4",            // parágrafo sobre faixa escura
  onBandCaption: "#9FB0C6",         // legenda sobre faixa escura
  onBandFooter: "#8DA0BA",          // texto do rodapé
  onBloom: "#0E1F38",               // texto sobre o dourado (botões, CTA)
  mist: "#92A4BE",                  // texto discreto sobre faixa escura
};

// Onde a preferência de tema fica guardada no navegador.
const THEME_KEY = "gp_theme";

// Escuro é o padrão: é o `:root`. O claro entra só quando a pessoa troca no
// botão do topo, que grava `data-theme="light"` no <html>.
const THEME_CSS = `
  :root {
    --gp-page: #0A1728;
    --gp-surface: #16304F;
    --gp-surface-alt: #1B3A5E;
    --gp-border: #22405F;
    --gp-text: #EAF1FA;
    --gp-text-soft: #C2D2E6;
    --gp-muted: #93A9C4;
    --gp-branch: #C08A4A;
    --gp-leaf: #6FBF8B;
    --gp-bloom: #F2B705;
    --gp-bloom-deep: #F0A020;
    --gp-bloom-warm: #E08A00;
    /* Faixas um tom ACIMA do fundo: no escuro, é o contraste entre elas e a
       página que mantém o ritmo de seções que o tema claro faz com bege x azul. */
    --gp-band: #102944;
    --gp-band-rgb: 16, 41, 68;
    --gp-card-shadow: 0 10px 30px rgba(0,0,0,.28);
  }

  :root[data-theme="light"] {
    --gp-page: #FBF7EE;
    --gp-surface: #FFFFFF;
    --gp-surface-alt: #F0E9DA;
    --gp-border: #F0E9DA;
    --gp-text: #0E1F38;
    --gp-text-soft: #1B3357;
    --gp-muted: #5B4636;
    --gp-branch: #5B4636;
    --gp-leaf: #3E6B4F;
    --gp-bloom: #F2B705;
    --gp-bloom-deep: #A85F00;
    --gp-bloom-warm: #E08A00;
    --gp-band: #0E1F38;
    --gp-band-rgb: 14, 31, 56;
    --gp-card-shadow: none;
  }
`;

// `n` é o rótulo exibido ("Módulo 01", "Módulo Bônus"); `slug` é o que vai para o
// Analytics — o GA4 só aceita nomes de evento com letras, números e underscore.
const MODULES = [
  {
    n: "01",
    slug: "01",
    title: "Fundamentos de Testes de Software",
    tag: "CTFL · Certified Tester Foundation Level",
    lessons: [
      "Fundamentos, riscos e estratégias de teste",
      "Modelos de desenvolvimento, ágil, DevOps e CI/CD",
      "Teste estático, revisões e análise de código",
      "Níveis e tipos de testes",
      "Técnicas de caixa preta, branca e por experiência",
      "Testes de design: acessibilidade, usabilidade e UX/UI",
      "Gerenciamento, planejamento e estimativas de teste",
      "Ferramentas, performance e Planning Poker",
      "Pirâmide de testes, métricas e KPIs de qualidade",
      "Scrum e Kanban",
    ],
  },
  {
    n: "02",
    slug: "02",
    title: "Prática em Testes de Software",
    tag: "Mão na massa: do primeiro caso de teste à publicação de um app",
    lessons: [
      "Testes funcionais e rastreabilidade",
      "Testes exploratórios e session-based testing",
      "Testes automatizados E2E",
      "Testes de API (Postman / Insomnia)",
      "Testes de layout e cross-browser",
      "Testes de usabilidade e heurísticas de Nielsen",
      "Meu primeiro app: deploy e versionamento",
      "GitHub, frameworks e boas práticas",
      "Currículo, LinkedIn e portfólio",
      "Simulados e certificação CTFL",
    ],
  },
  {
    n: "03",
    slug: "03",
    title: "Inteligência Artificial e Cursor IDE",
    tag: "O módulo mais moderno: desenvolver e testar com apoio de IA",
    lessons: [
      "Introdução à IA generativa (ChatGPT, Claude e outras)",
      "Cursor IDE: o editor do futuro",
      "Programação assistida por IA",
      "Testes automatizados com IA",
      "IA para documentação e qualidade",
      "Projeto prático: IA + Testes ponta a ponta",
    ],
  },
  {
    n: "04",
    slug: "04",
    title: "Data Science e Testes",
    tag: "Dados, Python e pytest — testar além da interface",
    lessons: [
      "Introdução a Data Science e testes",
      "Testes com Python e pytest",
      "Qualidade e validação de dados",
      "Automação: unit, API e interface",
      "Desafio final de Data Science (Churn)",
    ],
  },
  {
    n: "Bônus",
    slug: "bonus",
    title: "Mercado de Trabalho",
    tag: "O que o mercado cobra no dia a dia de QA",
    lessons: [
      "SQL e validação de dados",
      "Ferramentas de mercado",
      "Testes mobile",
      "Abertura e documentação de bugs",
      "Segurança de software",
    ],
  },
];

const STATS = [
  { value: "140+", label: "horas de curso" },
  { value: "36", label: "aulas" },
  { value: "6", label: "anos de projeto" },
  { value: "2", label: "países atendidos" },
];

const HOWITWORKS = [
  ["Encontros", "Quartas-feiras, das 18h às 20h"],
  ["Plataforma", "Aulas remotas via Google Meet"],
  ["Inscrição", "Basta ter um e-mail e um computador com internet"],
  ["Suporte", "Professores disponíveis durante a semana"],
  ["Origem", "Florianópolis, Santa Catarina — e agora em todo o Brasil"],
  ["Idade mínima", "16 anos (com autorização dos pais)"],
];

const OBJECTIVES = [
  ["Capacitação", "Capacitar profissionais que atuam ou desejam atuar na área de tecnologia."],
  ["Integração", "Integrar profissionais e mentores no processo de tutoria."],
  ["Conexão com o mercado", "Aproximar empresas do projeto, criando um banco de profissionais capacitados."],
  ["Desenvolvimento nacional", "Ajudar no desenvolvimento tecnológico e sustentável do Brasil."],
  ["Multiplicação", "Disseminar conhecimento e formar novos tutores e professores."],
  ["Impacto social", "Abrir portas da tecnologia para pessoas de qualquer origem ou país."],
];

// Marcos da turma que começou em junho de 2026. `done: true` marca o que já foi
// entregue — a seção mostra ✓ verde nesses e → dourado no que ainda vem pela frente.
const MILESTONES = [
  {
    period: "Junho 2026 — Início",
    items: [
      { t: "Primeira turma do ano em aula", done: true },
      { t: "Módulo de IA consolidado", done: true },
      { t: "Encontros remotos, uma noite por semana", done: true },
    ],
  },
  {
    period: "Dezembro 2026",
    items: [
      { t: "Formar 30 pessoas até o fim do ano" },
      { t: "Consolidar o conteúdo do Módulo 4 — Data Science e Testes" },
      { t: "Integrar empresas parceiras ao projeto" },
    ],
  },
  {
    period: "Julho 2027",
    items: [
      { t: "Formar 50 pessoas" },
      { t: "Programa de mentoria" },
      { t: "Evento de formatura presencial" },
    ],
  },
];

// Hook simples para revelar elementos no scroll
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

function Reveal({ children, delay = 0, as: Tag = "div", style, ...rest }) {
  const [ref, shown] = useReveal();
  return (
    <Tag
      ref={ref}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        transition: `opacity .7s cubic-bezier(.2,.7,.2,1) ${delay}s, transform .7s cubic-bezier(.2,.7,.2,1) ${delay}s`,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Galho com flores do garapuvu — assinatura visual
function Branch({ blooms = 5, flip = false }) {
  return (
    <svg viewBox="0 0 200 80" width="100%" height="100%" aria-hidden="true"
      style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}>
      <path d="M5 70 Q 70 60 110 35 T 195 12" fill="none" stroke={COLORS.branch} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 62 Q 80 50 70 38" fill="none" stroke={COLORS.branch} strokeWidth="2" strokeLinecap="round" />
      <path d="M130 28 Q 150 30 150 16" fill="none" stroke={COLORS.branch} strokeWidth="2" strokeLinecap="round" />
      {Array.from({ length: blooms }).map((_, i) => {
        const t = i / (blooms - 1);
        const x = 5 + t * 190;
        const y = 70 - t * 58 - Math.sin(t * Math.PI) * 6;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-5" rx="2.4" ry="5"
                fill={COLORS.bloom} transform={`rotate(${a})`} opacity="0.95" />
            ))}
            <circle r="2.2" fill={COLORS.bloomWarm} />
          </g>
        );
      })}
    </svg>
  );
}

// Total de visitantes que já acessaram, exibido ao lado da marca no topo.
// Pílula discreta sobre o fundo escuro do hero.
function VisitorCount() {
  const count = useVisitorCount();
  if (count == null) return null; // ainda carregando ou indisponível

  const formatted = count.toLocaleString("pt-BR");

  return (
    <span
      aria-live="polite"
      title="Total de pessoas que já visitaram"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,.08)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
        fontSize: 12.5,
        fontWeight: 600,
        color: COLORS.onBand,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 13 }}>👁️</span>
      <strong style={{ color: COLORS.bloom }}>{formatted}</strong>
      <span style={{ color: COLORS.mist }}>{count === 1 ? "visita" : "visitas"}</span>
    </span>
  );
}

// Links para as redes sociais — registra o clique no Analytics e abre em nova aba.
function SocialLinks() {
  const links = [
    {
      href: INSTAGRAM_URL,
      label: "Instagram do Projeto Garapuvu",
      event: "social_instagram",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
    {
      href: YOUTUBE_URL,
      label: "Canal do Projeto Garapuvu no YouTube",
      event: "social_youtube",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2c-.23-1.7-.94-2.36-2.62-2.5C16.9 4.5 14.6 4.4 12 4.4s-4.9.1-6.98.3c-1.68.14-2.4.8-2.62 2.5C2.2 8.4 2.1 10 2.1 12s.1 3.6.3 4.8c.22 1.7.94 2.36 2.62 2.5 2.08.2 4.38.3 6.98.3s4.9-.1 6.98-.3c1.68-.14 2.4-.8 2.62-2.5.2-1.2.3-2.8.3-4.8s-.1-3.6-.3-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      ),
    },
    {
      href: LINKEDIN_URL,
      label: "LinkedIn de Douglas Adriano Queiroz",
      event: "social_linkedin",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9V9z" />
        </svg>
      ),
    },
    {
      href: GITHUB_URL,
      label: "Repositório do Projeto Garapuvu no GitHub",
      event: "social_github",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.5v-1.8c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.95-.65.07-.64.07-.64 1.06.08 1.61 1.09 1.61 1.09.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.67-1.4-2.33-.27-4.78-1.17-4.78-5.19 0-1.15.41-2.09 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.08a9.9 9.9 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.52.1 2.79.67.73 1.08 1.67 1.08 2.82 0 4.03-2.46 4.92-4.8 5.18.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: "inline-flex", gap: 14, marginBottom: 18 }}>
      {links.map((l) => (
        <a
          key={l.event}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          title={l.label}
          onClick={() => track(l.event)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 42,
            height: 42,
            borderRadius: 999,
            color: COLORS.onBand,
            background: "rgba(255,255,255,.07)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.16)",
            transition: "color .2s, background .2s, transform .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.onBloom; e.currentTarget.style.background = COLORS.bloom; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.onBand; e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "none"; }}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

// Vídeo de apresentação exibido ao lado do texto no topo da página.
// Sem YOUTUBE_ID preenchido não renderiza nada — veja a constante no topo do arquivo.
function HeroVideo() {
  const tracked = useRef(false);

  if (!YOUTUBE_ID) return null;

  // O iframe não avisa quando a pessoa dá play (isso exigiria carregar a IFrame API
  // do YouTube). Registramos o primeiro clique sobre o player como aproximação.
  const handleFirstClick = () => {
    if (tracked.current) return;
    tracked.current = true;
    track("hero_video");
  };

  return (
    <Reveal
      delay={0.12}
      onClick={handleFirstClick}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 18,
        overflow: "hidden",
        background: "rgba(0,0,0,.35)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.16), 0 18px 44px rgba(0,0,0,.32)",
      }}
    >
      <iframe
        // Domínio sem cookies de rastreio do YouTube — mais amigável à LGPD.
        src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`}
        title="Vídeo de apresentação do Projeto Social Garapuvu"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
      />
    </Reveal>
  );
}

// ─── Seção "Encontros gravados" ──────────────────────────────────────────
// A ideia é a pessoa assistir sem sair da landing: um player fixo à esquerda e
// a lista de encontros à direita. Clicar num item troca o vídeo do player (com
// autoplay) em vez de abrir o YouTube — por isso o `key` no iframe, que força a
// remontagem quando o ID muda.
function EncontrosSection() {
  const [atual, setAtual] = useState(0);
  // Só damos autoplay depois do primeiro clique: no carregamento da página o
  // player fica parado, esperando a pessoa decidir.
  const [autoplay, setAutoplay] = useState(false);
  const playerRef = useRef(null);

  const encontro = ENCONTROS[atual];
  const totalMinutos = ENCONTROS.reduce((soma, e) => soma + e.minutos, 0);

  const escolher = (i) => {
    if (i === atual) return;
    setAtual(i);
    setAutoplay(true);
    track("encontro_" + String(i + 1).padStart(2, "0"));
    // No celular a lista fica embaixo do player: sem este scroll a pessoa
    // clicaria e não veria o vídeo trocar.
    if (typeof window !== "undefined" && window.innerWidth <= 920) {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const src =
    `https://www.youtube-nocookie.com/embed/${encontro.id}` +
    `?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`;

  return (
    <section id="encontros" className="gp-wrap" style={{ paddingTop: 90, paddingBottom: 40, scrollMarginTop: 24 }}>
      <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloomDeep }}>
        Encontros gravados
      </Reveal>
      <Reveal as="h2" delay={0.05} className="gp-display"
        style={{ fontSize: "clamp(1.9rem, 5.2vw, 2.5rem)", fontWeight: 900, margin: "10px 0 12px" }}>
        Perdeu uma aula? Assista aqui mesmo.
      </Reveal>
      <Reveal as="p" delay={0.08}
        style={{ color: COLORS.textSoft, maxWidth: 640, margin: "0 0 34px", fontSize: 16.5, lineHeight: 1.6 }}>
        {ENCONTROS.length} encontros já publicados — {formatarDuracao(totalMinutos)} de aula, com
        teoria do CTFL e prática em projetos reais. Escolha um na lista e o vídeo
        abre nesta página.
      </Reveal>

      <div className="gp-encontros" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28, alignItems: "start" }}>
        {/* ── Player + resumo do encontro selecionado ── */}
        <div ref={playerRef}>
          <div style={{
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 18,
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 18px 44px rgba(0,0,0,.28)",
          }}>
            <iframe
              key={encontro.id}
              src={src}
              title={`Encontro ${atual + 1} — ${encontro.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          </div>

          <div className="gp-card" style={{ padding: "24px 26px", marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.bloomDeep }}>
              <span>Encontro {String(atual + 1).padStart(2, "0")}</span>
              <span style={{ color: COLORS.muted, fontWeight: 600 }}>{encontro.aulas}</span>
              <span style={{ color: COLORS.muted, fontWeight: 600 }}>· {formatarDuracao(encontro.minutos)}</span>
            </div>

            <h3 className="gp-display" style={{ fontSize: "clamp(1.25rem, 3.4vw, 1.6rem)", fontWeight: 900, margin: "10px 0 12px", lineHeight: 1.15 }}>
              {encontro.title}
            </h3>

            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: COLORS.textSoft, margin: 0 }}>
              {encontro.resumo}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              {encontro.topics.map((t) => (
                <span key={t} style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 999,
                  color: COLORS.bloomDeep,
                  background: COLORS.surfaceAlt,
                }}>
                  {t}
                </span>
              ))}
            </div>

            <a
              href={`https://www.youtube.com/watch?v=${encontro.id}&list=${PLAYLIST_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-link"
              onClick={() => track("encontro_youtube")}
              style={{ display: "inline-block", marginTop: 18, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              Abrir no YouTube ↗
            </a>
          </div>
        </div>

        {/* ── Lista das trilhas disponíveis ── */}
        <div>
          {/* A altura acompanha a coluna do player (vídeo + cartão do resumo).
              Com os 7 encontros de hoje tudo cabe sem rolar; a partir do oitavo a
              lista ganha rolagem própria em vez de esticar a seção. */}
          <div className="gp-playlist" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 700, overflowY: "auto", paddingRight: 4 }}>
            {ENCONTROS.map((e, i) => {
              const ativo = i === atual;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => escolher(i)}
                  aria-current={ativo ? "true" : undefined}
                  className="gp-epitem"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "38px 1fr",
                    gap: 12,
                    alignItems: "start",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer",
                    border: `1px solid ${ativo ? "transparent" : COLORS.border}`,
                    borderRadius: 14,
                    padding: "13px 15px",
                    fontFamily: "inherit",
                    background: ativo ? COLORS.bloom : COLORS.surface,
                    color: ativo ? COLORS.onBloom : COLORS.text,
                    transition: "background .2s, border-color .2s, transform .15s",
                  }}
                >
                  <span className="gp-display" style={{ fontSize: 17, fontWeight: 900, opacity: ativo ? 0.85 : 0.55, paddingTop: 1 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>
                      {e.title}
                    </span>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: ativo ? COLORS.onBloom : COLORS.muted,
                      opacity: ativo ? 0.8 : 1,
                    }}>
                      <span aria-hidden="true">{ativo ? "▶" : "▷"}</span>
                      {formatarDuracao(e.minutos)}
                      <span aria-hidden="true">·</span>
                      {e.aulas}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <a
            href={PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("playlist_youtube")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              marginTop: 12,
              padding: "13px 18px",
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M21.6 7.2c-.23-1.7-.94-2.36-2.62-2.5C16.9 4.5 14.6 4.4 12 4.4s-4.9.1-6.98.3c-1.68.14-2.4.8-2.62 2.5C2.2 8.4 2.1 10 2.1 12s.1 3.6.3 4.8c.22 1.7.94 2.36 2.62 2.5 2.08.2 4.38.3 6.98.3s4.9-.1 6.98-.3c1.68-.14 2.4-.8 2.62-2.5.2-1.2.3-2.8.3-4.8s-.1-3.6-.3-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
            </svg>
            Ver a playlist completa no YouTube
          </a>
        </div>
      </div>
    </section>
  );
}

// Lê a preferência salva. Sem nada gravado, o padrão é o escuro — quem quiser
// claro troca no botão e a escolha fica valendo nas próximas visitas.
function temaInicial() {
  if (typeof window === "undefined") return "dark";
  try {
    const salvo = window.localStorage.getItem(THEME_KEY);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch {
    /* localStorage bloqueado (modo privado) — segue no padrão. */
  }
  return "dark";
}

// Botão do topo que alterna entre os temas. Mostra o ícone e o NOME do modo
// para onde o clique leva — sol/“Dia” quando está escuro, lua/“Noturno” quando
// está claro — para não deixar dúvida sobre o que o botão faz.
function ThemeToggle({ theme, onToggle }) {
  const escuro = theme === "dark";
  const destino = escuro ? "Dia" : "Noturno";
  const rotulo = escuro ? "Mudar para o tema claro (dia)" : "Mudar para o tema escuro (noturno)";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={rotulo}
      title={rotulo}
      aria-pressed={!escuro}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        height: 38,
        padding: "0 14px 0 12px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: COLORS.onBand,
        background: "rgba(255,255,255,.08)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.16)",
        transition: "color .2s, background .2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.onBloom; e.currentTarget.style.background = COLORS.bloom; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.onBand; e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
    >
      {escuro ? (
        // Sol — clicar leva ao tema claro.
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
        </svg>
      ) : (
        // Lua — clicar leva ao tema escuro.
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M21 14.2a8.6 8.6 0 0 1-11.2-11 8.8 8.8 0 1 0 11.2 11z" />
        </svg>
      )}
      <span aria-hidden="true">{destino}</span>
    </button>
  );
}

export default function GarapuvuLanding() {
  const [openModule, setOpenModule] = useState(0);
  const [theme, setTheme] = useState(temaInicial);

  // O tema vive no <html>, não neste componente: assim as variáveis CSS valem
  // para a página toda (inclusive a cor de fundo atrás do conteúdo, no bounce
  // do scroll) e a barra do navegador no celular acompanha.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0A1728" : "#0E1F38");
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignora — a troca vale para esta sessão mesmo sem poder salvar. */
    }
  }, [theme]);

  const alternarTema = () => {
    const proximo = theme === "dark" ? "light" : "dark";
    setTheme(proximo);
    track("tema_" + proximo);
  };

  return (
    <div style={{ background: COLORS.page, color: COLORS.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600;700&display=swap');
        ${THEME_CSS}
        * { box-sizing: border-box; }
        html, body { background: ${COLORS.page}; }
        /* Suaviza a troca de tema, mas respeita quem pediu menos animação. */
        @media (prefers-reduced-motion: no-preference) {
          body, .gp-card, .gp-modtab { transition: background-color .25s ease, color .25s ease, border-color .25s ease; }
        }
        html, body { margin: 0; overflow-x: hidden; max-width: 100%; }
        img, video { max-width: 100%; height: auto; }
        .gp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .gp-display { font-family: 'Fraunces', Georgia, serif; line-height: 1.02; letter-spacing: -0.02em; }
        .gp-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
        .gp-btn { cursor: pointer; border: none; font-family: inherit; font-weight: 700;
          border-radius: 999px; padding: 15px 30px; font-size: 15px; transition: transform .15s, box-shadow .15s; }
        .gp-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(240,138,0,.35); }
        .gp-btn:focus-visible { outline: 3px solid ${COLORS.bloom}; outline-offset: 3px; }
        .gp-lesson { display: grid; grid-template-columns: 34px 1fr; gap: 14px; align-items: start;
          padding: 11px 0; border-bottom: 1px solid ${COLORS.border}; }
        .gp-lesson:last-child { border-bottom: none; }
        .gp-num { font-family: 'Fraunces', serif; font-weight: 600; color: ${COLORS.bloomDeep}; font-size: 15px; padding-top: 1px; }
        .gp-modtab { cursor: pointer; text-align: left; width: 100%; background: none; border: none;
          font-family: inherit; padding: 18px 20px; border-radius: 16px; transition: background .2s, color .2s; }
        .gp-modtab:focus-visible { outline: 3px solid ${COLORS.bloom}; outline-offset: 2px; }
        .gp-card { background: ${COLORS.surface}; border: 1px solid ${COLORS.border};
          border-radius: 18px; box-shadow: var(--gp-card-shadow); }
        a.gp-link { color: ${COLORS.bloomDeep}; }
        .gp-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .gp-row2 { display: grid; grid-template-columns: 150px 1fr; gap: 16px; }

        /* Lista de encontros: hover só onde há mouse, para o toque no celular
           não deixar o item "grudado" no estado de hover. */
        @media (hover: hover) {
          .gp-epitem:hover { border-color: ${COLORS.bloom} !important; transform: translateY(-2px); }
        }
        .gp-epitem:focus-visible { outline: 3px solid ${COLORS.bloom}; outline-offset: 2px; }
        .gp-playlist { scrollbar-width: thin; scrollbar-color: ${COLORS.border} transparent; }
        .gp-playlist::-webkit-scrollbar { width: 8px; }
        .gp-playlist::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 999px; }
        .gp-playlist::-webkit-scrollbar-track { background: transparent; }

        /* ── Tablet ── */
        @media (max-width: 920px) {
          .gp-herolayout { grid-template-columns: 1fr !important; gap: 36px !important; }
          /* Player em cima, lista embaixo — e a lista deixa de rolar sozinha,
             para não criar uma segunda rolagem dentro da página. */
          .gp-encontros { grid-template-columns: 1fr !important; }
          .gp-playlist { max-height: none !important; }
          .gp-grid3 { grid-template-columns: 1fr 1fr !important; }
          .gp-modlayout { grid-template-columns: 1fr !important; }
          .gp-modtabs { flex-direction: row !important; overflow-x: auto; padding-bottom: 6px; }
          .gp-modtab { min-width: 220px; }
        }

        /* ── Celular ── */
        @media (max-width: 760px) {
          .gp-wrap { padding: 0 18px; }
          .gp-grid2 { grid-template-columns: 1fr !important; }
          .gp-grid3 { grid-template-columns: 1fr !important; }
          .gp-stats { grid-template-columns: 1fr 1fr !important; }
          .gp-row2 { grid-template-columns: 1fr !important; gap: 2px !important; padding: 12px 0 !important; }
          .gp-modtab { min-width: 200px; }
        }

        /* ── Celular pequeno ── */
        @media (max-width: 400px) {
          .gp-btn { width: 100%; }
        }
        @media (max-width: 320px) {
          .gp-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HERO */}
      <header style={{ background: COLORS.band, color: COLORS.onBand, position: "relative", overflow: "hidden" }}>
        {/* Imagem de fundo (garapuvu florido) — espelhada para jogar as flores
            para a direita, longe do texto à esquerda. */}
        <div style={{ position: "absolute", inset: 0,
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scaleX(-1)" }} />
        {/* Overlay escuro: forte à esquerda (texto legível) e suave à direita
            (deixa as flores aparecerem), com leve escurecida geral. */}
        <div style={{ position: "absolute", inset: 0,
          background: `linear-gradient(90deg, ${COLORS.band} 0%, rgba(${COLORS.bandRgb},.82) 38%, rgba(${COLORS.bandRgb},.45) 70%, rgba(${COLORS.bandRgb},.2) 100%)` }} />
        <div style={{ position: "absolute", inset: 0,
          background: `linear-gradient(to top, ${COLORS.band} 0%, transparent 28%)` }} />
        <div className="gp-wrap" style={{ position: "relative", paddingTop: 40, paddingBottom: 64 }}>
          <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 70, gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span className="gp-display" style={{ fontWeight: 900, fontSize: 22 }}>
                Garapuvu<span style={{ color: COLORS.bloom }}>.</span>
              </span>
              <VisitorCount />
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
              <span className="gp-eyebrow" style={{ color: COLORS.mist }}>Turma 2026</span>
              <ThemeToggle theme={theme} onToggle={alternarTema} />
            </span>
          </nav>

          {/* Texto à esquerda; o vídeo (quando publicado) entra na coluna da direita.
              Sem YOUTUBE_ID o grid vira coluna única e o topo fica como antes. */}
          <div
            className="gp-herolayout"
            style={{
              display: "grid",
              gridTemplateColumns: YOUTUBE_ID ? "1fr 420px" : "1fr",
              gap: 48,
              alignItems: "center",
            }}
          >
            <div>
              <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloom, marginBottom: 22 }}>
                ● Projeto Social · 100% gratuito · remoto
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="gp-display gp-hero-h1" style={{ fontSize: "clamp(2.4rem, 8vw, 4.75rem)", fontWeight: 900, margin: 0, maxWidth: 880 }}>
                  Aprender tecnologia de graça, de{" "}
                  <span style={{ color: COLORS.bloom, fontStyle: "italic" }}>qualquer lugar</span> do mundo.
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p style={{ fontSize: 19, lineHeight: 1.6, color: COLORS.onBandBody, maxWidth: 620, marginTop: 26 }}>
                  Desde 2020, o Garapuvu ensina lógica de programação, desenvolvimento e
                  testes de software — e, agora, Inteligência Artificial e Data Science
                  aplicados. De Florianópolis a outros estados do Brasil, e até outros países.
                </p>
              </Reveal>

              <Reveal delay={0.18} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 34 }}>
                <button className="gp-btn" onClick={() => openWhatsApp("hero_inscrever")}
                  style={{ background: COLORS.bloom, color: COLORS.onBloom, cursor: "pointer" }}>
                  Quero participar →
                </button>
                <button type="button" className="gp-btn" onClick={() => scrollToSection("encontros", "hero_encontros")}
                  style={{ background: "rgba(255,255,255,.1)", color: COLORS.onBand, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.3)", cursor: "pointer" }}>
                  ▶ Assistir as aulas
                </button>
                <button type="button" className="gp-btn" onClick={() => scrollToSection("conteudo", "hero_conteudo")}
                  style={{ background: "transparent", color: COLORS.onBand, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.3)", cursor: "pointer" }}>
                  Ver o conteúdo
                </button>
              </Reveal>

              <div style={{ height: 70, marginTop: 36, maxWidth: 520 }}>
                <Branch blooms={6} />
              </div>
            </div>

            <HeroVideo />
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="gp-wrap" style={{ marginTop: -34, position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="gp-stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="gp-card"
              style={{ padding: "26px 20px", textAlign: "center" }}>
              <div className="gp-display" style={{ fontSize: "clamp(2rem, 6vw, 2.625rem)", fontWeight: 900, color: COLORS.bloomDeep }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.muted, marginTop: 4 }}>
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="gp-wrap" style={{ paddingTop: 90, paddingBottom: 30 }}>
        <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloomDeep }}>Como funciona</Reveal>
        <Reveal as="h2" delay={0.05} className="gp-display" style={{ fontSize: "clamp(1.9rem, 5.2vw, 2.5rem)", fontWeight: 900, margin: "10px 0 36px" }}>
          Um encontro por semana. O ano inteiro com você.
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 56px" }} className="gp-grid2">
          {HOWITWORKS.map(([k, v], i) => (
            <Reveal key={k} delay={i * 0.05} className="gp-row2"
              style={{ padding: "16px 0", borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ fontWeight: 700, color: COLORS.bloomDeep }}>{k}</span>
              <span style={{ color: COLORS.textSoft }}>{v}</span>
            </Reveal>
          ))}
        </div>
        <Reveal className="gp-card" delay={0.1}
          style={{ marginTop: 28, padding: "18px 22px", background: COLORS.surfaceAlt, borderColor: "transparent", fontSize: 14.5, color: COLORS.muted }}>
          <strong style={{ color: COLORS.text }}>Importante:</strong> participantes a partir de 16 anos são bem-vindos
          mediante autorização dos pais ou responsáveis. Qualquer nacionalidade pode participar.
        </Reveal>
      </section>

      {/* CURRÍCULO — assinatura: módulos como ramos */}
      <section id="conteudo" style={{ background: COLORS.band, color: COLORS.onBand, marginTop: 70, scrollMarginTop: 24 }}>
        <div className="gp-wrap" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloom }}>Planejamento do curso 2026</Reveal>
          <Reveal as="h2" delay={0.05} className="gp-display" style={{ fontSize: "clamp(1.9rem, 5.4vw, 2.625rem)", fontWeight: 900, margin: "10px 0 8px" }}>
            Cinco módulos, do fundamento à <span style={{ color: COLORS.bloom, fontStyle: "italic" }}>Inteligência Artificial</span> e aos dados.
          </Reveal>
          <p style={{ color: COLORS.onBandCaption, marginBottom: 40, maxWidth: 560 }}>
            36 aulas que crescem como os ramos do garapuvu — da raiz dos fundamentos
            até a floração com IA e Data Science.
          </p>

          <div className="gp-modlayout" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 40, alignItems: "start" }}>
            {/* tabs */}
            <div className="gp-modtabs" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MODULES.map((m, i) => {
                const active = i === openModule;
                return (
                  <button key={m.n} className="gp-modtab" onClick={() => { setOpenModule(i); track("modulo_" + m.slug); }}
                    aria-pressed={active}
                    style={{ background: active ? COLORS.bloom : "rgba(255,255,255,.05)", color: active ? COLORS.onBloom : COLORS.onBand, minWidth: 240 }}>
                    <div className="gp-display" style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>Módulo {m.n}</div>
                    <div className="gp-display" style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{m.title}</div>
                  </button>
                );
              })}
            </div>

            {/* lessons */}
            <div className="gp-card" style={{ padding: "30px 32px", background: COLORS.surface, color: COLORS.text }}>
              <p style={{ fontSize: 14, color: COLORS.muted, fontStyle: "italic", margin: "0 0 18px" }}>
                {MODULES[openModule].tag}
              </p>
              <div>
                {MODULES[openModule].lessons.map((l, i) => (
                  <div className="gp-lesson" key={i}>
                    <span className="gp-num">{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: 15.5, lineHeight: 1.4 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENCONTROS GRAVADOS */}
      <EncontrosSection />

      {/* OBJETIVOS */}
      <section className="gp-wrap" style={{ paddingTop: 90, paddingBottom: 30 }}>
        <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloomDeep }}>Objetivos</Reveal>
        <Reveal as="h2" delay={0.05} className="gp-display" style={{ fontSize: "clamp(1.9rem, 5.2vw, 2.5rem)", fontWeight: 900, margin: "10px 0 40px" }}>
          Por que o Garapuvu existe
        </Reveal>
        <div className="gp-grid3">
          {OBJECTIVES.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 0.06} className="gp-card" style={{ padding: "24px 22px" }}>
              <div style={{ width: 28, height: 4, borderRadius: 4, background: COLORS.bloom, marginBottom: 14 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{t}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: COLORS.textSoft, margin: 0 }}>{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MARCOS */}
      <section className="gp-wrap" style={{ paddingTop: 70, paddingBottom: 40 }}>
        <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloomDeep }}>Marcos 2026 – 2027</Reveal>
        <Reveal as="h2" delay={0.05} className="gp-display" style={{ fontSize: "clamp(1.9rem, 5.2vw, 2.5rem)", fontWeight: 900, margin: "10px 0 40px" }}>
          O ano, ramo a ramo
        </Reveal>
        <div className="gp-grid3">
          {MILESTONES.map((m, i) => (
            <Reveal key={m.period} delay={i * 0.08} className="gp-card" style={{ padding: "26px 24px" }}>
              <div className="gp-display" style={{ fontSize: 20, fontWeight: 900, color: COLORS.bloomDeep, marginBottom: 16 }}>
                {m.period}
              </div>
              {m.items.map((it) => (
                <div key={it.t} style={{ display: "flex", gap: 10, padding: "8px 0", fontSize: 14.5, color: COLORS.textSoft }}>
                  <span
                    aria-hidden="true"
                    style={{ color: it.done ? COLORS.leaf : COLORS.bloom, fontWeight: 700 }}
                  >
                    {it.done ? "✓" : "→"}
                  </span>
                  <span>
                    {it.t}
                    {it.done && <span style={{ position: "absolute", left: -9999 }}> (concluído)</span>}
                  </span>
                </div>
              ))}
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gp-wrap" style={{ paddingTop: 50, paddingBottom: 90 }}>
        <Reveal style={{ background: `linear-gradient(120deg, ${COLORS.bloomWarm}, ${COLORS.bloom})`,
          borderRadius: 28, padding: "56px 40px", textAlign: "center", color: COLORS.onBloom, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 10, top: 10, width: 180, height: 90, opacity: 0.85 }}>
            <Branch blooms={5} flip />
          </div>
          <h2 className="gp-display" style={{ fontSize: "clamp(1.8rem, 5vw, 2.375rem)", fontWeight: 900, margin: 0, position: "relative" }}>
            Quer fazer parte do projeto?
          </h2>
          <p style={{ maxWidth: 520, margin: "14px auto 28px", fontSize: 17, fontWeight: 500, position: "relative" }}>
            Conheça o conteúdo das aulas e inscreva-se na próxima turma. Basta um
            e-mail e um computador com internet.
          </p>
          <button className="gp-btn" onClick={() => openWhatsApp("cta_inscrever")}
            style={{ background: COLORS.onBloom, color: COLORS.bloom, position: "relative", cursor: "pointer" }}>
            Saiba mais e participe →
          </button>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ background: COLORS.band, color: COLORS.onBandFooter, textAlign: "center", padding: "34px 24px", fontSize: 14 }}>
        <div className="gp-display" style={{ color: COLORS.onBand, fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          Garapuvu<span style={{ color: COLORS.bloom }}>.</span>
        </div>
        <SocialLinks />
        <br />
        Projeto Social Garapuvu 2026 · Instrutor: Douglas Adriano Queiroz<br />
        Feito para a comunidade de tecnologia — de Florianópolis para o mundo.
      </footer>
    </div>
  );
}
