# Research: Separar Folha Extra por Grupo

## Decision 1: Reutilizar a classificacao de cargo ja entregue pela API

- **Decision**: Classificar como motoboy quando `payrollDetail.role` contiver `moto` ou `entrega`; classificar demais cargos nao vazios como cozinha.
- **Rationale**: `obligationsService.js` ja anexa `employees.role` a cada detalhe individual, e `workforceService.js`/`extraObligationModel.js` usam a mesma convencao para distinguir entrega. Isso evita schema e chamada adicional.
- **Alternatives considered**: Inferir pelo valor/taxa (fragil), pelo texto da descricao/nota (historico e localizado), ou criar campo novo no banco (fora do escopo e desnecessario).

## Decision 2: Consumir o vencimento existente, sem recalcular no frontend

- **Decision**: O grupo exibe o `dueDate` das obrigacoes individuais classificadas.
- **Rationale**: `regenerateWeeklyClosing` ja calcula `periodEnd + 1` para cozinha e `periodEnd + 4` para motoboy, persistindo o resultado em `expected_payment_date`, depois propagado para `financial_obligations.due_date`.
- **Alternatives considered**: Calcular segunda/quinta na interface duplicaria regra financeira e violaria o limite de dominio da constituicao.

## Decision 3: Preservar obrigacoes sem classificacao fora dos agregados

- **Decision**: Um extra sem `role` valido nao entra em cozinha nem motoboy e nao e incluido em `payrollIds`, permanecendo na lista individual generica.
- **Rationale**: Evita mistura silenciosa e mantem o problema observavel sem excluir uma divida da tela.
- **Alternatives considered**: Assumir cozinha por padrao contaminaria totais; ocultar a obrigacao criaria risco financeiro.

## Decision 4: Especializar a exportacao pelo tipo do grupo

- **Decision**: Cozinha e motoboy recebem titulos, nomes de aba, filenames e conjuntos de colunas proprios.
- **Rationale**: Atende a conferencia operacional e impede que colunas irrelevantes sugiram composicoes erradas.
- **Alternatives considered**: Manter uma planilha generica nao cumpre a separacao requerida.

## Decision 5: Nao alterar backend nem persistencia

- **Decision**: A feature muda somente os modelos e a pagina do frontend.
- **Rationale**: O contrato atual ja contem ID individual, cargo, periodo, composicao, vencimento e saldos necessarios.
- **Alternatives considered**: Endpoint ou migration novos aumentariam risco sem entregar valor adicional.
