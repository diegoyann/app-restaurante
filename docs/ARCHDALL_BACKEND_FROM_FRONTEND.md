# ARCHDALL Backend a partir do Front-end Mock

## 1. Objetivo

Este documento transforma as regras de negócio hoje implementadas no front-end mock em um contrato técnico suficiente para outro agente ou time implementar o back-end sem depender do JSX como fonte primária.

Fonte analisada:

- `front-end/app/mock/src/App.jsx`
- `front-end/app/mock/src/pages/LoginPage.jsx`
- `front-end/app/mock/src/pages/TenantApp.jsx`
- `front-end/app/mock/src/features/menu/menuModel.js`
- `front-end/app/mock/src/features/menu/MenuComponents.jsx`
- `front-end/app/mock/src/features/reviews/reviewModel.js`
- `front-end/app/mock/src/features/reviews/ReviewManagement.jsx`
- `front-end/app/mock/src/features/settings/AiBehaviorSettings.jsx`

## 2. Leitura Honesta

O front já codifica bastante regra real, mas ainda mistura:

- dado mestre
- cálculo financeiro
- estados de workflow
- UX de tela
- e decisões de domínio

num único mock de React.

Isso é útil para descobrir o domínio, mas ruim como base direta de implementação. Se o backend copiar isso sem curadoria, nasce acoplado a erro de mock.

Por isso este documento separa:

- `Verdade implementada no front`
- `Regra recomendada para o backend`
- `Lacunas e contradições que precisam de decisão`

## 3. Visão do Produto

O sistema é um SaaS de gestão operacional para restaurante/esfiharia com estes módulos:

1. Autenticação e resolução de tenant
2. Dashboard operacional
3. Financeiro
4. RH e folha
5. Catálogo técnico de insumos, preparações e produtos
6. Cardápio comercial
7. Gestão de avaliações com IA
8. Configurações gerais
9. Configurações de comportamento da IA

## 4. Multi-tenant e autenticação

### 4.1 Verdade implementada no front

Rotas:

- `/`
- `/login`
- `/app`
- `/app/:tenant`

Regras observadas:

- O login mock resolve um `tenantSlug` a partir de `email + password`.
- Após login, o slug é salvo em `sessionStorage` na chave `tenantSlug`.
- A rota `/app` depende desse slug salvo em sessão.
- A rota `/app/:tenant` permite acesso por slug direto na URL.
- Se não existir tenant em URL nem sessão, o usuário é redirecionado para `/login`.

Contas mock:

- `rei@reidasesfihas.com` / `admin` -> tenant `reidasesfihas`
- `demo@gestaofood.com.br` / `demo` -> tenant `demo`
- `admin@express.com` / `admin` -> tenant `esfiharia-express`

### 4.2 Contrato recomendado para backend

Entidades:

- `Tenant`
- `User`
- `UserTenantAccess`
- `Session` ou JWT com `tenant_id`

Regras:

- Usuário pode pertencer a um ou mais tenants.
- Login deve retornar:
  - token
  - user
  - tenant padrão
  - lista de tenants acessíveis se houver mais de um
- Não usar senha de tenant em `settings.appPassword` como senha de autenticação do sistema.

Endpoints sugeridos:

```http
POST /auth/login
GET /auth/me
POST /auth/logout
GET /tenants/current
GET /tenants
```

Payload sugerido de login:

```json
{
  "email": "rei@reidasesfihas.com",
  "password": "admin"
}
```

Resposta:

```json
{
  "token": "jwt-ou-session-token",
  "user": {
    "id": "usr_123",
    "name": "Administrador",
    "email": "rei@reidasesfihas.com"
  },
  "currentTenant": {
    "id": "ten_123",
    "slug": "reidasesfihas",
    "name": "Rei das Esfihas"
  },
  "availableTenants": [
    {
      "id": "ten_123",
      "slug": "reidasesfihas",
      "name": "Rei das Esfihas"
    }
  ]
}
```

## 5. Configurações gerais

### 5.1 Estrutura observada

