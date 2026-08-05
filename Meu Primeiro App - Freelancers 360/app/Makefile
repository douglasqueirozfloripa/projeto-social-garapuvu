# Makefile — FreelaAvalia 360
# Sobe backend (Express, porta 3001) e frontend (React + Vite, porta 5173) em localhost.
#
# Uso:
#   make install   -> instala dependências do backend e do frontend
#   make dev       -> sobe backend + frontend juntos (Ctrl+C encerra os dois)
#   make backend   -> sobe só o backend  (http://localhost:3001)
#   make frontend  -> sobe só o frontend (http://localhost:5173)
#   make test      -> roda os testes unitários/integração dos dois (vitest)
#   make test-e2e  -> roda os testes E2E do Playwright (browser)
#   make test-all  -> roda tudo (vitest + Playwright)
#   make coverage  -> gera os relatórios de cobertura (backend/ e frontend/coverage/)
#   make stop      -> mata processos nas portas 3001 e 5173-5175 (fallback do Vite)

BACKEND_DIR  := backend
FRONTEND_DIR := frontend
BACKEND_PORT := 3001
FRONTEND_PORT := 5173
# Portas de fallback do Vite (quando 5173 está ocupada, ele tenta 5174, 5175...).
FRONTEND_PORTS := 5173 5174 5175
PORTS := $(BACKEND_PORT) $(FRONTEND_PORTS)

.PHONY: help install install-backend install-frontend dev backend frontend test test-e2e test-all coverage stop

help:
	@echo "Alvos disponíveis:"
	@echo "  make install   - instala dependências (backend + frontend)"
	@echo "  make dev       - sobe backend + frontend em localhost"
	@echo "  make backend   - sobe só o backend  (http://localhost:$(BACKEND_PORT))"
	@echo "  make frontend  - sobe só o frontend (http://localhost:$(FRONTEND_PORT))"
	@echo "  make test      - roda os testes unitários/integração (vitest)"
	@echo "  make test-e2e  - roda os testes E2E do Playwright (browser)"
	@echo "  make test-all  - roda tudo (vitest + Playwright)"
	@echo "  make coverage  - gera os relatórios de cobertura (coverage/index.html)"
	@echo "  make stop      - encerra processos nas portas $(PORTS)"

install: install-backend install-frontend

install-backend:
	@echo "==> Instalando dependências do backend..."
	cd $(BACKEND_DIR) && npm install

install-frontend:
	@echo "==> Instalando dependências do frontend..."
	cd $(FRONTEND_DIR) && npm install

# Sobe os dois em paralelo. O 'trap' garante que Ctrl+C encerre ambos.
# Libera as portas antes (stop) para não bater em EADDRINUSE de execuções anteriores.
dev: install stop
	@echo "==> Backend:  http://localhost:$(BACKEND_PORT)"
	@echo "==> Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "==> (Ctrl+C encerra os dois)"
	@trap 'kill 0' INT TERM EXIT; \
	( cd $(BACKEND_DIR) && npm start ) & \
	( cd $(FRONTEND_DIR) && npm run dev ) & \
	wait

backend: install-backend stop
	@echo "==> Backend em http://localhost:$(BACKEND_PORT)"
	cd $(BACKEND_DIR) && npm start

frontend: install-frontend stop
	@echo "==> Frontend em http://localhost:$(FRONTEND_PORT)"
	cd $(FRONTEND_DIR) && npm run dev

test:
	cd $(BACKEND_DIR) && npm test
	cd $(FRONTEND_DIR) && npm test

test-e2e:
	cd $(FRONTEND_DIR) && npm run e2e

test-all: test test-e2e

# Gera os relatórios de cobertura. Abra backend/coverage/index.html e
# frontend/coverage/index.html no navegador para ver linha a linha.
coverage:
	cd $(BACKEND_DIR) && npm run coverage
	cd $(FRONTEND_DIR) && npm run coverage
	@echo "==> Relatórios: $(BACKEND_DIR)/coverage/index.html e $(FRONTEND_DIR)/coverage/index.html"

stop:
	@echo "==> Encerrando processos nas portas $(PORTS)..."
	@for p in $(PORTS); do \
		pids=$$(lsof -ti tcp:$$p 2>/dev/null); \
		if [ -n "$$pids" ]; then echo "    porta $$p -> matando $$pids"; kill -9 $$pids 2>/dev/null || true; fi; \
	done
	@echo "==> Pronto."
