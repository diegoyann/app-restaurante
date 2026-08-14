# Feature Specification: Corrigir Abas de Pedidos

**Feature Branch**: `codex/003-fix-purchase-tabs`
**Created**: 2026-08-14
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Separar pedidos operacionais (Priority: P1)

Como operador, quero ver as abas **Ativos** e **Cancelados** em Pedidos de Compra para operar só pedidos vigentes e consultar cancelamentos sem perder o histórico.

**Acceptance Scenarios**:

1. Dado um pedido não cancelado na competência selecionada, quando abro Ativos, então ele é listado.
2. Dado um pedido cancelado na competência selecionada, quando abro Cancelados, então ele é listado com status Cancelado e não aparece em Ativos.
3. Dado que atualizo a página, quando retorno a Pedidos de Compra, então a separação continua baseada no status persistido.

### Edge Cases

- Pedidos de outra competência não aparecem em nenhuma aba.
- Listas vazias informam corretamente a aba selecionada.

## Requirements

### Functional Requirements

- **FR-001**: Pedidos de Compra deve apresentar explicitamente as abas Ativos e Cancelados.
- **FR-002**: Ativos deve incluir apenas pedidos da competência selecionada cujo status não seja `CANCELLED`.
- **FR-003**: Cancelados deve incluir apenas pedidos da competência selecionada cujo status seja `CANCELLED`, preservando os dados históricos do pedido.
- **FR-004**: A troca de status para cancelado e o recarregamento dos dados devem mover o pedido entre as abas sem exclusão persistida.
- **FR-005**: Nenhuma regra de estoque, financeiro, fornecedores ou recebimento será alterada.

## Risk, Boundaries, and Non-Functional Requirements

- **Affected boundaries**: Somente a visualização de pedidos e seu modelo de filtro no frontend.
- **Authorization and tenant scope**: Mantêm-se os dados e permissões já carregados para o tenant.
- **Data integrity and retry behavior**: O cancelamento continua persistido e auditado pelo fluxo existente; a interface não pode reintroduzi-lo em Ativos.
- **Failure and recovery behavior**: Uma falha de atualização preserva as listas conforme o último estado persistido.

## Success Criteria

- **SC-001**: A interface mostra as duas abas com os rótulos Ativos e Cancelados.
- **SC-002**: Em uma competência com ambos os estados, zero pedidos cancelados aparecem em Ativos e 100% deles aparecem em Cancelados.
- **SC-003**: O teste de regressão cobre rótulo de aba, status e competência.

## Assumptions

- `CANCELLED` é o valor persistido para pedido cancelado e o rótulo de negócio é Cancelados.