```json
{
  "ifoodTax": 23,
  "anotaaiTax": 5,
  "appPassword": "admin",
  "passwordReminder": "A senha padrão é \"admin\".",
  "businessName": "Rei das Esfihas",
  "alertDaysBefore": 3
}
```

### 5.2 Regras observadas

- `ifoodTax` e `anotaaiTax` são percentuais de taxa por canal.
- `alertDaysBefore` define quantos dias antes do vencimento um custo fixo deve disparar alerta.
- Ao salvar nova senha:
  - mínimo de 4 caracteres
  - confirmação obrigatoriamente igual
- O front hoje mistura:
  - configuração operacional (`businessName`, taxas, alertas)
  - configuração sensível de senha

### 5.3 Recomendação

Separar em backend:

- `tenant_settings`
- `security_settings`

Não salvar senha operacional em claro. Isso no mock é erro, não modelo.

Endpoints sugeridos:

```http
GET /settings/general
PUT /settings/general
PUT /settings/security/password
```

## 6. Configurações de IA

### 6.1 Estrutura observada

```json
{
  "positiveTone": "friendly",
  "crisisStrategy": "whatsapp",
  "additionalInstructions": "",
  "autoPublishPositive": true
}
```

Enums observados:

- `positiveTone`: `friendly`, `formal`, `modern`
- `crisisStrategy`: `whatsapp`, `email`

### 6.2 Regras observadas

- `additionalInstructions` deve ter no máximo 150 caracteres.
- `autoPublishPositive = true` significa publicação automática para avaliações positivas.
- Estratégia de crise é usada para avaliações de 1 a 3 estrelas.

### 6.3 Recomendação backend

Endpoints:

```http
GET /settings/ai-behavior
PUT /settings/ai-behavior
```

Validações:

- `positiveTone` em enum fechado
- `crisisStrategy` em enum fechado
- `additionalInstructions.length <= 150`
- `autoPublishPositive` boolean

## 7. Cadastros mestres parametrizáveis

O sistema permite editar listas de apoio. Isso exige tabelas próprias, não arrays soltos.

### 7.1 Listas observadas

- Categorias de custo fixo
- Cargos de RH
- Categorias de desconto
- Unidades de medida
- Canais de venda
- Categorias financeiras de despesa
- Categorias do cardápio

### 7.2 Seeds observados

Categorias de custo:

- Aluguel
- Energia Elétrica
- Água
- Internet
- Contador

Cargos:

- Esfiharia
- Atendimento
- Pizzaiolo
- Gerência

Categorias de desconto:

- Falta
- Atraso
- Adiantamento
- Outros

Unidades:

- g
- ml
- un
- kg

Canais:

- ifood
- anotaai

Categorias financeiras:

- Compra de Insumos
- Fornecedor
- Manutenção
- Marketing
- Imposto
- Retirada
- Outras Saídas

Categorias de cardápio:

- Esfiha
- Pizza
- Lanche
- Combo
- Bebida
- Sobremesa

### 7.3 Regra importante

No mock, quase tudo pode ser excluído. No backend isso precisa de integridade referencial:

- unidade não pode ser removida se houver insumo usando
- categoria de cardápio renomeada deve refletir nos itens
- categoria de cardápio removida deixa item sem categoria
- cargo removido não pode quebrar funcionários existentes

Backend sério deve decidir:

- bloquear exclusão em uso
- ou permitir exclusão com migração controlada

## 8. Módulo Financeiro

## 8.1 Entidade `Transaction`

Estrutura observada:

```json
{
  "id": 1,
  "date": "2024-04-09",
  "platform": "ifood",
  "payment": "online",
  "amount": 1200.0,
  "tax": 23,
  "net": 924.0,
  "type": "receita",
  "category": "ifood",
  "note": "Pedidos iFood"
}
```

Tipos observados:

- `receita`
- `despesa`
- `custo_fixo` no form, mas isso não vira `transaction`; vira `recurring_cost`

### 8.2 Regras de lançamento

#### Receita

- `platform` recebe o canal selecionado
- `tax` é resolvida por canal:
  - `ifood` -> `settings.ifoodTax`
  - `anotaai` -> `settings.anotaaiTax`
  - outros -> `0`
