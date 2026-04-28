# Database Backup & Restore

PostgreSQL runs in Docker managed by Coolify. The pg17 container: `do084soc48c4wcgsoog08kg8`.

## Restore from .dmp file

```bash
# Copy dump into container
sudo docker cp /path/to/file.dmp do084soc48c4wcgsoog08kg8:/tmp/restore.dmp

# Restore (--clean drops existing objects first)
sudo docker exec do084soc48c4wcgsoog08kg8 pg_restore -U postgres -d hazelgrouse-db --no-owner --clean --if-exists /tmp/restore.dmp
```

## Create a backup

```bash
# Dump inside container
sudo docker exec do084soc48c4wcgsoog08kg8 pg_dump -U postgres -d hazelgrouse-db -Fc -f /tmp/backup.dmp

# Copy out
sudo docker cp do084soc48c4wcgsoog08kg8:/tmp/backup.dmp ./backup-$(date +%Y%m%d).dmp
```

## Notes
- `.dmp` format version 1.16 = pg17 — only pg17 client can restore it (don't use pg16 client)
- `--no-owner` / `--no-privileges` — skip ownership/GRANT to avoid permission errors
- After restore, re-run `db:seed` only if template data was wiped
