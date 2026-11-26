#!/usr/bin/env bash
# Sobe um Postgres temporário, aplica a migração e roda os testes de segurança.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d)
chown postgres "$DIR" 2>/dev/null || true
run() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
run "$PGBIN/initdb -D $DIR/data -U postgres >/dev/null"
run "$PGBIN/pg_ctl -D $DIR/data -o '-p 54329 -k $DIR' -l $DIR/log start >/dev/null"
trap 'run "$PGBIN/pg_ctl -D $DIR/data stop -m fast >/dev/null"; rm -rf "$DIR"' EXIT
sleep 1
P="psql -h $DIR -p 54329 -U postgres -q -v ON_ERROR_STOP=1"
run "$P -f tests/mock_supabase.sql"
run "$P -f supabase/migrations/0001_inicial.sql"
run "$P -f supabase/migrations/0001_inicial.sql"   # rodar duas vezes não pode quebrar
run "$P -f supabase/migrations/0002_permissoes.sql"
run "$P -f supabase/migrations/0003_cadastro_simples.sql"
run "$P -f supabase/migrations/0003_cadastro_simples.sql"
run "$P -f tests/test_regras.sql"
