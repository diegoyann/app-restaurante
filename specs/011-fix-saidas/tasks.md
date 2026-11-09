# Tasks: Restaurar Lançamento de Saídas

**Input**: Design documents from `/specs/011-fix-saidas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: A regressão do contrato vazio deve ser escrita e executada contra o comportamento anterior antes da correção. O fluxo financeiro crítico também exige aceitação no navegador após deploy.

**Organization**: Tarefas agrupadas por história para manter fallback e preservação de categorias rastreáveis e independentemente verificáveis.

## Phase 1: Setup and Evidence

**Purpose**: Consolidar a reprodução e os limites antes da alteração.

- [X] T001 Registrar evidência de 0 opções no seletor publicado, limites e rollback em specs/011-fix-saidas/quickstart.md

---

## Phase 2: Foundational Regression Guard

**Purpose**: Criar o teste que bloqueia a implementação incorreta para ambas as histórias.

- [X] T002 Criar e executar primeiro testes de regressão para lista vazia, lista própria e isolamento contra mutação em back-end/src/modules/app/projections/financeProjection.test.js, confirmando falha do caso vazio antes da correção

**Checkpoint**: A causa reproduzida está protegida por teste falhando e os requisitos de preservação estão codificados.

---

## Phase 3: User Story 1 - Lançar saída sem categorias cadastradas (Priority: P1) 🎯 MVP

**Goal**: Entregar sete categorias padrão selecionáveis quando a consulta válida do tenant retorna vazia.

**Independent Test**: A função recebe `[]` e retorna exatamente os sete itens definidos em FR-002, com objetos independentes entre chamadas.

### Implementation for User Story 1

- [X] T003 [US1] Implementar conjunto padrão imutável e resolução determinística de lista vazia em back-end/src/modules/app/projections/financeProjection.js
- [X] T004 [US1] Integrar a resolução após `ensureOk` e antes da montagem do contrato em back-end/src/modules/app/projections/financeProjection.js

**Checkpoint**: Tenant sem cadastro recebe opções e erro de consulta continua sendo propagado.

---

## Phase 4: User Story 2 - Preservar categorias próprias (Priority: P1)

**Goal**: Garantir que qualquer cadastro do tenant tenha precedência total e não seja misturado aos padrões.

**Independent Test**: Uma lista com categorias próprias retorna os mesmos IDs, nomes e ordem, sem item padrão adicional.

### Validation for User Story 2

- [X] T005 [US2] Executar os cenários de preservação e mutação em back-end/src/modules/app/projections/financeProjection.test.js e revisar o contrato em specs/011-fix-saidas/contracts/finance-bootstrap-categories.md

**Checkpoint**: Histórias 1 e 2 passam independentemente no helper puro.

---

## Phase 5: Polish and Local Gates

**Purpose**: Validar regressão, suíte afetada e documentação de entrega antes do fechamento Git.

- [X] T006 Executar `node --test src/modules/app/projections/financeProjection.test.js` e `npm test` em back-end e registrar resultados em specs/011-fix-saidas/quickstart.md
- [X] T007 Revisar diff, ausência de migration e aderência a FR-001–FR-011 em specs/011-fix-saidas/spec.md e specs/011-fix-saidas/plan.md

---

## Phase 6: Release Acceptance

**Purpose**: Cumprir o gate constitucional do fluxo financeiro crítico após commit, push e deploy de produção do backend.

- [X] T008 Navegar no frontend publicado, confirmar sete categorias, lançar e recarregar uma saída QA mediante confirmação do usuário, inspecionar console/rede e limpar o dado QA mediante nova confirmação, registrando URL e evidências em specs/011-fix-saidas/quickstart.md

---

## Dependencies & Execution Order

- T001 conclui a evidência antes de qualquer código.
- T002 deve existir e falhar no caso vazio antes de T003/T004.
- T003 precede T004 no mesmo arquivo.
- T005 depende de T003/T004.
- T006/T007 dependem de ambas as histórias.
- T008 depende de T006/T007, do fechamento Git e do deploy de produção do backend; a convergência de código pode ser executada antes desse gate externo, mas a feature só termina após T008.

## Parallel Opportunities

Não há paralelismo seguro no núcleo: teste e implementação alteram dois arquivos dependentes, e TDD exige ordem estrita. A revisão documental de T007 pode ocorrer em paralelo à suíte completa de T006 depois que T005 passar.

## Implementation Strategy

1. Registrar a evidência publicada.
2. Adicionar o teste e provar a regressão no comportamento anterior.
3. Implementar o menor fallback no backend.
4. Validar preservação de categorias próprias.
5. Executar gates locais e revisar o escopo.
6. Convergir o código, fechar Git, publicar backend e completar T008 no navegador.

## Format Validation

Todas as 8 tarefas possuem checkbox, ID sequencial, rótulo de história quando aplicável e caminho exato.
