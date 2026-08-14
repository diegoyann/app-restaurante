# Implementation Plan: Separar Pedidos Cancelados

**Branch**: `001-separar-pedidos-cancelados` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Especificação para corrigir a separação operacional entre pedidos ativos e cancelados.

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Separar os pedidos de compra já carregados pelo bootstrap em duas listas derivadas no frontend: Ativos (status diferente de `CANCELLED`) e Histórico (status igual a `CANCELLED`), ambas filtradas pela competência derivada de `orderDate`. A mutação existente já persiste e audita o cancelamento; o refresh de supply chain já relê a fonte persistida. A alteração não cria endpoint, migração ou regra de domínio nova.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript ESM; React 19 no frontend e Node.js ESM no backend

**Primary Dependencies**: React, Vite, ESLint e Node test runner

**Storage**: PostgreSQL via Supabase; a tabela de pedidos já armazena `status`, `order_date`, dados de cancelamento e auditoria

**Testing**: `node --test "src/**/*.test.mjs"`, `npm run lint` e `npm run build` em `front-end/app/mock`

**Target Platform**: Aplicação web em navegadores modernos

**Project Type**: Aplicação web com API Node.js e banco Supabase

**Performance Goals**: Derivar as listas em memória uma vez por mudança de pedidos, aba ou competência, sem requisições adicionais

**Constraints**: Não modificar estoque, financeiro, fornecedores, recebimentos, contrato de API ou esquema do banco; a regra de visibilidade não substitui validação e persistência no servidor

**Scale/Scope**: Um componente de pedidos, um pequeno modelo puro de filtragem e seu teste de regressão

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Requirements include measurable acceptance criteria, edge cases, and
      affected domains.
- [x] Test strategy maps every behavior change to unit, integration, or E2E
      coverage before implementation tasks.
- [x] Financial, HR, order, inventory, tenant, or migration impact is stated;
      where applicable, historical-data safety, idempotency, and recovery are
      designed.
- [x] API changes define validation, authorization, tenant scoping, and error
      contract; frontend changes keep business rules server-side.
- [x] Affected commands and release-quality gates are listed below.

**Gate result**: PASS — o cancelamento continua no domínio/API existentes, com tenant e auditoria preservados. A nova regra é uma projeção de interface com teste de regressão; a confirmação após refresh prova que ela usa o status persistido.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
front-end/app/mock/
└── src/
    └── features/supply-chain/
        ├── purchaseOrderViewModel.js       # nova projeção pura de aba/competência
        ├── purchaseOrderViewModel.test.mjs # regressão do filtro
        └── SupplyChainPages.jsx            # aba, competência e renderização

back-end/
└── src/modules/supply-chain/supplyChainService.js # somente referência: persistência já correta
```

**Structure Decision**: A regra de exibição fica em modelo puro próximo ao componente, para ser testável sem renderizador. O frontend continua a usar os dados já retornados pelo serviço autenticado; nenhuma lógica de cancelamento é movida para o cliente.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
