# Tasks: Separar Folha Extra por Grupo

**Input**: Design documents from `specs/006-separar-folha-extra/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Obrigatorios e escritos antes de cada mudanca de comportamento.

**Organization**: Tarefas agrupadas por historia de usuario e ordenadas para manter TDD e arquivos compartilhados sequenciais.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar os contratos existentes e limitar o escopo antes de alterar comportamento.

- [x] T001 Registrar no plano a fonte existente de cargo, vencimento, composicao e identidade individual em specs/006-separar-folha-extra/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fixar em teste a classificacao compartilhada pelos cards, detalhes e exportacoes.

- [x] T002 [US1] Adicionar testes que falham para grupos KITCHEN e DELIVERY separados, vencimentos proprios, totais exclusivos, IDs individuais e extra sem cargo em front-end/app/mock/src/features/finance/payrollGroupingModel.test.mjs
- [x] T003 [US1] Implementar classificacao e agrupamento por tipo e periodo sem recalcular vencimento nem absorver extras sem cargo em front-end/app/mock/src/features/finance/payrollGroupingModel.js

**Checkpoint**: O modelo produz dois grupos derivados e preserva todas as obrigacoes individuais.

---

## Phase 3: User Story 1 - Visualizar compromissos separados (Priority: P1) MVP

**Goal**: Mostrar cards independentes de cozinha e motoboy com periodo, vencimento, valores e status.

**Independent Test**: A semana 10/08/2026–16/08/2026 gera cozinha vencendo 17/08/2026 e motoboy vencendo 20/08/2026, sem cruzar itens ou valores.

### Implementation for User Story 1

- [x] T004 [US1] Adaptar o card extra para exibir titulo por grupo, periodo e vencimento recebido do modelo em front-end/app/mock/src/features/finance/AccountsPayablePage.jsx

**Checkpoint**: Os compromissos de cada grupo e data ficam claros sem expansao.

---

## Phase 4: User Story 2 - Gerenciar obrigacoes individuais (Priority: P1)

**Goal**: Exibir composicao especifica por grupo e manter Gerenciar/Pagar sobre o item individual.

**Independent Test**: Cozinha mostra tipos/quantidades de diaria sem motoboys; motoboy mostra diarias e taxas sem refeicao; a acao recebe o objeto individual original.

### Tests for User Story 2

- [x] T005 [US2] Adicionar testes que falham para a composicao de detalhe de cozinha e motoboy, incluindo exclusao de refeicao e preservacao do item individual em front-end/app/mock/src/features/finance/payrollGroupingModel.test.mjs

### Implementation for User Story 2

- [x] T006 [US2] Implementar derivacao testavel da composicao individual por tipo em front-end/app/mock/src/features/finance/payrollGroupingModel.js
- [x] T007 [US2] Renderizar campos, status e Gerenciar/Pagar especificos de cozinha e motoboy em front-end/app/mock/src/features/finance/AccountsPayablePage.jsx

**Checkpoint**: Cada card expandido contem apenas seu grupo e sua composicao correta.

---

## Phase 5: User Story 3 - Exportar cada grupo separadamente (Priority: P2)

**Goal**: Gerar planilhas exclusivas de cozinha e motoboy com colunas, titulos, abas e filenames proprios.

**Independent Test**: Cada workbook contem somente os itens de seu grupo, colunas requeridas e totais identicos ao card.

### Tests for User Story 3

- [x] T008 [US3] Adicionar testes que falham para workbook de cozinha com colunas e filename exclusivos em front-end/app/mock/src/features/finance/payrollWorkbook.test.mjs
- [x] T009 [US3] Adicionar testes que falham para workbook de motoboy com diarias, taxas, ausencia de refeicao e filename exclusivo em front-end/app/mock/src/features/finance/payrollWorkbook.test.mjs

### Implementation for User Story 3

- [x] T010 [US3] Especializar titulos, colunas, abas, formatos e filenames por extraType em front-end/app/mock/src/features/finance/payrollWorkbook.js
- [x] T011 [US3] Exibir rotulos EXPORTAR EXCEL — COZINHA e EXPORTAR EXCEL — MOTOBOY nos respectivos cards em front-end/app/mock/src/features/finance/AccountsPayablePage.jsx

**Checkpoint**: As duas exportacoes ficam operacionalmente separadas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar integralmente o escopo e registrar evidencia de entrega.

- [x] T012 Executar testes completos do frontend e registrar o resultado em specs/006-separar-folha-extra/quickstart.md
- [x] T013 Executar lint e build de producao do frontend e registrar os resultados em specs/006-separar-folha-extra/quickstart.md
- [x] T014 Revisar o diff para confirmar ausencia de mudancas em RH, backend, Supabase ou outras regras financeiras conforme specs/006-separar-folha-extra/spec.md

---

## Dependencies & Execution Order

- Phase 1 precede a implementacao.
- T002 deve falhar antes de T003; T003 desbloqueia US1, US2 e US3.
- T005 deve falhar antes de T006/T007.
- T008 e T009 devem falhar antes de T010/T011.
- T012 a T014 dependem de todas as historias.

## Parallel Opportunities

- T008 e T009 podem ser escritos no mesmo passe antes da implementacao, mas compartilham arquivo e devem ser aplicados de forma coordenada.
- A revisao documental pode ocorrer em paralelo a leitura do codigo, mas alteracoes nos modelos e testes compartilhados permanecem sequenciais.

## Implementation Strategy

1. Entregar primeiro o agrupador e os cards (US1).
2. Especializar o detalhamento sem mudar a acao financeira individual (US2).
3. Especializar os workbooks e rotulos de exportacao (US3).
4. Rodar todos os gates do frontend e revisar rigorosamente o escopo.

## Format Validation

Todas as 14 tarefas usam checkbox, ID sequencial, historia quando aplicavel, descricao acionavel e caminho exato.
