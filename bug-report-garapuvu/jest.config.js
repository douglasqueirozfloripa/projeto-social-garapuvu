/**
 * Configuração do Jest — testes unitários e de API.
 * Os testes E2E ficam de fora (são do Playwright).
 */
module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  verbose: true,

  // ---------- Cobertura ----------
  // O relatório fica dentro de tests/, junto das camadas que o geraram.
  coverageDirectory: 'tests/coverage',

  collectCoverageFrom: [
    'backend/**/*.js',
    'frontend/js/**/*.js',
    // app.js só roda no navegador (é medido pelos testes E2E, não pelo Jest)
    '!frontend/js/app.js',
    '!**/node_modules/**'
  ],

  // 'lcovonly' em vez de 'lcov': o 'lcov' geraria um segundo HTML duplicado
  coverageReporters: ['text', 'text-summary', 'html', 'lcovonly'],

  coveragePathIgnorePatterns: ['/node_modules/', '/tests/']
};