- `net = amount * (1 - tax/100)`
- `category` recebe o mesmo valor de `reference`

#### Despesa

- `platform = "despesa"`
- `tax = 0`
- `net = -amount`
- `category` recebe categoria financeira

#### Custo fixo

Não cria transação normal. Cria registro recorrente:

```json
{
  "id": 1,
  "desc": "Aluguel",
  "amount": 3000,
  "dueDay": 10,
  "lastPaidMonth": ""
}
```

### 8.3 Regras de validação

- `amount > 0`
- `type = custo_fixo` exige `reference` não vazio
- `dueDay` padrão cai para `1` se inválido
- para receita/despesa o form pode resetar para `receita` após submit

### 8.4 Endpoints sugeridos

```http
GET /finance/transactions
POST /finance/transactions
PUT /finance/transactions/:id
DELETE /finance/transactions/:id

GET /finance/recurring-costs
POST /finance/recurring-costs
PUT /finance/recurring-costs/:id
POST /finance/recurring-costs/:id/toggle-payment
```

### 8.5 Observação crítica

O front calcula `net` no cliente. Isso é aceitável para preview e péssimo para fonte oficial. O backend deve recalcular sempre.

## 9. Alertas de custos fixos

### 9.1 Regra observada

Um custo fixo entra em alerta se:

- `lastPaidMonth !== currentMonthYear`
- e `dueDay - currentDay === 0`
- ou `0 <= dueDay - currentDay <= alertDaysBefore`
- e o alerta não foi dispensado localmente em `dismissedAlerts`

Ordenação:

1. menor `dueDay`
2. maior `amount`

### 9.2 Implicação de backend

O backend deve ter dois conceitos separados:

- status financeiro do custo recorrente no mês corrente
- estado de notificação/dispensa de alerta por usuário

Tabelas sugeridas:

- `recurring_costs`
- `recurring_cost_payments`
- `user_alert_dismissals`

## 10. Fechamento financeiro

### 10.1 Filtros observados

- `dia`
- `mes`
- `quinzena`
- `intervalo`

### 10.2 Regra do intervalo

#### Dia

- início = fim = data de referência

#### Mês

- início = primeiro dia do mês da referência
- fim = último dia do mês da referência

#### Quinzena

- fim = data de referência
- início = 14 dias antes

#### Intervalo personalizado

- aceita `rangeStart` e `rangeEnd`
- se invertidos, o sistema corrige automaticamente

### 10.3 Composição do extrato

`ledgerEntries` combina:

1. transações filtradas por data
2. custos fixos pagos no período
3. eventos de folha/RH previstos para o período

Tipos de linha:

- `receita`
- `despesa`
- `custo_fixo`
- `folha`

### 10.4 Cálculos observados

- `receitaBruta`: soma de `amount` das receitas
- `receitaLiquida`: soma de `net` das receitas
- `taxasCanais`: soma de `amount - net` nas receitas
- `saidasLancadas`: soma de `amount` nas despesas
- `custosFixos`: soma dos custos recorrentes pagos no período
- `folhaSalarial`: soma dos eventos de folha no período
- `saldoPeriodo = receitaLiquida - saidasLancadas - custosFixos - folhaSalarial`

### 10.5 Endpoints sugeridos

```http
GET /finance/closing?filterType=mes&referenceDate=2026-04-17
GET /finance/ledger?start=2026-04-01&end=2026-04-30
```

## 11. Dashboard

### 11.1 KPIs observados

- Receita bruta
- Receita líquida
- Saídas lançadas
- Custos fixos totais
- Folha salarial
- Taxas de canais
- Saldo operacional
- Saldo final
- CMV médio do catálogo
- Markup médio do catálogo
- Total de pedidos
- Ticket médio

### 11.2 Regras

- `saldoOperacional = receitaLiquida - saidasLancadas`
- `custosFixosTotal = folhaSalarial + soma(recurringCosts.amount)`
- `saldoFinal = saldoOperacional - custosFixosTotal`
- `ticketMedio = receitaBruta / totalOrders`

