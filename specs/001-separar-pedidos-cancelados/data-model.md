# Data Model: Separar Pedidos Cancelados

## Pedido de compra (existente)

| Campo | Uso nesta alteração | Regra |
|---|---|---|
| `id` | chave do card | preservado |
| `status` | seleção da aba | `CANCELLED` pertence exclusivamente ao Histórico |
| `orderDate` | seleção da competência | `slice(0, 7)` deve coincidir com o mês selecionado |
| `cancelledAt` e `cancellationReason` | histórico/auditoria | preservados pelo fluxo existente |

## Projeção de visualização (nova, não persistida)

| Campo | Origem | Regra |
|---|---|---|
| `month` | seleção do usuário | formato `YYYY-MM` |
| `view` | aba do usuário | `ACTIVE` ou `HISTORY` |
| `visibleOrders` | pedidos carregados | mesma competência e status compatível com a aba |

Não há alteração de estados persistidos nem migração. A transição `qualquer status elegível → CANCELLED` continua pertencendo ao serviço de domínio existente.
