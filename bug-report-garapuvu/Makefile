.PHONY: dev test coverage demo install help clean test-unit test-api test-e2e

# Cores para output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
# NC = No Color
NC := \033[0m

help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║        Bug Report Garapuvu - Makefile Commands             ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)make dev$(NC)        - Instala deps e sobe backend + frontend"
	@echo "$(GREEN)make test$(NC)       - Roda todos os testes (unit, API, E2E) com reports"
	@echo "$(GREEN)make coverage$(NC)   - Roda todos os testes e gera o report em tests/coverage/"
	@echo "$(GREEN)make demo$(NC)       - Demo apresentada: navegador visível, 1,5s por ação"
	@echo "$(GREEN)make install$(NC)    - Apenas instala as dependências"
	@echo "$(GREEN)make test-unit$(NC)  - Roda apenas testes unitários"
	@echo "$(GREEN)make test-api$(NC)   - Roda apenas testes de API"
	@echo "$(GREEN)make test-e2e$(NC)   - Roda apenas testes E2E (Playwright)"
	@echo "$(GREEN)make clean$(NC)      - Remove node_modules e caches"
	@echo ""

# Instala as dependências
install:
	@echo "$(YELLOW)➤ Instalando dependências...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependências instaladas com sucesso!$(NC)"

# Comando principal: dev
# Instala e sobe backend + frontend
dev: install
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  Iniciando Bug Report Garapuvu (Backend + Frontend)        ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)➤ Servidor rodando em: http://localhost:3000$(NC)"
	@echo "$(YELLOW)➤ Pressione Ctrl+C para parar$(NC)"
	@echo ""
	npm start

# Comando principal: test
# Roda todos os testes com coverage e gera reports
test:
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  Executando Testes - Unit + API + E2E                      ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)➤ Rodando testes unitários...$(NC)"
	npm run test:unit
	@echo ""
	@echo "$(YELLOW)➤ Rodando testes de API...$(NC)"
	npm run test:api
	@echo ""
	@echo "$(YELLOW)➤ Rodando testes E2E (Playwright)...$(NC)"
	npm run test:e2e
	@echo ""
	@echo "$(GREEN)✓ Todos os testes executados com sucesso!$(NC)"
	@echo "$(YELLOW)  Para o relatório de cobertura: make coverage$(NC)"
	@echo ""

# Roda todos os testes e gera o relatório de cobertura em tests/coverage/
# Obs.: a cobertura é medida pelo Jest (unit + API). Os testes E2E rodam
# no navegador, então validam o comportamento mas não entram no percentual.
coverage:
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  Cobertura de Testes - Unit + API (Jest) + E2E             ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)➤ Rodando unit + API com cobertura...$(NC)"
	npx jest tests/unit tests/api --coverage
	@echo ""
	@echo "$(YELLOW)➤ Rodando testes E2E (Playwright)...$(NC)"
	npm run test:e2e
	@echo ""
	@echo "$(GREEN)✓ Cobertura gerada!$(NC)"
	@echo ""
	@echo "$(GREEN)Relatórios:$(NC)"
	@echo "  • HTML  : tests/coverage/index.html"
	@echo "  • LCOV  : tests/coverage/lcov.info"
	@echo ""
	@echo "$(YELLOW)Abrir no navegador:$(NC) open tests/coverage/index.html"
	@echo ""

# Demo apresentada em aula: navegador visível, 1,5s entre cada ação.
# É um teste de interface de verdade (Playwright, com expect em cada passo),
# só que em ritmo de apresentação: tarja narrando na tela e rolagem suave
# até o elemento de cada passo, com destaque amarelo.
#
# Variáveis de ritmo:
#   make demo DEMO_SLOWMO=2500    - pausa entre as ações (padrão 1500ms)
#   make demo DEMO_LEITURA=1500   - tempo de leitura da tarja (padrão 900ms)
#   make demo DEMO_ROLAGEM=1000   - espera da rolagem suave (padrão 700ms)
#   make demo DEMO_HEADLESS=1     - só conferir se passa, sem abrir janela
demo:
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  DEMO - Bug Report Garapuvu (Playwright, navegador visível) ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)➤ Ritmo: $(or $(DEMO_SLOWMO),1500)ms por ação · não mexa no mouse durante a demo$(NC)"
	@echo ""
	DEMO_SLOWMO=$(or $(DEMO_SLOWMO),1500) \
	DEMO_LEITURA=$(or $(DEMO_LEITURA),900) \
	DEMO_ROLAGEM=$(or $(DEMO_ROLAGEM),700) \
	DEMO_HEADLESS=$(DEMO_HEADLESS) \
	npm run test:demo
	@echo ""
	@echo "$(GREEN)✓ Demo finalizada — todos os passos validados com expect().$(NC)"
	@echo ""

# Testes individuais (atalhos)
test-unit:
	@echo "$(YELLOW)➤ Rodando testes unitários...$(NC)"
	npm run test:unit

test-api:
	@echo "$(YELLOW)➤ Rodando testes de API...$(NC)"
	npm run test:api

test-e2e:
	@echo "$(YELLOW)➤ Rodando testes E2E (Playwright)...$(NC)"
	npm run test:e2e

# Limpa cache e node_modules
clean:
	@echo "$(YELLOW)➤ Limpando arquivos de cache...$(NC)"
	rm -rf node_modules
	rm -rf tests/coverage
	rm -rf test-results
	rm -rf playwright-report
	rm -rf .jest-cache
	@echo "$(GREEN)✓ Cache limpo!$(NC)"
