/**
 * Configuração do Jest — Aula 09 (cobertura enganosa)
 *
 * Repare no `collectCoverageFrom`: por padrão a cobertura olha SÓ para `src/`,
 * ignorando `src/corrigido/`. É assim que `npm run cobertura` consegue mostrar
 * 100% em cima do código bugado.
 *
 * O `coverageThreshold` está em 100 de propósito: é o "portão de qualidade"
 * que muita equipe coloca no CI achando que isso garante software sem defeito.
 * Este projeto passa no portão com 9 arquivos cheios de bugs.
 */
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  verbose: true,
};
