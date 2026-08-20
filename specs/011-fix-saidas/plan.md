# Implementation Plan: Restaurar Lançamento de Saídas

**Branch**: `codex/011-fix-saidas` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-fix-saidas/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Garantir que o contrato financeiro de bootstrap sempre forneça categorias selecionáveis quando o tenant não possui cadastro próprio. A projeção continuará consultando a tabela normalmente, propagará erros reais e aplicará um fallback puro, determinístico e somente em memória quando a consulta válida retornar lista vazia. Categorias próprias terão precedência total. Não haverá migration, escrita no bootstrap nem alteração do endpoint de lançamento.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript ESM; Node.js 24 local

**Primary Dependencies**: Supabase JS 2.104, projeção de bootstrap existente, React 19 como consumidor

**Storage**: Supabase/PostgreSQL, tabela `finance_expense_categories` somente para leitura; schema inalterado

**Testing**: Node Test Runner no backend; navegação de aceitação no frontend publicado

**Target Platform**: funções Node na Vercel e aplicação web já publicada

**Project Type**: aplicação web com frontend React e API Node

**Performance Goals**: zero consultas ou chamadas adicionais; custo linear sobre no máximo a lista curta de categorias retornada

**Constraints**: não escrever durante bootstrap; não misturar padrões com categorias próprias; não ocultar erro de banco; preservar contrato `{ id, name }`

**Scale/Scope**: uma projeção financeira, um helper puro, testes unitários e um fluxo de aceitação publicado

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
- [x] Affected commands and release-quality gates are listed abaixo: `npm test` no backend, deploy de produção do backend e jornada real no frontend publicado com inspeção de console e rede.

**Gate result**: PASS — não há clarificação nem exceção constitucional pendente.

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
back-end/src/modules/app/projections/
├── financeProjection.js
└── financeProjection.test.js

front-end/app/mock/
└── e2e/production-backend.smoke.spec.mjs  # referência do runner publicado

specs/011-fix-saidas/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/finance-bootstrap-categories.md
├── quickstart.md
├── checklists/
└── tasks.md
```

**Structure Decision**: manter a regra no limite que constrói o contrato financeiro do backend. O frontend já consome `{ id, name }` e o endpoint de criação já aceita a categoria escolhida; duplicar o fallback no cliente criaria duas fontes de verdade.

## Design Decisions

- Exportar um conjunto padrão imutável e uma função pura que recebe as linhas já validadas da consulta.
- Retornar os mapeamentos das linhas do tenant quando a lista tiver qualquer item.
- Retornar novos objetos do conjunto padrão somente quando a lista válida estiver vazia, evitando mutação compartilhada entre requests.
- Manter `ensureOk` antes do fallback, para não converter indisponibilidade ou erro de banco em comportamento aparentemente normal.
- Não criar migration: os padrões são uma capacidade de recuperação do contrato e não um cadastro persistente imposto a tenants atuais ou futuros.
- Validar primeiro com teste de regressão que espera sete padrões para `[]` e preservação exata de categorias próprias.

## Rollout and Recovery

- Executar o teste de regressão isolado e depois `npm test` em `back-end`.
- Fazer commit e push exclusivos da feature.
- Publicar `back-end` com `vercel --prod --yes`; o frontend não recebe mudança de código.
- Navegar no frontend oficial, abrir o tenant autenticado, confirmar que o seletor contém sete opções, lançar uma saída QA de baixo valor mediante confirmação do usuário, recarregar e verificar persistência e ausência de erros. Remover o registro QA mediante confirmação separada.
- Rollback: reverter o commit e republicar o backend. Não há migration nem dado para compensar.

## Constitution Re-check After Design

- [x] Teste de regressão precede a alteração da projeção.
- [x] Categorias e lançamentos históricos não recebem escrita corretiva.
- [x] O fallback é idempotente, tenant-neutro e não enfraquece autorização.
- [x] O contrato permanece compatível e erros reais continuam observáveis.
- [x] Gate local, deploy e jornada publicada no navegador estão previstos.

**Post-design gate result**: PASS.

## Complexity Tracking

Nenhuma violação constitucional ou complexidade adicional necessária.
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
