# Tasks: Corrigir timeout do backend

## Phase 1: Setup

- [x] T001 Configurar o runner de navegação em `front-end/app/mock/package.json`, `front-end/app/mock/package-lock.json` e `front-end/app/mock/playwright.config.mjs`

## Phase 2: User Story 1 - Abrir o painel sem falha (Priority: P1)

**Independent Test**: Abrir e recarregar duas vezes `/app` com sessão válida sem exibir a falha.

- [x] T002 [P] [US1] Adicionar regressão inicialmente falha do orçamento mínimo em `back-end/src/lib/vercelRuntime.test.js` e `back-end/package.json`
- [x] T003 [P] [US1] Adicionar smoke publicado em `front-end/app/mock/e2e/production-backend.smoke.spec.mjs`
- [x] T004 [US1] Elevar o orçamento da função para 60 segundos em `back-end/vercel.json`

## Phase 3: Validation and Release

- [x] T005 Executar todos os gates locais descritos em `specs/008-fix-backend-timeout/quickstart.md`
- [ ] T006 Publicar o backend com `vercel --prod --yes` a partir de `back-end`
- [ ] T007 Recarregar duas vezes a tela autenticada por automação no navegador integrado e registrar o resultado em `specs/008-fix-backend-timeout/quickstart.md`
- [ ] T008 Consultar logs desde o deploy, confirmar ausência de novos 504 do bootstrap e registrar em `specs/008-fix-backend-timeout/quickstart.md`

## Dependencies

- T002 deve falhar antes de T004. T005 precede T006; T006 precede T007 e T008.
