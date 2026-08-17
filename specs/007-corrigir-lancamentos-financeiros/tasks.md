# Tasks: Corrigir Lançamentos Financeiros

## Phase 1: Setup

- [x] T001 Registrar causas, limites e rollback em specs/007-corrigir-lancamentos-financeiros/plan.md

## Phase 2: User Story 1 - Preservar data escolhida (P1)

**Independent Test**: 14/08/2026 permanece 14/08/2026 em default local, payload e exibição.

- [x] T002 [US1] Criar testes de regressão falhando para data local e formatação sem UTC em front-end/app/mock/src/features/finance/transactionDateModel.test.mjs
- [x] T003 [P] [US1] Criar testes de regressão falhando para validação estrita de data civil em back-end/src/modules/finance/transactionDateModel.test.js
- [x] T004 [US1] Implementar utilitários de data civil local em front-end/app/mock/src/features/finance/transactionDateModel.js
- [x] T005 [US1] Usar data local nos formulários e listagem em front-end/app/mock/src/features/finance/DailyRevenueForm.jsx e front-end/app/mock/src/App.jsx
- [x] T006 [US1] Implementar validação de data civil e aplicá-la ao salvamento em back-end/src/modules/finance/transactionDateModel.js e back-end/src/modules/finance/repository.js

## Phase 3: User Story 2 - Excluir definitivamente (P1)

**Independent Test**: exclusão chama API antes de atualizar estado; erro mantém o item; reload não o retorna.

- [x] T007 [US2] Criar testes de regressão falhando para exclusão persistente e falha reconciliada em front-end/app/mock/src/features/finance/transactionActions.test.mjs
- [x] T008 [US2] Implementar ação persistente de exclusão em front-end/app/mock/src/features/finance/transactionActions.js
- [x] T009 [US2] Substituir o filtro visual pela ação DELETE com feedback em front-end/app/mock/src/App.jsx
- [x] T010 [US2] Tornar DELETE ausente idempotente sem relaxar tenant e competência em back-end/src/modules/finance/repository.js

## Phase 4: Validation

- [x] T011 Executar testes, lint e builds afetados e registrar resultados em specs/007-corrigir-lancamentos-financeiros/quickstart.md
- [x] T012 Revisar diff para confirmar ausência de migrations e mudanças em outras telas em specs/007-corrigir-lancamentos-financeiros/spec.md

## Dependencies

- T002/T003 falham antes de T004–T006.
- T007 falha antes de T008–T010.
- T011/T012 dependem de ambos os bugs corrigidos.

## Format Validation

Todas as 12 tarefas têm checkbox, ID, história quando aplicável e caminhos exatos.
