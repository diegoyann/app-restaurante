# Contract: GET /api/app/bootstrap

## Request

- `GET /api/app/bootstrap?tenant={slug}`.
- Bearer válido e tenant obrigatório, sujeitos ao mesmo `requireTenantAccess`.
- Nenhum novo cache HTTP.

## Response 200 compatível

O corpo mantém as chaves atuais:

- contexto: `tenant`, `roleProfiles`, `currentUserPermissions`;
- configurações: `settings`, `aiBehaviorSettings`, `payrollConfig`;
- RH: `employees`, `employeeRoles`, `discountCategories`, `employeeWorkLogs`, `extraWeeklyClosings`, `payrollAdjustments`;
- financeiro: `recurringCosts`, `salesChannels`, `financeExpenseCategories`, `transactions`, `paymentMethods`, `financialClosings`, `financialObligations`, `financialPayments`, `dailyCashReconciliations`, `recurringCostDuplicateCandidates`, `channelSettlements`;
- clientes/pedidos/entrega: `customers`, `orders`, `deliveryDrivers`;
- catálogo/cardápio: `ingredients`, `ingredientUnits`, `preparations`, `products`, `menuCategories`, `menuItems`;
- avaliações: `reviews`.

Tipos, semântica, ordenação, valores padrão e tenant permanecem iguais. Não truncar histórico, mudar campos aninhados ou omitir dado sem contrato compatível aprovado.

## Errors

- Tenant ausente: 400; token inválido: 401; sem acesso: 403; tenant inexistente: 404.
- Não introduzir 500/504 nem expor detalhe sensível.

## Observability

- Telemetria apenas em logs/cabeçalhos técnicos opcionais; o corpo não muda.
- `X-Request-Id` correlaciona navegador e logs sem identificar usuário.

## Contract tests

- Fixar chaves top-level e campos usados pelo frontend.
- Validar admin/staff, super-admin e negação cross-tenant.
- Validar permissões idênticas com reutilização de contexto.
- Comparar serialização semântica em fixture representativa.
- Validar eliminação de chamadas duplicadas sem reduzir autorização.
