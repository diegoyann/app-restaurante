# Tasks: Corrigir falha de sessão durante o uso

**Input**: Artefatos em `specs/002-fix-session-reload/`

## Phase 1: Preparação

- [x] T001 Revisar o contrato de classificação em `specs/002-fix-session-reload/contracts/auth-session-client.md`

## Phase 2: User Story 1 - Continuar trabalhando após falha temporária (Priority: P1) 🎯 MVP

**Goal**: Preservar a sessão validada se a API de perfil falhar temporariamente.

**Independent Test**: Uma falha de rede ou 5xx durante a validação não zera uma sessão anterior; 401/403 ainda a encerram.

- [x] T002 [US1] Criar teste de regressão de classificação de falha em `front-end/app/mock/src/hooks/sessionRecovery.test.mjs`
- [x] T003 [US1] Implementar classificação de erro e preservação de sessão em `front-end/app/mock/src/hooks/useAuthSession.js`
- [x] T004 [US1] Ajustar o estado de carregamento/erro de sessão em `front-end/app/mock/src/components/ProtectedRoute.jsx` e `front-end/app/mock/src/pages/LoginPage.jsx`

## Phase 3: Validação e robustez

- [x] T005 Executar testes de sessão em `front-end/app/mock/src/hooks/sessionRecovery.test.mjs`
- [x] T006 Executar a suíte frontend em `front-end/app/mock/src/**/*.test.mjs`
- [x] T007 Executar lint em `front-end/app/mock`
- [x] T008 Executar build de produção em `front-end/app/mock`

## Dependencies & Execution Order

T001 → T002 → T003 → T004 → T005–T008. O teste T002 deve falhar antes de T003.

## Implementation Strategy

Entregar primeiro a preservação segura da sessão e a rejeição explícita de 401/403; depois validar a aplicação completa.
