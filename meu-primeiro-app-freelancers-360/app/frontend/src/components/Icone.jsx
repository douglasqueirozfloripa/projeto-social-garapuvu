// Icone.jsx — Ícones da interface em SVG inline.
//
// Desenhos do LUCIDE (https://lucide.dev) — licença ISC, uso livre inclusive
// comercial. Os traços estão copiados aqui em vez de instalar `lucide-react`
// porque são poucos: assim o app não ganha dependência nova (nem peso no build
// da Vercel) e continua funcionando sem rede.
//
// Duas decisões que fazem esses ícones "se comportarem":
//
//  1. stroke="currentColor" → o ícone herda a cor do TEXTO ao redor. No cabeçalho
//     escuro e nas caixinhas verdes ele sai branco sozinho; no item ativo do menu
//     (fundo branco) ele fica verde-escuro. Uma cor fixa branca desapareceria ali.
//  2. aria-hidden="true" + focusable="false" → ícone é decoração: o nome do botão
//     vem do texto ("Projetos"), nunca do desenho. Assim o leitor de tela não
//     anuncia nada a mais, e o Tab não para no SVG (Internet Explorer/edge cases).
//
// Tamanho em px pelo prop `tamanho`; a espessura do traço é a padrão do Lucide (2).

// Cada entrada é só o CONTEÚDO do <svg> do Lucide correspondente.
const TRACOS = {
  // lucide: home
  home: (
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  // lucide: clipboard-list
  "clipboard-list": (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </>
  ),
  // lucide: user
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  // lucide: flag
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </>
  ),
  // lucide: menu
  menu: (
    <>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>
  ),
  // lucide: x
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  // lucide: lightbulb
  lightbulb: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </>
  ),
  // lucide: arrow-right
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
};

export default function Icone({ nome, tamanho = 20, className }) {
  const tracos = TRACOS[nome];
  if (!tracos) return null; // nome desconhecido: não desenha nada (e não quebra a tela)

  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icone={nome}
    >
      {tracos}
    </svg>
  );
}
