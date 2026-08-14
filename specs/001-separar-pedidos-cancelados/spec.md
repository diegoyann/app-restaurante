# Feature Specification: Separar Pedidos Cancelados

**Feature Branch**: `001-separar-pedidos-cancelados`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Correção do bug em que pedidos de compra cancelados continuam na lista operacional principal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operar apenas pedidos ativos (Priority: P1)

Como operador de compras, quero que a visão **Ativos** apresente apenas pedidos que ainda exigem acompanhamento na competência selecionada, para não agir por engano sobre pedidos cancelados.

**Why this priority**: A mistura de pedidos cancelados com a operação diária gera risco direto de compra e recebimento indevidos.

**Independent Test**: Criar pedidos ativos e cancelados na mesma competência, abrir Ativos e confirmar que somente os não cancelados são listados.

**Acceptance Scenarios**:

1. **Given** pedidos ativos e cancelados em agosto de 2026, **When** o operador seleciona agosto de 2026 na visão Ativos, **Then** somente pedidos não cancelados dessa competência são apresentados.
2. **Given** um pedido exibido em Ativos, **When** o operador o cancela, **Then** ele deixa a lista Ativos imediatamente e o registro permanece preservado.

---

### User Story 2 - Consultar cancelamentos no histórico (Priority: P1)

Como operador de compras, quero consultar pedidos cancelados na aba **Histórico**, para manter rastreabilidade sem poluir a lista operacional.

**Why this priority**: O cancelamento não pode apagar o registro nem ocultar seu histórico de auditoria.

**Independent Test**: Cancelar um pedido, abrir Histórico e confirmar que o mesmo pedido é exibido com status Cancelado; recarregar a página e repetir a confirmação.

**Acceptance Scenarios**:

1. **Given** um pedido cancelado na competência selecionada, **When** o operador abre Histórico, **Then** o pedido é listado com o status Cancelado.
2. **Given** um pedido recém-cancelado, **When** o navegador é recarregado, **Then** o pedido continua ausente de Ativos e presente em Histórico.

### Edge Cases

- Pedidos em competências diferentes não aparecem em nenhuma das duas visualizações da competência selecionada.
- A ausência de pedidos na aba selecionada apresenta uma mensagem coerente, sem reutilizar a lista da outra aba.
- Status distintos de CANCELLED, inclusive pedidos já recebidos, permanecem em Ativos conforme a regra solicitada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A visão Ativos deve exibir, para a competência selecionada, apenas pedidos cujo status não seja `CANCELLED`.
- **FR-002**: A aba Histórico deve exibir, para a competência selecionada, somente pedidos cujo status seja `CANCELLED`.
- **FR-003**: Ao cancelar um pedido, o sistema deve persistir o status `CANCELLED` e preservar o registro e seus dados de auditoria.
- **FR-004**: Depois de uma confirmação de cancelamento bem-sucedida, a separação entre Ativos e Histórico deve refletir o novo status sem exigir recarregamento manual.
- **FR-005**: Após novo carregamento dos dados, a separação deve continuar baseada no status persistido e na competência selecionada.
- **FR-006**: A correção fica limitada à listagem de pedidos de compra; regras de estoque, financeiro, fornecedores e recebimentos não devem mudar.

### Key Entities *(include if feature involves data)*

- **Pedido de compra**: Registro persistido de compra, com status, data/competência, fornecedor, itens e motivo de cancelamento.
- **Competência selecionada**: Mês usado para segmentar as duas listas da tela de pedidos.

## Risk, Boundaries, and Non-Functional Requirements *(mandatory)*

- **Affected boundaries**: Frontend de pedidos de compra e carregamento já existente de dados de supply chain. API, domínio e banco devem ser inspecionados para confirmar que o status cancelado persiste; não há nova rota ou migração prevista.
- **Authorization and tenant scope**: A listagem continua usando exclusivamente os dados do tenant já carregados e as permissões existentes; nenhum acesso é ampliado.
- **Data integrity and retry behavior**: Cancelamento continua uma atualização de status auditada, sem exclusão. Repetições não podem reintroduzir o pedido em Ativos se o status persistido for `CANCELLED`.
- **Failure and recovery behavior**: Em falha de cancelamento, o estado persistido e as listas permanecem inalterados; após sucesso, o refresh deve reproduzir a separação correta.
- **Performance, accessibility, or observability requirement**: As abas precisam ter rótulos acessíveis e a filtragem deve ocorrer antes da renderização das listas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma competência com pedidos ativos e cancelados, Ativos exibe zero pedidos `CANCELLED`.
- **SC-002**: Em uma competência com pedidos ativos e cancelados, Histórico exibe 100% dos pedidos `CANCELLED` e nenhum pedido de outro status.
- **SC-003**: O roteiro criar, cancelar, trocar para Histórico e recarregar confirma a mesma separação em todas as etapas.
- **SC-004**: Os testes de regressão cobrem filtragem por status, competência e estado pós-recarregamento sem alterar fluxos externos ao pedido de compra.

## Assumptions

- A competência de um pedido é derivada da data de pedido já exibida pela tela.
- O valor canônico persistido para cancelamento é `CANCELLED`, embora a interface o apresente como Cancelado.
- Pedidos recebidos continuam em Ativos porque o escopo exige excluir somente pedidos cancelados.
