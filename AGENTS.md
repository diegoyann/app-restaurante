# Agent Instructions

## Spec Kit Routing

- A message beginning with `/iniciar` or `$iniciar` MUST invoke the local
  `iniciar` skill. Treat all remaining text as the complete development request.
- Treat every request that changes product behavior as a Spec Kit intake; do not
  require the user to invoke `$speckit-*` commands.
- Classify silently and report the result: **bug** = incorrect/regressed current
  behavior; **feature** = new capability or workflow; **direct** = documentation,
  copy, or non-behavioral visual adjustment.
- For a bug, dispatch `$speckit-specify` → `$speckit-plan` → `$speckit-tasks` →
  `$speckit-analyze` → `$speckit-implement`. Add a regression test before the
  correction. Do not stop between stages unless a material product, security,
  or irreversible-data decision is unknown.
- For a feature, dispatch `$speckit-specify` → `$speckit-clarify` when a
  high-impact ambiguity remains → `$speckit-plan` → `$speckit-checklist` →
  `$speckit-tasks` → `$speckit-analyze` → `$speckit-implement` →
  `$speckit-converge`.
- Treat changes involving payments, payroll, attendance, orders, inventory,
  tenants, authentication, or Supabase migrations as critical: always use the
  full feature flow, including integrity, authorization, retry, and recovery
  requirements. Never bypass an unresolved critical gate.
- Follow `.specify/memory/constitution.md`; `specs/<feature>/` is the durable
  business-rule record. Do not overwrite a prior feature specification.

## Package Manager

Use npm with each application directory's lockfile.

## Validation

| Scope | Command |
|---|---|
| Backend tests | `npm test` in `back-end` |
| Frontend tests | `node --test "src/**/*.test.mjs"` in `front-end/app/mock` |
| Frontend lint | `npm run lint` in `front-end/app/mock` |
| Frontend build | `npm run build` in `front-end/app/mock` |

## Commit Attribution

AI commits MUST include:

```text
Co-Authored-By: Codex <noreply@openai.com>
```
