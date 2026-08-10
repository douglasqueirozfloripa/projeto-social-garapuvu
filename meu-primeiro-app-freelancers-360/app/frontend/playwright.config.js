import { defineConfig } from "@playwright/test";

// Configuração do Playwright: aponta para o frontend em desenvolvimento.
// SLOWMO (ms) desacelera as interações para dar pra acompanhar na tela (modo headed).
const SLOWMO = Number(process.env.SLOWMO || 0);

export default defineConfig({
  testDir: "./e2e",
  // O backend guarda os dados EM MEMÓRIA (store único e compartilhado). Rodar os
  // testes em paralelo faria um teste enxergar/colidir com os dados do outro
  // (ex.: dois projetos com o mesmo título, e-mail duplicado). Por isso: serial.
  fullyParallel: false,
  workers: 1,
  // Com SLOWMO ligado (ex.: npm run e2e:smoke), cada ação espera ~900ms; os smoke tests
  // com 3 atores + vários reloads passam de 2 min. Damos folga (5 min); o resto segue em 30s.
  timeout: SLOWMO > 0 ? 300_000 : 30_000,
  // Relatórios: "list" mostra o passo a passo no terminal; "html" gera o relatório
  // navegável em relatorios/playwright/ (abra com `npm run e2e:report`).
  // open: "never" evita que o navegador abra sozinho ao fim de cada execução.
  reporter: [
    ["list"],
    ["html", { outputFolder: "relatorios/playwright", open: "never" }],
    ["junit", { outputFile: "relatorios/playwright/junit.xml" }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    launchOptions: { slowMo: SLOWMO },
    // Anexa evidências ao relatório HTML quando o teste falha: print da tela,
    // vídeo da execução e trace (linha do tempo com DOM, rede e console).
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  // Sobe (e aguarda) backend :3001 e frontend :5173 automaticamente antes dos testes.
  // reuseExistingServer: se já estiverem no ar, reaproveita em vez de subir de novo.
  webServer: [
    {
      command: "npm start",
      cwd: "../backend",
      url: "http://localhost:3001/contratos",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
