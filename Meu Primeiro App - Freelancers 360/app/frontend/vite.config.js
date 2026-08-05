import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

// Configuração do Vite (frontend) + Vitest (testes de componente com jsdom).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.js"],
    // e2e/ roda no Playwright (npm run e2e), não no Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // Relatórios: "default" imprime no terminal; "html" gera o arquivo estático em
    // html/index.html (abra com `npm run test:report`). O JUnit é o formato que
    // ferramentas de CI (GitHub Actions, Jenkins) sabem ler.
    reporters: ["default", "html", "junit"],
    outputFile: {
      html: "./relatorios/vitest/index.html",
      junit: "./relatorios/vitest/junit.xml",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./relatorios/cobertura",
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/main.jsx", "**/*.test.{js,jsx}", "src/setupTests.js"],
      thresholds: { lines: 60, functions: 60, branches: 60, statements: 60 },
    },
  },
});