O gráfico diário:

- usa mock fixo quando `USE_REVENUE_CHART_MOCK = true`
- senão calcula por dia do mês atual

Backend deve ignorar esse hack e sempre retornar dado real.

### 11.3 Endpoints sugeridos

```http
GET /dashboard/summary
GET /dashboard/revenue-daily?month=2026-04
GET /dashboard/revenue-by-channel?month=2026-04
GET /dashboard/orders-by-channel?month=2026-04
GET /dashboard/latest-orders?limit=8
GET /dashboard/alerts
```

## 12. RH e folha

## 12.1 Entidade `Employee`

Há dois tipos:

1. `fixed`
2. `external`

### 12.2 Funcionário fixo

Campos observados:

- `name`
- `phone`
- `email`
- `address`
- `maritalStatus`
- `role`
- `notes`
- `employmentType = fixed`
- `status`
- `salary`
- `admissionDate`
- `discounts[]`

Exemplo de desconto:

```json
{
  "id": 1,
  "category": "Falta",
  "amount": 0
}
```

### 12.3 Trabalhador por fora

Campos observados:

- `name`
- `role`
- `notes`
- `employmentType = external`
- `status`
- `paymentMode`
- `baseAmount`
- `weekday`
- `specificDate`
- `startDate`

`paymentMode` observados:

- `weekly`
- `one_off`

### 12.4 Regras de cadastro

Campos mínimos:

- `name` obrigatório
- `role` obrigatório

Se `fixed`:

- `salary > 0`

Se `external`:

- `baseAmount > 0`
- `weekday` usado quando `paymentMode = weekly`
- `specificDate` usado quando `paymentMode = one_off`

### 12.5 Regras de desconto

- só funcionário fixo possui `discounts`
- valor de desconto não pode ficar negativo
- categoria de desconto é editável
- novo desconto só entra se `amount > 0`

### 12.6 Configuração de folha

Estrutura observada:

```json
{
  "salaryPercentage": 60,
  "salaryBusinessDayOrdinal": 5,
  "advancePercentage": 40,
  "advanceFixedDay": 20,
  "advanceBusinessDayPolicy": "next",
  "holidayDates": []
}
```

### 12.7 Regras de folha

Para funcionário fixo:

- `grossSalary = salary`
- `extraDiscount = soma(discounts.amount)`
- `advanceAmount = grossSalary * advancePercentage/100`
- `grossSalaryPayment = grossSalary * salaryPercentage/100`
- `netSalary = max(grossSalary - extraDiscount, 0)`
- `finalSalaryPayment = max(netSalary - advanceAmount, 0)`

Datas:

- pagamento salário = `N`-ésimo dia útil do mês
- vale = dia fixo, avançando para próximo dia útil se cair em fim de semana/feriado

### 12.8 Alertas de RH

Itens monitorados:

- pagamento 60%
- vale 40%
- pagamentos de trabalhadores externos com próxima data prevista

### 12.9 Endpoints sugeridos

```http
GET /hr/employees
POST /hr/employees
PUT /hr/employees/:id
DELETE /hr/employees/:id

POST /hr/employees/:id/discounts
PUT /hr/employees/:id/discounts/:discountId
DELETE /hr/employees/:id/discounts/:discountId

GET /hr/payroll/config
PUT /hr/payroll/config
GET /hr/payroll/summary?month=2026-04
GET /hr/payroll/alerts
```

## 13. Insumos, preparações e produtos

Esse trecho é o mais importante para não construir um backend medíocre. O front já codifica custo técnico e CMV.

## 13.1 Entidade `Ingredient`

Estrutura:

```json
{
  "id": 1,
  "name": "Farinha",
  "unit": "g",
  "packageQuantity": 5000,
  "packageCost": 22.0
}
```

Regra:

- `unitCost = packageCost / packageQuantity`

Validação:

- `name` obrigatório
- `unit` obrigatório
- `packageQuantity > 0`
- `packageCost > 0`

## 13.2 Entidade `Preparation`

Representa receita base intermediária.

Estrutura:

