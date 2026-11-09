# Implementation Plan: Corrigir Lançamentos Financeiros

**Branch**: `codex/007-corrigir-lancamentos-financeiros` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

## Summary

Eliminar conversões UTC de datas civis em Financeiro > Lançamentos e substituir a exclusão visual por uma mutação persistente via API. O frontend terá funções puras para data local e exclusão reconciliada; o backend validará datas `YYYY-MM-DD` sem horário e tornará a exclusão por ID/tenant idempotente. Não haverá migration nem alteração de outras telas.

## Technical Context

**Language/Version**: JavaScript ESM, React 19, Node.js 24 local

**Primary Dependencies**: React, Vite, Supabase client existente, Node Test Runner

**Storage**: tabela Supabase `transactions`, schema inalterado

**Testing**: testes Node frontend/backend, lint e builds dos dois projetos

**Target Platform**: aplicação web e funções Vercel

**Project Type**: frontend React + API Node

**Performance Goals**: uma chamada DELETE por confirmação, sem polling ou sincronização adicional

**Constraints**: data é calendário local sem horário; exclusão somente após sucesso persistente; tenant e competência continuam validados no servidor

**Scale/Scope**: tela Lançamentos, endpoint/repositório de transações e testes diretamente relacionados

## Constitution Check

- [x] Requisitos, cenários, edge cases e resultados mensuráveis estão definidos.
- [x] Cada bug terá teste de regressão falhando antes da correção.
- [x] Integridade, tenant, idempotência, falha e recuperação estão definidos.
- [x] O frontend usa a API; autorização e persistência permanecem no servidor.
- [x] Testes, lint, builds, rollout e rollback estão declarados.

**Gate result**: PASS.

## Project Structure

```text
front-end/app/mock/src/
├── App.jsx
└── features/finance/
    ├── DailyRevenueForm.jsx
    ├── transactionDateModel.js
    ├── transactionDateModel.test.mjs
    ├── transactionActions.js
    └── transactionActions.test.mjs

back-end/src/modules/finance/
├── repository.js
├── transactionDateModel.js
└── transactionDateModel.test.js

specs/007-corrigir-lancamentos-financeiros/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/transactions.md
├── quickstart.md
├── checklists/
└── tasks.md
```

**Structure Decision**: funções puras pequenas tornam os dois bugs reproduzíveis sem montar toda a aplicação. `App.jsx` apenas orquestra API/estado; o backend continua responsável por tenant, competência e remoção persistente.

## Design Decisions

- `localDateIso(date)` monta `YYYY-MM-DD` com `getFullYear/getMonth/getDate`, nunca `toISOString`.
- `formatDateOnlyBr(value)` formata diretamente as partes do calendário, sem construir instante.
- Datas recebidas no backend devem ser exatamente válidas em `YYYY-MM-DD`; timestamps são rejeitados.
- A ação de exclusão chama `financeApi.deleteTransaction` e só então remove o ID do estado local. Erro preserva o item e alimenta a mensagem existente.
- Repetir DELETE para um ID já ausente converge para sucesso; IDs existentes continuam sujeitos à competência aberta.
- Nenhuma regra de geração automática será alterada: a causa comprovada do retorno do QA/TESTE é a ausência total de chamada DELETE.

## Rollout and Recovery

- Rodar testes de frontend/backend, lint e builds.
- Commit e push exclusivos da feature.
- Deploy de produção do backend e frontend.
- Rollback por reversão do commit; sem compensação de banco, pois não há migration.

## Constitution Re-check After Design

- [x] Testes precedem data local, validação e exclusão.
- [x] Exclusão é persistente, tenant-scoped, idempotente e falha sem estado visual enganoso.
- [x] Datas históricas e schema permanecem inalterados.
- [x] Não há lógica de autorização no cliente.
- [x] Gates cobrem os dois projetos afetados.

**Post-design gate result**: PASS.
