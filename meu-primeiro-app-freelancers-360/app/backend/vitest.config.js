import { defineConfig } from "vitest/config";

// Configuração dos testes e da COBERTURA do backend.
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",              // motor de cobertura
      reporter: ["text", "html"],  // resumo no terminal + relatório visual em coverage/
      include: ["src/**/*.js"],
      exclude: ["src/server.js", "**/*.test.js"],
      // Limites mínimos: se a cobertura cair abaixo, o comando falha (útil no CI).
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
