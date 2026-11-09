# Tasks: Otimizar carregamento inicial do dashboard

**Input**: Design documents from `/specs/010-optimize-bootstrap/`

**Tests**: Regressões, contrato, segurança e E2E são obrigatórios e antecedem as correções correspondentes.

## Phase 1: Setup (Shared Evidence)

**Purpose**: Congelar escopo, ambiente e evidência anterior sem alterar código de produto.

- [X] T001 Registrar branch, linha de base Git, URLs oficiais, commit publicado e ferramentas disponíveis em `specs/010-optimize-bootstrap/baseline.md`
- [X] T002 [P] Inventariar chaves/shape do contrato atual e campos consumidos em `specs/010-optimize-bootstrap/contracts/bootstrap-contract.md`
- [X] T003 [P] Inventariar consultas, `select('*')`, índices declarados e candidatos condicionais em `specs/010-optimize-bootstrap/baseline.md`
- [X] T004 Medir na versão oficial vigente duração total quente/fria disponível, status, bytes, console/rede e logs Vercel antes de qualquer mudança de produto em `specs/010-optimize-bootstrap/baseline.md`

---

## Phase 2: Foundational (Diagnostic Instrumentation)

**Purpose**: Obter a decomposição obrigatória antes de otimizar.

- [X] T005 Criar testes da telemetria sanitizada, spans, bytes e correlação em `back-end/src/lib/bootstrapTrace.test.js`
- [X] T006 Implementar utilitário de trace sem dados sensíveis em `back-end/src/lib/bootstrapTrace.js`
- [X] T007 Instrumentar autenticação, tenant, permissões, montagem e serialização sem mudar o corpo em `back-end/api-handlers/app/bootstrap.js` e `back-end/api-handlers/_shared/http.js`
- [X] T008 Instrumentar cada projeção e atribuir contagem/duração Supabase em `back-end/src/modules/app/tenantBootstrapReadModel.js` e `back-end/src/modules/app/projections/*.js`
- [X] T009 Instrumentar geração de obrigações, folha, extras e repasses com contagens em `back-end/src/modules/finance/obligationsService.js` e `back-end/src/modules/finance/settlementService.js`
- [X] T010 Executar diagnóstico representativo antes das otimizações e registrar spans, consultas, linhas, bytes e causa comprovada em `specs/010-optimize-bootstrap/baseline.md`
- [X] T011 Validar índices reais e EXPLAIN somente para consultas lentas observadas, registrando planos e decisão de migration em `specs/010-optimize-bootstrap/baseline.md`

**Checkpoint**: Nenhuma otimização começa sem T004 e T010 concluídas; hipóteses sem evidência são rejeitadas.

---

## Phase 3: User Story 1 - Abrir o dashboard rapidamente (Priority: P1) 🎯 MVP

**Goal**: Reduzir o bootstrap quente para menos de 5 s e frio para menos de 10 s.

**Independent Test**: Três recargas quentes e uma fria do endpoint ficam dentro da meta e devolvem conteúdo completo.

### Tests first

- [X] T012 [P] [US1] Criar regressão que reproduz contagens/sequências dominantes comprovadas no diagnóstico em `back-end/src/modules/app/tenantBootstrapReadModel.test.js`
- [X] T013 [P] [US1] Criar regressões específicas para N+1 financeiro comprovado em `back-end/src/modules/finance/bootstrapFinancePerformance.test.js`
- [X] T014 [P] [US1] Criar teste estrutural de seleção explícita apenas para projeções com ganho comprovado em `back-end/src/modules/app/projections/bootstrapProjectionContract.test.js`
- [X] T015 [US1] Executar T012–T014 contra o código anterior e registrar as falhas esperadas em `specs/010-optimize-bootstrap/baseline.md`

### Implementation

- [X] T016 [US1] Eliminar consultas duplicadas e sequenciamento comprovado no orquestrador em `back-end/api-handlers/app/bootstrap.js`, `back-end/src/modules/app/tenantBootstrapReadModel.js` e `back-end/src/repositories/appRepository.js`
- [X] T017 [US1] Remover ou consolidar sincronizações N+1 comprovadas preservando consistência em `back-end/src/modules/finance/obligationsService.js`, `back-end/src/modules/finance/settlementService.js` e `back-end/src/modules/app/projections/financeProjection.js`
- [X] T018 [US1] Substituir `select('*')` somente nas projeções comprovadamente relevantes e cobertas em `back-end/src/modules/app/projections/*.js`
- [X] T019 [US1] Criar nova migration de índice somente se T011 comprovar necessidade, com validação e compensação em `supabase/migrations/<timestamp>_bootstrap_performance_indexes.sql`
- [X] T020 [US1] Reexecutar a telemetria local/representativa, comparar spans e bytes e registrar o depois em `specs/010-optimize-bootstrap/baseline.md`

