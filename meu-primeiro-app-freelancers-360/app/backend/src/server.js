// server.js — Sobe a API numa porta. Separado de app.js para os testes
// poderem usar a app sem abrir porta de rede.
import { criarApp } from "./app.js";
import { semearUsuarios } from "./repositorio.js";

const PORT = process.env.PORT || 3001;

// Como os dados ficam em memória, semeamos usuários padrão a cada inicialização
// para sempre haver contas prontas (login "1234") mesmo após reiniciar o servidor.
const seed = semearUsuarios();

criarApp().listen(PORT, () => {
  console.log(`FreelaAvalia 360 — API rodando em http://localhost:${PORT}`);
  console.log("Usuários padrão (senha 1234):");
  for (const u of seed) console.log(`  • ${u.papel.padEnd(11)} ${u.email}  (#${u.id})`);
});
