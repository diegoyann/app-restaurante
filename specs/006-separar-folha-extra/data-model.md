# Data Model: Separar Folha Extra por Grupo

## Entidades existentes (inalteradas)

### Obrigacao individual de folha extra

- `id`: identidade financeira preservada.
- `employeeId`: funcionario responsavel pela obrigacao.
- `economicCategory`: `FOLHA_EXTRA`.
- `dueDate`: vencimento calculado no dominio de RH e persistido pela API.
- `totalAmount`, `paidAmount`, `openAmount`, `status`: valores e estado individuais.
- `payrollDetail`: detalhe do fechamento semanal.

### Detalhe individual de folha extra

- `employeeName`, `role`.
- `periodStart`, `periodEnd`.
- `daysWorked`, `dailyRateCount`, `workDays`.
- `totalDailyRates`, `totalDeliveryFees`, `totalPayment`.

## Modelo derivado de apresentacao

### Grupo de folha extra

- `id`: `extra:<tipo>:<inicio>:<fim>`.
- `kind`: `EXTRA`.
- `extraType`: `KITCHEN` ou `DELIVERY`.
- `title`: `FOLHA EXTRA — COZINHA` ou `FOLHA EXTRA — MOTOBOY`.
- `periodStart`, `periodEnd`.
- `dueDate`: vencimento comum lido das obrigacoes do grupo.
- `items`: referencias as obrigacoes individuais, sem fusao ou copia persistida.
- `forecast`, `paid`, `open`, `status`: agregados derivados de `items` ativos.

## Regras e invariantes

1. A chave de grupo inclui tipo e periodo; grupos de tipos diferentes nunca compartilham itens.
2. Um item pertence a no maximo um grupo derivado.
3. `forecast`, `paid` e `open` sao somas das obrigacoes individuais nao canceladas.
4. `dueDate` nao e calculado nem persistido pelo agrupador.
5. `totalPayment` de motoboy ja corresponde a `totalDailyRates + totalDeliveryFees`; refeicao nao faz parte deste modelo financeiro.
6. Obrigacao sem classificacao valida permanece individual e nao contamina nenhum agregado.
7. Nenhum estado, transicao ou schema persistente e criado por esta feature.

## Estado

O status agregado continua derivado dos status e saldos individuais: `PAID`, `PARTIAL`, `OVERDUE`, `DUE_SOON`, `EXPECTED` ou `CANCELLED`. Pagamentos continuam alterando somente a obrigacao escolhida pela acao Gerenciar/Pagar.
