# Feature Specification: Corrigir Renovacao de Sessao

**Feature Branch**: `codex/005-corrigir-sessao`

**Created**: 2026-08-14

**Status**: Implemented

**Context**: Evolucao de `specs/002-fix-session-reload/` apos a primeira
correcao ainda encerrar sessoes durante a renovacao de token.

## User Scenarios & Testing

### User Story 1 - Permanecer autenticado durante renovacao (Priority: P1)

Uma pessoa autenticada permanece no sistema quando a primeira validacao retorna
`401`, desde que a renovacao de credencial e a nova validacao tenham sucesso.

**Acceptance Scenarios**:

1. **Given** sessao renovavel, **When** a validacao retorna `401`, **Then** a
   aplicacao renova e revalida uma vez sem exibir login.
2. **Given** sessao valida sem permissao para um recurso, **When** a API retorna
   `403`, **Then** a sessao permanece ativa.
3. **Given** refresh sem sessao valida ou segunda validacao `401`, **When** a
   recuperacao falha, **Then** a aplicacao encerra a sessao.

## Requirements

- **FR-001**: O cliente MUST tentar refresh uma unica vez antes de encerrar uma
  sessao por `401` na validacao remota.
- **FR-002**: O cliente MUST preservar sessao em `403`, rede e `5xx`.
- **FR-003**: O cliente MUST encerrar sessao quando refresh falhar ou o retry
  retornar `401`.

## Success Criteria

- **SC-001**: Todos os cenarios de refresh, `401`, `403` e indisponibilidade
  possuem teste de regressao aprovado.
- **SC-002**: Testes, lint e build frontend passam antes do deploy.

## Assumptions

- O Supabase permanece responsavel por persistir e renovar tokens.
- O endpoint de sessao usa `401` para credencial invalida.