**Checkpoint**: Endpoint cumpre metas representativas sem `maxDuration` como justificativa.

---

## Phase 4: User Story 2 - Preservar segurança e dados (Priority: P1)

**Goal**: Garantir equivalência de contrato, permissões, tenant e regras.

**Independent Test**: Fixtures admin/staff/super-admin/cross-tenant e payload representativo preservam respostas e negações.

### Tests first

- [X] T021 [P] [US2] Criar teste de contrato completo do handler e shape do payload em `back-end/src/modules/app/bootstrapContract.test.js`
- [X] T022 [P] [US2] Criar testes de equivalência de permissões e negação cross-tenant em `back-end/src/modules/auth/bootstrapPermissions.test.js`
- [X] T023 [P] [US2] Criar teste frontend que fixa todas as chaves hidratadas e defaults em `front-end/app/mock/src/App.bootstrap.test.mjs`

### Implementation

- [X] T024 [US2] Ajustar reutilização de tenant/perfis para preservar exatamente autorização e mapa de permissões em `back-end/api-handlers/app/bootstrap.js` e `back-end/src/repositories/appRepository.js`
- [X] T025 [US2] Ajustar consumidores frontend somente se necessário para compatibilidade comprovada em `front-end/app/mock/src/App.jsx` e `front-end/app/mock/src/services/realApi.js`
- [X] T026 [US2] Validar eventual migration no banco real sem apagar/recriar dados e registrar rollback em `specs/010-optimize-bootstrap/baseline.md`

**Checkpoint**: US1 e US2 passam juntas; ganho sem equivalência é rejeitado.

---

## Phase 5: User Story 3 - Diagnosticar e comprovar a melhoria (Priority: P2)

**Goal**: Produzir evidência publicada reproduzível de causa, ganho e gargalos restantes.

**Independent Test**: Logs e navegador correlacionam três chamadas quentes e uma fria, status, duração, bytes e jornada completa.

### Tests first

- [X] T027 [US3] Criar E2E autenticado com três reloads, coleta do bootstrap, console, rede e telas dependentes em `front-end/app/mock/e2e/authenticated-bootstrap.spec.mjs`

### Implementation and evidence

- [X] T028 [US3] Executar suites completas, lint e build e registrar resultados em `specs/010-optimize-bootstrap/baseline.md`
- [X] T029 [US3] Executar `$speckit-converge` e registrar desvios/riscos conhecidos antes do fechamento em `specs/010-optimize-bootstrap/convergence.md`
- [X] T030 [US3] Executar validação Git, revisar somente arquivos da solicitação, criar commit convencional com coautoria e fazer push da branch `codex/010-optimize-bootstrap`
- [X] T031 [US3] Publicar produção com `vercel --prod --yes` em `back-end` e no frontend somente se afetado, seguindo `specs/010-optimize-bootstrap/quickstart.md`
- [X] T032 [US3] Executar navegação autenticada oficial, três reloads e telas principais, preservando a evidência para o relatório final conforme `specs/010-optimize-bootstrap/quickstart.md`
- [X] T033 [US3] Consultar logs Vercel correlacionados e preservar duração/status/erros e comparação antes/depois para o relatório final conforme `specs/010-optimize-bootstrap/quickstart.md`

---

## Phase 6: Handoff

- [ ] T034 Entregar causa, medições, arquivos, consultas/índices, payload, testes, navegação, URLs e gargalos conforme `specs/010-optimize-bootstrap/quickstart.md`

## Dependencies & Execution Order

- Phase 1 bloqueia instrumentação; T004 precede qualquer arquivo de produto.
- Phase 2 bloqueia otimização; T010 é o gate de causa comprovada.
- US1 e US2 compartilham o mesmo release: testes T012–T015 e T021–T023 antecedem T016–T025.
- US3 depende de US1+US2 e dos gates locais; convergência e fechamento Git precedem o deploy.
- Evidência pós-deploy é reportada sem criar uma segunda alteração no worktree ou um segundo commit.

## Parallel Opportunities

- T002 e T003 podem ser documentados em paralelo.
- T012–T014 e T021–T023 cobrem arquivos distintos, mas todos devem falhar antes da correção.
- Nenhuma otimização financeira deve correr em paralelo com edição do mesmo serviço.
- Gates backend e frontend podem rodar em paralelo depois de código estabilizado.

## Implementation Strategy

O MVP é US1 com US2 como gate inseparável: desempenho sem integridade não é entrega. US3 transforma sucesso local em evidência publicada. Qualquer otimização sem redução mensurável é removida, e qualquer meta falha impede conclusão.