```json
{
  "id": 1,
  "name": "Carne Moída Temperada",
  "yieldQuantity": 1,
  "yieldUnit": "kg",
  "recipe": [
    {
      "componentType": "ingredient",
      "componentId": 2,
      "quantity": 0.85,
      "quantityUnit": "kg"
    }
  ]
}
```

Regras:

- aceita componentes do tipo `ingredient` ou `preparation`
- unidade deve ser compatível por grupo:
  - peso
  - volume
  - contagem
- existe proteção contra loop recursivo em custo via cache + stack

Métricas:

- `totalCost = soma(custo dos componentes convertidos)`
- `unitCost = totalCost / yieldQuantity`

## 13.3 Entidade `Product`

Estrutura:

```json
{
  "id": 1,
  "name": "Esfiha de Carne",
  "salePrice": 8.0,
  "yieldQuantity": 1,
  "targetCmvPercent": 30,
  "recipe": [
    {
      "componentType": "ingredient",
      "componentId": 1,
      "quantity": 90,
      "quantityUnit": "g"
    }
  ]
}
```

Métricas observadas:

- `recipeCost`
- `unitCost = recipeCost / yieldQuantity`
- `salePrice`
- `targetCmvPercent`
- `cmvPercent = unitCost / salePrice * 100`
- `suggestedPrice = unitCost / (targetCmvPercent / 100)`
- `grossMargin = salePrice - unitCost`
- `marginPercent = grossMargin / salePrice * 100`
- `markupPercent = grossMargin / unitCost * 100`

### 13.4 Regras de conversão de unidade

Definições observadas:

- `g`, `kg` -> grupo `weight`
- `ml`, `l` -> grupo `volume`
- `un` -> grupo `count`

Regra:

- só converte quando `from.group === to.group`
- caso contrário, mantém quantidade original

### 13.5 Recomendação backend

Esse módulo precisa ser service de domínio, não CRUD bobo.

Endpoints sugeridos:

```http
GET /catalog/ingredients
POST /catalog/ingredients
PUT /catalog/ingredients/:id
DELETE /catalog/ingredients/:id

GET /catalog/preparations
POST /catalog/preparations
PUT /catalog/preparations/:id
DELETE /catalog/preparations/:id

GET /catalog/products
POST /catalog/products
PUT /catalog/products/:id
DELETE /catalog/products/:id

GET /catalog/metrics
GET /catalog/products/:id/metrics
GET /catalog/preparations/:id/metrics
```

## 14. Cardápio comercial

O front separa catálogo técnico de cardápio comercial. Isso está certo e o backend deve manter essa separação.

## 14.1 Tipos de item

- `regular`
- `combo`

## 14.2 Item regular

Estrutura observada:

```json
{
  "id": 1,
  "itemType": "regular",
  "name": "Esfiha Premium de Carne",
  "category": "Esfiha",
  "description": "Massa leve...",
  "status": "active",
  "salePrice": 11.9,
  "photoPreview": "",
  "linkedComponents": [
    { "type": "product", "id": 1 },
    { "type": "ingredient", "id": 5 }
  ],
  "comboGroups": [],
  "basePrice": null,
  "createdAt": "2026-04-01T12:00:00.000Z"
}
```

### 14.3 Combo

Estrutura:

```json
{
  "itemType": "combo",
  "name": "Banquete Real",
  "category": "Combo",
  "description": "...",
  "status": "active",
  "salePrice": null,
  "basePrice": 80,
  "comboGroups": [
    {
      "name": "Clássicas",
      "minSelect": 15,
      "maxSelect": 15,
      "options": [
        {
          "name": "Carne",
          "extraPrice": 0,
          "maxQty": 15,
          "isAvailable": true,
          "linkedComponentRef": "product:1"
        }
      ]
    }
  ]
}
```

### 14.4 Status de cardápio

Enums:

- `active` -> Disponível
- `seasonal` -> Destaque da casa
- `draft` -> Em preparação
- `inactive` -> Oculto

### 14.5 Regras de item regular

