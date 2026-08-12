/**
 * Configuração do Playwright — testes de INTERFACE (E2E).
 *
 * O bloco webServer sobe a API + frontend automaticamente antes dos testes:
 * você só precisa rodar `npm run test:e2e`.
 *
 * workers: 1 → a API guarda os bugs em memória (estado compartilhado),
 * então os testes rodam em sequência para não interferirem entre si.
 */

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  // A demo tem config própria (headed + slowMo): fica fora da suíte normal
  testIgnore: '**/demo.spec.js',
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node backend/server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI
  },
  reporter: [['list']]
});
