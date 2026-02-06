#!/usr/bin/env bash
set -euo pipefail

# Simple PostgreSQL backup script with rotation.
# Usage: set env vars then run: ./backup-db.sh

: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"
: "${DB_NAME:=contract_guardian}"
: "${DB_USER:=postgres}"
: "${DB_PASSWORD:=}"

: "${BACKUP_DIR:=/var/backups/ai-contract-guardian}"
: "${BACKUP_RETENTION_DAYS:=7}"
: "${BACKUP_PREFIX:=acg_db}"

mkdir -p "${BACKUP_DIR}"

timestamp=$(date +"%Y%m%d_%H%M%S")
backup_file="${BACKUP_DIR}/${BACKUP_PREFIX}_${DB_NAME}_${timestamp}.sql.gz"

if [[ -n "${DB_PASSWORD}" ]]; then
  export PGPASSWORD="${DB_PASSWORD}"
fi

pg_dump \
  --host "${DB_HOST}" \
  --port "${DB_PORT}" \
  --username "${DB_USER}" \
  --dbname "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  | gzip -9 > "${backup_file}"

unset PGPASSWORD

find "${BACKUP_DIR}" \
  -type f \
  -name "${BACKUP_PREFIX}_${DB_NAME}_*.sql.gz" \
  -mtime "+${BACKUP_RETENTION_DAYS}" \
  -print -delete

echo "Backup saved to ${backup_file}"
