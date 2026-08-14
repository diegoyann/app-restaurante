# UI Contract: Grupos de Folha Extra em Contas a Pagar

## Entrada existente

Cada obrigacao extra consumida pela tela deve fornecer identidade individual, categoria `FOLHA_EXTRA`, periodo e cargo em `payrollDetail`, vencimento em `dueDate`, composicao de diarias e taxas, total, pago, aberto e status individuais.

Nao ha endpoint, request, autorizacao ou resposta de erro novos.

## Saida do agrupador

- `KITCHEN`: titulo `FOLHA EXTRA — COZINHA` e somente itens cujo cargo nao vazio nao seja de entrega.
- `DELIVERY`: titulo `FOLHA EXTRA — MOTOBOY` e somente itens cujo cargo contenha `moto` ou `entrega`.
- `dueDate`: valor proveniente dos itens do grupo.
- Agregados: previsto, pago, aberto e status.
- `items`: obrigacoes originais e individuais.

Itens sem cargo valido nao fazem parte da saida agrupada.

## Contrato visual do card

Cada card extra mostra, sem expansao: titulo do grupo, periodo de segunda a domingo, vencimento, quantidade de obrigacoes individuais, previsto, pago, aberto, status, acao de expandir e acao `EXPORTAR EXCEL — COZINHA` ou `EXPORTAR EXCEL — MOTOBOY`.

## Contrato do detalhamento

### Cozinha

Funcionario, dias trabalhados, tipos de diaria, quantidade de diarias, valor total, pago, aberto, status e Gerenciar/Pagar. Nao mostra taxas como composicao de motoboy.

### Motoboy

Funcionario, dias trabalhados, valor das diarias, taxas de entrega, total previsto, pago, aberto, status e Gerenciar/Pagar. Refeicao nao aparece nem entra no total.

## Contrato de exportacao

### Cozinha

- Titulo, aba e filename identificam cozinha.
- Colunas: Funcionario, Periodo, Dias trabalhados, Datas trabalhadas, Tipos de diaria, Quantidade de diarias, Valor das diarias, Total previsto, Pago, Aberto, Status.
- Somente itens `KITCHEN`.

### Motoboy

- Titulo, aba e filename identificam motoboy.
- Colunas: Funcionario, Periodo, Dias trabalhados, Datas trabalhadas, Diarias, Taxas de entrega, Total previsto, Pago, Aberto, Status.
- Somente itens `DELIVERY`.

## Compatibilidade e falhas

- Folha fixa e obrigacoes financeiras nao agrupadas mantem seus contratos atuais.
- Falta de cargo nao autoriza classificacao presumida; o item permanece individual.
- A tela nao recalcula vencimento nem total financeiro.
