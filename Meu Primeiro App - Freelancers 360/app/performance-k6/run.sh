#!/usr/bin/env bash
#
# Roda o k6 já com o .env carregado.
#
# POR QUE ESTE SCRIPT EXISTE
#   O k6 não lê arquivos .env. Ele não tem flag `--env-file`; o que ele faz é
#   herdar as variáveis que JÁ estão no ambiente do shell (comportamento do
#   `--include-system-env-vars`, ligado por padrão). Resultado: rodar
#   `k6 run smoke.js` com um `.env` contendo TEMA=joaquina ignora esse arquivo
#   e o relatório sai no tema padrão (garapuvu). Este wrapper coloca o .env no
#   ambiente antes de chamar o k6.
#
# USO
#   ./run.sh smoke.js
#   ./run.sh gate-exigente.js
#   TEMA=oceano ./run.sh load.js      # o que você passa na linha VENCE o .env
#   ./run.sh -e TEMA=uva load.js      # flags do k6 passam direto
#
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  while IFS='=' read -r chave valor; do
    # ignora comentários e linhas em branco: o que não for nome de variável sai
    [[ "$chave" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    # não sobrescreve o que já veio do seu comando — assim `TEMA=x ./run.sh`
    # continua mandando mais que o arquivo
    [ -n "${!chave-}" ] && continue
    export "$chave=$valor"
  done < .env
fi

echo "→ k6 run $* (TEMA=${TEMA:-garapuvu} · BASE_URL=${BASE_URL:-http://localhost:3001})"
exec k6 run "$@"
