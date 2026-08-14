# Feature Specification: Logs persistentes de erros

**Feature Branch**: `codex/004-persist-error-logs`
**Created**: 2026-08-14

## User Scenario

Um administrador técnico consegue correlacionar uma falha de API com rota, status, request ID e stack trace sem expor segredos a usuários finais.

## Requirements

- **FR-001**: Toda resposta de erro da API deve registrar um evento no banco.
- **FR-002**: O evento deve incluir rota, método, status, request ID, identidade disponível e stack trace sanitizado.
- **FR-003**: O evento não deve conter tokens, senhas nem corpo de requisição.
- **FR-004**: Falha ao gravar o log não pode impedir a resposta original da API.
- **FR-005**: Clientes não podem ler ou gravar esses logs diretamente.

## Success Criteria

- **SC-001**: Testes comprovam a remoção de segredos antes da persistência.
- **SC-002**: A suíte backend passa com a migração e o logger.
