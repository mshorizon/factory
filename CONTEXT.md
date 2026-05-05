# CONTEXT.md — Live Project State Bridge

2026-04-24
> Use this file to sync context between Claude Code sessions
> and claude.ai planning sessions.

---

## 1. PROJECT SNAPSHOT

**Phase:** Template expansion + go-to-market prep
**Branch:** develop → main (auto-deploy on merge)
**Active templates:** 4
**Businesses in DB:** unknown (check DB)
2026-04-24

Templates:
- `template-specialist` — electrician/plumber/barber niche
- `template-law` — law firm (multilingual: pl/en/de/ua)
- `template-tech` — web agency / tech (dark theme)
- `template-art` — creative / art (demo: Christina Vale)

---

## 2. RECENT TASKS (last 10)

| Date | Task | Status | Outcome |
|------|------|--------|---------|
| 2026-04-24 | template-tech: set dark theme mode | done | majorTheme=template-tech, mode=dark |
| 2026-04-23 | rename majorTheme to template-* prefix | done | all templates updated |
| 2026-04-23 | mark komornik tasks done | done | permission + testimonial |
| 2026-04-23 | add release script + develop branch | done | scripts/claude-session.sh etc |
| 2026-04-23 | add go-to-market plan for 10 clients | done | docs added |
| 2026-04-23 | rename/clean up template directories | done | template-* naming scheme |
| 2026-04-22 | portfolio-law: overhaul blog + services | done | demo placeholder data |
| 2026-04-22 | add copy-blogs script (DB migration) | done | packages/db |
| 2026-04-22 | unify services title reveal animation | done | card stagger in ui |
| 2026-04-22 | portfolio-law: jurisdiction section | done | mobile fixes + contact badge |

---

## 3. ACTIVE BLOCKERS

none

---

## 4. KNOWN ISSUES

- Template JSON `business.name` uses translation key `t:business.name`
  instead of a real name — expected for i18n but domain is also missing,
  which means DB entries need a real domain set at seed time.

---

## 5. NEXT UP

unknown — no pending task queue found at time of writing.
Add tasks here as they are accepted.

---

## 6. RECENT ARCHITECTURAL DECISIONS
Last 3 decisions — full history in `docs/adr/`.

| ADR | Title | Status |
|-----|-------|--------|
| 0013 | Major Theme + Section Variant Layered Resolution System | accepted |
| 0010 | Dual-Token JWT Authentication (Access + Refresh) | accepted |
| 0008 | In-Memory TTL Store for Admin Preview Drafts | accepted |

---

## 7. METRICS

- Templates built: 4
- Businesses configured in DB: unknown
- Open questions awaiting answer: 0
- Days since last deployment: 0
- Open strategic suggestions: 39
