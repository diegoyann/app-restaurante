# Tasks: Separar Pedidos Cancelados

**Input**: Design documents in `specs/001-separar-pedidos-cancelados/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/purchase-order-views.md`, `quickstart.md`

## Phase 1: Setup

**Purpose**: Confirmar as fronteiras existentes antes de alterar comportamento.

- [X] T001 Confirmar que `back-end/src/modules/supply-chain/supplyChainService.js` persiste, audita e recarrega `CANCELLED` sem exclusão.

## Phase 2: Foundational

**Purpose**: Capturar a regressão antes de criar a projeção de lista, sem alterar domínio ou API.

- [X] T002 Escrever o teste de regressão que ainda falha para status e competência em `front-end/app/mock/src/features/supply-chain/purchaseOrderViewModel.test.mjs`.
- [X] T003 Criar o contrato puro de seleção por competência e status em `front-end/app/mock/src/features/supply-chain/purchaseOrderViewModel.js`.

## Phase 3: User Story 1 - Operar apenas pedidos ativos (Priority: P1)

**Goal**: Ativos contém exclusivamente pedidos não cancelados da competência selecionada.

**Independent Test**: Uma coleção com pedidos em meses e estados diferentes produz Ativos sem nenhum `CANCELLED`.

### Implementation for User Story 1

- [X] T004 [US1] Integrar seletor de competência, aba Ativos e a coleção filtrada em `front-end/app/mock/src/features/supply-chain/SupplyChainPages.jsx`.

## Phase 4: User Story 2 - Consultar cancelamentos no histórico (Priority: P1)

**Goal**: Histórico contém exclusivamente pedidos cancelados da competência selecionada, inclusive depois de refresh.

**Independent Test**: Alterar o status de um pedido na mesma coleção de `ORDERED` para `CANCELLED` move a seleção de Ativos para Histórico; recriar a coleção com esse estado preserva o resultado.

### Tests for User Story 2

- [X] T005 [US2] Estender o teste de regressão com transição cancelada e recarga da coleção em `front-end/app/mock/src/features/supply-chain/purchaseOrderViewModel.test.mjs`.

### Implementation for User Story 2

- [X] T006 [US2] Integrar aba Histórico, estado vazio e cards preservados em `front-end/app/mock/src/features/supply-chain/SupplyChainPages.jsx`.

## Phase 5: Validation

**Purpose**: Provar a aceitação crítica e registrar o resultado.

- [X] T007 Executar o roteiro de `specs/001-separar-pedidos-cancelados/quickstart.md` e os gates do frontend.

## Dependencies & Execution Order

- T001 confirma a fronteira crítica já existente.
- T002 deve falhar antes de T003; T003 é a fundação dos testes e da interface.
- T005 deve ampliar o teste antes de T006.
- T004 e T006 são sequenciais porque editam o mesmo componente.
- T007 depende de todas as tarefas anteriores.

## Implementation Strategy

1. Escrever o teste de seleção que representa o defeito atual.
2. Implementar a projeção pura e fazê-la passar.
3. Conectar abas e competência à projeção, sem tocar no backend.
4. Executar testes, lint, build e roteiro de aceite com recarregamento.