- `name` obrigatório
- `description` obrigatória
- `salePrice > 0`
- `category` selecionável
- `linkedComponentIds` no form viram `linkedComponents`

### 14.6 Regras de combo

Validação por grupo:

- `group.name` obrigatório
- `maxSelect >= 1`
- `minSelect <= maxSelect`
- grupo precisa ter pelo menos uma opção

Validação por opção:

- `option.name` obrigatório
- `option.maxQty >= 1`
- `option.extraPrice >= 0`

Validação do combo:

- `name` obrigatório
- `description` obrigatória
- `basePrice >= 0`

Regras operacionais:

- grupo pode ser duplicado
- combo precisa preservar ordenação de grupos e opções
- opção pode estar indisponível sem ser removida

### 14.7 Regra importante de vínculo

No formulário de item regular, o front hoje só oferece `product` como opção de vínculo, embora o seed existente contenha `ingredient` e `preparation` em `linkedComponents`.

Isso é contradição do mock.

Backend deve decidir uma dessas linhas:

1. vínculo comercial aceita apenas `product`
2. vínculo aceita `product`, `preparation`, `ingredient`

Hoje o seed e a UI discordam. Não copie a inconsistência.

### 14.8 Endpoints sugeridos

```http
GET /menu/categories
POST /menu/categories
PUT /menu/categories/:id
DELETE /menu/categories/:id

GET /menu/items
POST /menu/items
PUT /menu/items/:id
DELETE /menu/items/:id

GET /menu/items/:id
```

## 15. Gestão de avaliações

## 15.1 Canais observados

- Google
- iFood

## 15.2 Entidade `Review`

Estrutura normalizada:

```json
{
  "id": "g-001",
  "source": "google",
  "sourceReviewId": "google_9865241",
  "companyKey": "rei-centro",
  "companyLabel": "Rei das Esfihas",
  "unitLabel": "Unidade Centro",
  "channelLabel": "Google Business Profile",
  "reviewerName": "Carlos Almeida",
  "reviewerInitials": "C",
  "reviewerLocation": "Centro",
  "rating": 2,
  "sentiment": "negative",
  "status": "pending",
  "resolutionType": null,
  "createdAtLabel": "Há 2 horas",
  "publishedReply": "",
  "tags": ["Atraso", "Comida fria"],
  "comment": "A pizza demorou...",
  "aiSuggestion": "Olá Carlos...",
  "integrationStatus": "connected"
}
```

### 15.3 Regras observadas

- `rating` é limitado entre `1` e `5`
- filas:
  - `pending`
  - `resolved`
- resolução:
  - `published`
  - `ignored`
- filtros:
  - por fila
  - por sentimento
  - por canal
  - por busca textual

Busca textual cobre:

- reviewerName
- comment
- companyLabel
- unitLabel
- tags

### 15.4 Geração de resposta por IA

Função observada:

- `negative` -> pede desculpas + promete revisão + redireciona para WhatsApp
- `positive` -> agradece e reforça padrão
- `neutral` -> reconhece feedback e promete ajuste

### 15.5 Ações observadas

`Publish`:

- muda `status -> resolved`
- `resolutionType -> published`
- `publishedReply = draftReply || aiSuggestion`

`Ignore`:

- muda `status -> resolved`
- `resolutionType -> ignored`
- `publishedReply = ""`

### 15.6 Recomendação backend

Separar:

- `reviews`
- `review_reply_drafts`
- `review_replies`
- `review_sync_jobs`

Endpoints sugeridos:

```http
GET /reviews
GET /reviews/:id
POST /reviews/:id/reply-draft/regenerate
PUT /reviews/:id/reply-draft
POST /reviews/:id/publish
POST /reviews/:id/ignore
POST /reviews/sync/google
POST /reviews/sync/ifood
```

## 16. Alertas unificados

O front monta um topo de alertas combinando:

- custos fixos próximos do vencimento
- folha
- pagamentos por fora

Ordenação final:

- maior `amount` primeiro

Isso sugere um endpoint de alertas consolidados:

```http
GET /alerts/unified
```

Resposta sugerida:

