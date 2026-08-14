# Contrato de Visualização: Pedidos de Compra

## Entrada

Uma coleção de pedidos já autorizada para o tenant, uma competência `YYYY-MM` e uma aba (`ACTIVE` ou `HISTORY`).

## Saída

| Aba | Inclusão |
|---|---|
| `ACTIVE` | `orderDate` na competência selecionada e `status !== "CANCELLED"` |
| `HISTORY` | `orderDate` na competência selecionada e `status === "CANCELLED"` |

## Invariantes

- Um pedido não aparece nas duas abas da mesma competência.
- Um pedido cancelado persistido jamais aparece em Ativos, inclusive após receber novamente os dados.
- O contrato não altera o pedido, seu status, seu tenant ou suas permissões.
