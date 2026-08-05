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

const COLORS = {
  ink: "#0E1F38",        // azul-marinho profundo (do material)
  inkSoft: "#1B3357",
  bloom: "#F2B705",      // amarelo-ouro da floração do garapuvu
  bloomDeep: "#E08A00",  // âmbar
  bark: "#5B4636",       // casca / tronco
  paper: "#FBF7EE",      // papel quente
  paperDim: "#F0E9DA",
  leaf: "#3E6B4F",       // verde folha
  mist: "#92A4BE",
};

const MODULES = [
  {
    n: "01",
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
];

const STATS = [
  { value: "100+", label: "horas de curso" },
  { value: "26", label: "aulas" },
  { value: "6", label: "anos de projeto" },
  { value: "2", label: "países atendidos" },
];

const HOWITWORKS = [
  ["Encontros", "Quartas-feiras, das 19h às 21h"],
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

const MILESTONES = [
  {
    period: "1º Semestre",
    items: ["Abrir novas turmas (5–20 alunos cada)", "Ampliar alcance internacional", "Parcerias com empresas de tecnologia"],
  },
  {
    period: "Meio do ano",
    items: ["Formar 30 pessoas até junho", "Integrar empresas ao projeto", "Consolidar o módulo de IA"],
  },
  {
    period: "2º Semestre",
    items: ["Formar 50 pessoas até dezembro", "Programa de mentoria", "Evento de formatura presencial"],
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
      <path d="M5 70 Q 70 60 110 35 T 195 12" fill="none" stroke={COLORS.bark} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 62 Q 80 50 70 38" fill="none" stroke={COLORS.bark} strokeWidth="2" strokeLinecap="round" />
      <path d="M130 28 Q 150 30 150 16" fill="none" stroke={COLORS.bark} strokeWidth="2" strokeLinecap="round" />
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
            <circle r="2.2" fill={COLORS.bloomDeep} />
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
        color: COLORS.paper,
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
      href: LINKEDIN_URL,
      label: "LinkedIn de Douglas Adriano Queiroz",
      event: "social_linkedin",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9V9z" />
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
            color: COLORS.paper,
            background: "rgba(255,255,255,.07)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.16)",
            transition: "color .2s, background .2s, transform .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ink; e.currentTarget.style.background = COLORS.bloom; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.paper; e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "none"; }}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

export default function GarapuvuLanding() {
  const [openModule, setOpenModule] = useState(0);

  return (
    <div style={{ background: COLORS.paper, color: COLORS.ink, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; overflow-x: hidden; max-width: 100%; }
        img, video { max-width: 100%; height: auto; }
        .gp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .gp-display { font-family: 'Fraunces', Georgia, serif; line-height: 1.02; letter-spacing: -0.02em; }
        .gp-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
        .gp-btn { cursor: pointer; border: none; font-family: inherit; font-weight: 700;
          border-radius: 999px; padding: 15px 30px; font-size: 15px; transition: transform .15s, box-shadow .15s; }
        .gp-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(240,138,0,.35); }
        .gp-btn:focus-visible { outline: 3px solid ${COLORS.ink}; outline-offset: 3px; }
        .gp-lesson { display: grid; grid-template-columns: 34px 1fr; gap: 14px; align-items: start;
          padding: 11px 0; border-bottom: 1px solid ${COLORS.paperDim}; }
        .gp-lesson:last-child { border-bottom: none; }
        .gp-num { font-family: 'Fraunces', serif; font-weight: 600; color: ${COLORS.bloomDeep}; font-size: 15px; padding-top: 1px; }
        .gp-modtab { cursor: pointer; text-align: left; width: 100%; background: none; border: none;
          font-family: inherit; padding: 18px 20px; border-radius: 16px; transition: background .2s, color .2s; }
        .gp-modtab:focus-visible { outline: 3px solid ${COLORS.bloom}; outline-offset: 2px; }
        .gp-card { background: #fff; border: 1px solid ${COLORS.paperDim}; border-radius: 18px; }
        a.gp-link { color: ${COLORS.bloomDeep}; }
        .gp-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .gp-row2 { display: grid; grid-template-columns: 150px 1fr; gap: 16px; }

        /* ── Tablet ── */
        @media (max-width: 920px) {
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
      <header style={{ background: COLORS.ink, color: COLORS.paper, position: "relative", overflow: "hidden" }}>
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
          background: `linear-gradient(90deg, ${COLORS.ink} 0%, rgba(14,31,56,.82) 38%, rgba(14,31,56,.45) 70%, rgba(14,31,56,.2) 100%)` }} />
        <div style={{ position: "absolute", inset: 0,
          background: `linear-gradient(to top, ${COLORS.ink} 0%, transparent 28%)` }} />
        <div className="gp-wrap" style={{ position: "relative", paddingTop: 40, paddingBottom: 64 }}>
          <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 70, gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span className="gp-display" style={{ fontWeight: 900, fontSize: 22 }}>
                Garapuvu<span style={{ color: COLORS.bloom }}>.</span>
              </span>
              <VisitorCount />
            </span>
            <span className="gp-eyebrow" style={{ color: COLORS.mist }}>Turma 2026</span>
          </nav>

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
            <p style={{ fontSize: 19, lineHeight: 1.6, color: "#C9D4E4", maxWidth: 620, marginTop: 26 }}>
              Desde 2020, o Garapuvu ensina lógica de programação, desenvolvimento e
              testes de software — e, agora, Inteligência Artificial aplicada. De
              Florianópolis a outros estados do Brasil, e até outros países.
            </p>
          </Reveal>

          <Reveal delay={0.18} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 34 }}>
            <button className="gp-btn" onClick={() => openWhatsApp("hero_inscrever")}
              style={{ background: COLORS.bloom, color: COLORS.ink, cursor: "pointer" }}>
              Quero participar →
            </button>
            <button className="gp-btn" onClick={() => scrollToSection("conteudo", "hero_conteudo")}
              style={{ background: "transparent", color: COLORS.paper, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.3)", cursor: "pointer" }}>
              Ver o conteúdo
            </button>
          </Reveal>

          <div style={{ height: 70, marginTop: 36, maxWidth: 520 }}>
            <Branch blooms={6} />
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
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.bark, marginTop: 4 }}>
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
              style={{ padding: "16px 0", borderTop: `1px solid ${COLORS.paperDim}` }}>
              <span style={{ fontWeight: 700, color: COLORS.bloomDeep }}>{k}</span>
              <span style={{ color: COLORS.inkSoft }}>{v}</span>
            </Reveal>
          ))}
        </div>
        <Reveal className="gp-card" delay={0.1}
          style={{ marginTop: 28, padding: "18px 22px", background: COLORS.paperDim, borderColor: "transparent", fontSize: 14.5, color: COLORS.bark }}>
          <strong style={{ color: COLORS.ink }}>Importante:</strong> participantes a partir de 16 anos são bem-vindos
          mediante autorização dos pais ou responsáveis. Qualquer nacionalidade pode participar.
        </Reveal>
      </section>

      {/* CURRÍCULO — assinatura: módulos como ramos */}
      <section id="conteudo" style={{ background: COLORS.ink, color: COLORS.paper, marginTop: 70, scrollMarginTop: 24 }}>
        <div className="gp-wrap" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloom }}>Planejamento do curso 2026</Reveal>
          <Reveal as="h2" delay={0.05} className="gp-display" style={{ fontSize: "clamp(1.9rem, 5.4vw, 2.625rem)", fontWeight: 900, margin: "10px 0 8px" }}>
            Três módulos, do fundamento à <span style={{ color: COLORS.bloom, fontStyle: "italic" }}>Inteligência Artificial</span>.
          </Reveal>
          <p style={{ color: "#9FB0C6", marginBottom: 40, maxWidth: 560 }}>
            26 aulas que crescem como os ramos do garapuvu — da raiz dos fundamentos até a floração com IA.
          </p>

          <div className="gp-modlayout" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 40, alignItems: "start" }}>
            {/* tabs */}
            <div className="gp-modtabs" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MODULES.map((m, i) => {
                const active = i === openModule;
                return (
                  <button key={m.n} className="gp-modtab" onClick={() => { setOpenModule(i); track("modulo_" + m.n); }}
                    aria-pressed={active}
                    style={{ background: active ? COLORS.bloom : "rgba(255,255,255,.05)", color: active ? COLORS.ink : COLORS.paper, minWidth: 240 }}>
                    <div className="gp-display" style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>Módulo {m.n}</div>
                    <div className="gp-display" style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{m.title}</div>
                  </button>
                );
              })}
            </div>

            {/* lessons */}
            <div className="gp-card" style={{ padding: "30px 32px", background: "#fff", color: COLORS.ink }}>
              <p style={{ fontSize: 14, color: COLORS.bark, fontStyle: "italic", margin: "0 0 18px" }}>
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
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: 0 }}>{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MARCOS */}
      <section className="gp-wrap" style={{ paddingTop: 70, paddingBottom: 40 }}>
        <Reveal as="p" className="gp-eyebrow" style={{ color: COLORS.bloomDeep }}>Marcos 2026</Reveal>
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
                <div key={it} style={{ display: "flex", gap: 10, padding: "8px 0", fontSize: 14.5, color: COLORS.inkSoft }}>
                  <span style={{ color: COLORS.bloom, fontWeight: 700 }}>→</span>
                  <span>{it}</span>
                </div>
              ))}
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gp-wrap" style={{ paddingTop: 50, paddingBottom: 90 }}>
        <Reveal style={{ background: `linear-gradient(120deg, ${COLORS.bloomDeep}, ${COLORS.bloom})`,
          borderRadius: 28, padding: "56px 40px", textAlign: "center", color: COLORS.ink, position: "relative", overflow: "hidden" }}>
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
            style={{ background: COLORS.ink, color: COLORS.bloom, position: "relative", cursor: "pointer" }}>
            Saiba mais e participe →
          </button>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ background: COLORS.ink, color: "#8DA0BA", textAlign: "center", padding: "34px 24px", fontSize: 14 }}>
        <div className="gp-display" style={{ color: COLORS.paper, fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
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
