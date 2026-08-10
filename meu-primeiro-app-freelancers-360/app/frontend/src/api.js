// api.js — Conversa com a API do backend, com tratamento amigável de erros.
//
// Onde está a API? Depende de onde o app está rodando:
//   • desenvolvimento (npm run dev)  → http://localhost:3001 (backend local)
//   • produção (build/Vercel)        → /api, no MESMO domínio do site (a API
//     sobe como função serverless, então não há host separado nem CORS)
//   • VITE_API_URL, se definida, vence os dois (útil para apontar para uma API
//     publicada em outro lugar; ver frontend/.env.example)
const BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3001");

// Faz a requisição e traduz falhas em mensagens compreensíveis para o usuário.
async function pedir(caminho, opcoes) {
  let res;
  try {
    res = await fetch(BASE + caminho, opcoes);
  } catch {
    // Erro de rede (servidor fora do ar, CORS, sem internet): mensagem clara.
    throw new Error(`Não foi possível conectar ao servidor. A API está respondendo em ${BASE}? (em desenvolvimento, rode 'npm start' na pasta backend)`);
  }
  const dado = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(dado.erro || `Erro ${res.status} ao acessar ${caminho}`);
  return dado;
}

const jsonPost = (body) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  cadastrar: (u) => pedir("/usuarios", jsonPost(u)),
  login: (c) => pedir("/login", jsonPost(c)),
  logout: (id) => pedir("/logout", jsonPost({ id })),
  buscarUsuario: (id) => pedir(`/usuarios/${id}`),
  atualizarUsuario: (id, campos) => pedir(`/usuarios/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(campos) }),
  listarContratos: () => pedir("/contratos"),
  criarContrato: (c) => pedir("/contratos", jsonPost(c)),
  atualizarContrato: (id, campos) => pedir(`/contratos/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(campos) }),
  removerContrato: (id) => pedir(`/contratos/${id}`, { method: "DELETE" }),
  candidatar: (id, freelancerId) => pedir(`/contratos/${id}/candidaturas`, jsonPost({ freelancerId })),
  listarCandidatos: (id) => pedir(`/contratos/${id}/candidaturas`),
  removerCandidatura: (id, freelancerId) => pedir(`/contratos/${id}/candidaturas/${freelancerId}`, { method: "DELETE" }),
  selecionarFreelancer: (id, freelancerId) => pedir(`/contratos/${id}/selecionar`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ freelancerId }) }),
  iniciarAndamento: (id) => pedir(`/contratos/${id}/andamento`, { method: "PATCH" }),
  concluirContrato: (id) => pedir(`/contratos/${id}/concluir`, { method: "PATCH" }),
  avaliar: (a) => pedir("/avaliacoes", jsonPost(a)),

  // ---- Feature flags ----
  listarFlags: () => pedir("/flags"),
  definirFlag: (nome, ativa) => pedir(`/flags/${nome}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ativa }) }),
  loginGoogle: (email) => pedir("/login/google", jsonPost({ email })),
  destacarContrato: (id) => pedir(`/contratos/${id}/destacar`, { method: "PATCH" }),
  listarNotificacoes: (usuarioId) => pedir(`/notificacoes/${usuarioId}`),
};
