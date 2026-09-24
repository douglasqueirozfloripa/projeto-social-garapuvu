/**
 * Testes de interface do site do Projeto Garapuvu:
 * acessibilidade (WCAG + árvore de acessibilidade), leitor de tela (NVDA
 * simulado), usabilidade com teclado e layout responsivo.
 *
 * Por padrão os testes rodam contra o BUILD LOCAL do site (a pasta raiz do
 * repositório). O bloco webServer faz o build e sobe o `vite preview` sozinho.
 *
 * Para testar o site publicado:
 *   BASE_URL=https://projeto-garapuvu.web.app npx playwright test
 *   (ou npm run test:producao)
 *
 * Todo teste grava vídeo com a legenda do cenário BDD. Os de leitor de tela
 * também geram um .mp4 com a voz do NVDA simulado (macOS). Veja o README.
 */
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
const SITE_LOCAL = !process.env.BASE_URL;
const TAMANHO = { width: 1280, height: 800 };

module.exports = defineConfig({
  testDir: './testes',
  // Os cenários de leitor de tela esperam cada frase ser falada: são longos de propósito.
  timeout: 5 * 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    viewport: TAMANHO,
    locale: 'pt-BR',
    // Sem animação de entrada nem rolagem suave: resultados estáveis.
    reducedMotion: 'reduce',
    video: { mode: 'on', size: TAMANHO },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium' }],
  webServer: SITE_LOCAL
    ? {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        cwd: '..',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