```json
[
  {
    "id": "cost-1",
    "type": "cost_due",
    "title": "Vencimento",
    "label": "Aluguel (DIA 10)",
    "amount": 3000,
    "targetTab": "financeiro"
  }
]
```

## 17. Modelo de dados recomendado

## 17.1 Núcleo multi-tenant

- `tenants`
- `users`
- `user_tenant_access`
- `sessions` ou JWT

## 17.2 Configuração

- `tenant_settings`
- `tenant_ai_behavior_settings`
- `tenant_security_settings`

## 17.3 Financeiro

- `sales_channels`
- `expense_categories`
- `transactions`
- `recurring_costs`
- `recurring_cost_payments`
- `alert_dismissals`

## 17.4 RH

- `employee_roles`
- `discount_categories`
- `employees`
- `employee_discounts`
- `payroll_configs`
- `payroll_events`

## 17.5 Catálogo técnico

- `measurement_units`
- `ingredients`
- `preparations`
- `preparation_recipe_items`
- `products`
- `product_recipe_items`

## 17.6 Cardápio

- `menu_categories`
- `menu_items`
- `menu_item_links`
- `combo_groups`
- `combo_options`

## 17.7 Avaliações

- `review_sources`
- `reviews`
- `review_reply_drafts`
- `review_publications`
- `review_sync_logs`

## 18. Regras que o backend deve assumir como obrigatórias

1. Todo registro é tenant-scoped.
2. Cálculo de taxa líquida deve ser recalculado no backend.
3. Cálculo de folha deve ser recalculado no backend.
4. Cálculo de CMV, margem e markup deve ser recalculado no backend.
5. Datas de pagamento e fechamento devem ser calculadas no backend.
6. Exclusão de entidades referenciadas não pode ser ingênua.
7. Campos numéricos monetários devem usar decimal, não float binário.
8. Senha nunca pode ser persistida como no mock.

## 19. Inconsistências e pontos fracos do mock

Esses pontos precisam de decisão antes de backend definitivo:

1. `settings.appPassword` parece senha do sistema, mas isso conflita com autenticação real por usuário.
2. Item regular do menu já nasce com `linkedComponents` contendo `ingredient` e `preparation`, mas a UI de edição hoje só vincula `product`.
3. O front mistura previsão de folha com extrato realizado. Backend precisa decidir se `closing` é regime caixa previsto ou realizado.
4. Trabalhador externo usa `startDate`, mas o front não aplica esse campo em cálculo.
5. `advanceBusinessDayPolicy` existe no estado, mas o cálculo implementado só empurra para o próximo dia útil.
6. `costCategories` existem, mas `recurringCosts` não armazenam referência por `categoryId`; só texto em `desc`.
7. `createdAtLabel` em reviews é textual, não data real.
8. O dashboard usa mock fixo para gráfico diário quando flag está ativa. Isso não pode virar contrato de API.

## 20. Ordem recomendada de implementação do backend

1. Autenticação + tenant scope
2. Configurações gerais e cadastros mestres
3. Financeiro transacional
4. RH e folha
5. Catálogo técnico com engine de custos
6. Cardápio comercial
7. Dashboard agregado
8. Avaliações + IA + integrações

## 21. Checklist mínimo para outro agente implementar

Antes de codar, o agente deve conseguir responder:

1. Qual entidade pertence a tenant e qual é global?
2. Quais enums são fechados e quais listas são parametrizáveis?
3. Quais cálculos devem ser idempotentes no servidor?
4. Onde existe previsão e onde existe fato consumado?
5. Quais exclusões precisam de bloqueio por referência?
6. Quais telas do front ainda estão mentindo ou incompletas?

Se não conseguir responder isso, não está pronto para subir o backend.

## 22. Resultado esperado

Um backend aceitável para este front precisa entregar:

- autenticação multi-tenant
- CRUDs de domínio com integridade real
- cálculo determinístico de financeiro, folha e catálogo
- endpoints agregados para dashboard e alertas
- estrutura para reviews e IA com aprovação humana

Qualquer coisa abaixo disso é backend de fachada para mock bonito.
