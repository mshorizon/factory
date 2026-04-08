# VPS Cleanup Runbook

Szybki przewodnik do diagnostyki i zwalniania miejsca na Hetzner VPS.

---

## 1. Diagnostyka — co zajmuje miejsce

```bash
# Stan dysku
df -h /

# Top-level
du -sh /* 2>/dev/null | sort -rh | head -15

# Ukryte foldery w /home/dev
du -sh /home/dev/.[^.]* 2>/dev/null | sort -rh | head -15

# Docker
sudo docker system df
```

---

## 2. Znane pożeracze miejsca

| Lokalizacja | Typowy rozmiar | Akcja |
|-------------|----------------|-------|
| `/home/dev/.npm` | ~1.5G | `npm cache clean --force` |
| `/home/dev/.cache/ms-playwright` | ~1.8G | patrz sekcja Playwright |
| `/home/dev/.local/share/pnpm` | ~1G | `pnpm store prune` |
| `/home/dev/.cache/pip` | ~50M+ | `pip cache purge` |
| Docker images | ~9G (57% reclaimable) | patrz sekcja Docker |
| PM2 logi | nieograniczone | `pm2 flush` |

---

## 3. Komendy czyszczące

### Cache paczek
```bash
npm cache clean --force
pnpm store prune
pip cache purge 2>/dev/null || true
```

### PM2 logi
```bash
pm2 flush
```

### Playwright — stare profile Chrome
```bash
# Sprawdź daty ostatniego użycia
du -sh /home/dev/.cache/ms-playwright/* | sort -rh

# Usuń stare mcp-chrome (zostaw najświeższy wg daty)
# Aktywny profil ma najnowszy timestamp w 'Local State'
ls -lt /home/dev/.cache/ms-playwright/ | head -10

# Usuń webkit jeśli nie potrzebny (MCP używa chromium)
rm -rf /home/dev/.cache/ms-playwright/webkit-*

# Usuń stare mcp-chrome profile (dostosuj hashe)
# rm -rf /home/dev/.cache/ms-playwright/mcp-chrome-STARY1
# rm -rf /home/dev/.cache/ms-playwright/mcp-chrome-STARY2
```

> **Uwaga:** `mcp-chrome-XXXXX` to profile Chrome tworzone przez Playwright MCP przy każdej nowej sesji. Nowe pojawią się automatycznie. Bezpieczne do usunięcia wszystkich — przy następnym użyciu MCP zostanie stworzony nowy.

### Docker
```bash
# Podgląd co można odzyskać
sudo docker system df

# Usuń obrazy nieużywane przez aktywne kontenery (BEZPIECZNE)
sudo docker image prune -a

# Agresywne czyszczenie (kontenery, sieci, volumes — OSTROŻNIE z Coolify)
# sudo docker system prune -a --volumes
```

> **Uwaga Coolify:** `docker image prune -a` jest bezpieczne — nie tyka obrazów aktywnych kontenerów. `--volumes` może usunąć dane Coolify — NIE używaj bez weryfikacji.

---

## 4. Szybkie sprawdzenie po czyszczeniu

```bash
df -h /
```

Cel: poniżej 80% użycia.

---

## 5. Wyniki z poprzedniego czyszczenia (2026-04-08)

Punkt wyjścia: **97% (1.1G wolne)**  
Po czyszczeniu: **89% (4.5G wolne)**

| Akcja | Odzyskano |
|-------|-----------|
| `npm cache clean` | ~1.05G |
| `pnpm store prune` | ~0.14G |
| webkit playwright | ~0.28G |
| `docker image prune -a` | ~1.05G |
| stare mcp-chrome (3x) | ~0.30G |
| **Razem** | **~2.8G** |
