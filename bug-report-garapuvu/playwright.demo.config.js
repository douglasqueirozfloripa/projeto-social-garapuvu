/**
 * Configuração do Playwright para a DEMO apresentada em aula.
 *
 * Diferença da config normal: navegador visível (headed), cada ação com
 * 1,5 s de pausa (slowMo) e viewport grande, para dar tempo de acompanhar
 * o que está acontecendo na tela enquanto o teste roda.
 *
 * Rodar:  make demo   (ou npm run test:demo)
 */

const { defineConfig } = require('@playwright/test');

const PAUSA_MS = Number(process.env.DEMO_SLOWMO || 1500);
// DEMO_HEADLESS=1 roda sem abrir janela — serve para conferir se a demo
// continua passando (em CI, por exemplo) sem precisar assistir a ela.
const SEM_JANELA = process.env.DEMO_HEADLESS === '1';

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/demo.spec.js',
  workers: 1,
  // A demo é longa de propósito: cada ação espera 1,5 s
  timeout: 15 * 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: SEM_JANELA,
    viewport: { width: 1440, height: 900 },
    launchOptions: { slowMo: PAUSA_MS },
    video: 'off',
    screenshot: 'off'
  },
  webServer: {
    command: 'node backend/server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI
  },
  reporter: [['list']]
});
