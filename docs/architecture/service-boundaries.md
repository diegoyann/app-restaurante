# Arquitetura alvo - Rei das Esfihas

## Diagnostico direto

A aplicacao ainda nao deve virar varios processos independentes de uma vez. O motivo e simples: o back-end ainda tem um repositório central (`back-end/src/repositories/appRepository.js`) segurando regras, consultas, mapeamentos e efeitos colaterais de quase todos os dominios.

Separar isso em microservicos agora, sem antes separar fronteiras de dominio, so distribuiria o acoplamento. Ficaria mais caro de debugar, mais dificil de testar e mais fragil para operar.

O caminho correto e:

1. Modularizar o monolito por dominio.
2. Isolar contratos de entrada e saida.
3. Separar dados e eventos por dominio.
4. Extrair microservicos apenas quando houver motivo operacional real.

## Estrutura atual recomendada

```text
front-end/
  app/mock/                  # Aplicacao web React

chrome-extension/            # Extensao Chrome para pedidos

back-end/
  api/                       # Entrada HTTP unificada
  api-handlers/              # Adaptadores HTTP por rota
  src/
    auth/                    # Identidade, roles e permissoes
    lib/                     # Infra compartilhada
    modules/                 # Fronteiras de dominio
    repositories/            # Persistencia legado centralizada
    services/                # Servicos tecnicos e calculos

supabase/
  migrations/                # Schema unico atual
```

## Modulos de dominio criados

| Modulo | Responsabilidade | Hoje usa | Candidato a microservico? |
| --- | --- | --- | --- |
| `admin` | empresas, lojas, usuarios e perfis administrativos | Supabase + `appRepository` | Sim, mas nao primeiro |
| `auth` | sessao e permissoes efetivas | Supabase Auth + permissoes | Nao; manter como shared identity/gateway |
| `app` | bootstrap autenticado da loja | agregacao de varios dominios | Nao; deve virar API composition |
| `public` | cardapio publico e pedido publico | menu + cliente + pedido | Sim, como edge/public API |
| `orders` | pedidos internos, status, itens | clientes, pagamento, financeiro | Sim, prioridade alta |
| `delivery` | motoboys e expedicao | pedidos + financeiro | Sim, depois de orders |
| `finance` | formas de pagamento, transacoes, custos e fechamento | pedidos + entrega + folha | Sim, mas exige eventos |
| `catalog` | insumos, preparacoes, produtos e unidades | CMV/receita | Sim, depois de estabilizar estoque |
| `menu` | categorias e itens vendidos | catalogo | Talvez; pode ficar junto de catalogo no inicio |
| `customers` | cadastro e endereco de clientes | pedidos/public | Talvez; extrair quando houver CRM real |
| `hr` | funcionarios e folha simples | financeiro | Baixa prioridade |
| `settings` | configuracoes da loja e IA | varios dominios | Nao; manter como config service leve |
| `integrations` | iFood e canais externos | pedidos + financeiro | Sim, bom candidato |
| `tenant` | permissoes por loja | auth/admin | Nao isolado agora |

## Contratos entre dominios

### Pedido criado

Produtor: `orders` ou `public`

Consumidores:

- `finance`: cria receita automatica.
- `delivery`: entra na fila quando aplicavel.
- `integrations`: associa origem externa quando existir.

Evento futuro:

```json
{
  "type": "order.created",
  "tenantSlug": "loja-centro",
  "orderId": "uuid",
  "orderNumber": "WEB-2205-12345",
  "channel": "proprio",
  "total": 89.9,
  "paymentMethodId": "uuid",
  "occurredAt": "2026-05-22T10:00:00.000Z"
}
```

### Pedido entregue

Produtor: `orders` ou `delivery`

Consumidores:

- `finance`: consolida receita/custo de entrega.
- `analytics`: calcula tempo e desempenho.

Evento futuro:

```json
{
  "type": "order.delivered",
  "tenantSlug": "loja-centro",
  "orderId": "uuid",
  "driverId": "uuid",
  "deliveryCost": 8,
  "deliveredAt": "2026-05-22T10:40:00.000Z"
}
```

### Pedido importado de canal externo

Produtor: `integrations`

Consumidores:

- `orders`: cria/atualiza pedido idempotente.
- `finance`: registra taxa de plataforma.

Evento futuro:

```json
{
  "type": "external-order.imported",
  "tenantSlug": "loja-centro",
  "source": "ifood",
  "externalId": "ifood-123",
  "grossAmount": 100,
  "platformFee": 12
}
```

## Ordem correta de extracao

### Fase 1 - Monolito modular

Status: em andamento.

Objetivo:

- handlers importam `src/modules/*`, nao `appRepository.js`;
- cada modulo passa a ter seus proprios services/repositories;
- `appRepository.js` vira legado temporario.

Saida esperada:

- nenhum handler HTTP importando repositório global;
- testes de contrato por modulo;
- menos efeito colateral escondido.

Progresso atual:

- `orders`: `saveOrder` e `deleteOrderById` extraidos para `src/modules/orders/repository.js`.
- `finance`: transacoes, formas de pagamento, custos recorrentes e fechamento extraidos para `src/modules/finance/repository.js`.
- `integrations`: importacao de pedidos iFood extraida para `src/modules/integrations/ifoodOrdersService.js`.
- `shared`: helpers de banco e mappers compartilhados criados em `src/modules/shared`.
- `app/bootstrap`: `getTenantBootstrap` separado em read model e projections por dominio em `src/modules/app/projections`.

Pendencia honesta:

- `appRepository.js` ainda existe para funcoes legadas de escrita e compatibilidade, mas `getTenantBootstrap` agora delega para `src/modules/app/tenantBootstrapReadModel.js`.
- O bootstrap continua sendo um ponto de composicao da tela. Isso e correto por enquanto; futuramente pode virar uma API composition layer separada.

### Fase 2 - Eventos internos

Objetivo:

- criar uma camada de eventos internos no proprio processo;
- substituir chamadas cruzadas diretas por eventos onde fizer sentido;
- manter transacao sincronica onde consistencia imediata for obrigatoria.

Saida esperada:

- `orders` nao chama financeiro diretamente;
- financeiro reage a `order.delivered`;
- integracoes publicam eventos idempotentes.

### Fase 3 - Banco por fronteira logica

Objetivo:

- ainda pode ser o mesmo Supabase fisico;
- tabelas e migrations passam a ser agrupadas por dominio;
- cada modulo acessa apenas as tabelas que possui.

Regra dura:

- `finance` nao atualiza tabela de `orders`;
- `orders` nao escreve tabela financeira;
- leitura agregada fica em projection/bootstrap.

### Fase 4 - Extracao real

Extrair nesta ordem:

1. `integrations-service`: iFood/webhooks/importacao. Motivo: falhas externas, retry e idempotencia.
2. `orders-service`: pedido, status e itens. Motivo: coracao operacional.
3. `finance-service`: fechamentos e lancamentos. Motivo: regras financeiras e auditoria.
4. `delivery-service`: expedicao e motoboys. Motivo: escala operacional.

Nao extrair primeiro:

- `auth`: centralize identidade; espalhar auth cedo e pedir para sofrer.
- `settings`: baixo valor de separacao.
- `customers`: so vale quando virar CRM de verdade.

## Regra para aceitar um microservico

Um modulo so vira microservico quando cumprir pelo menos 3 destes 5 criterios:

- escala diferente do resto da aplicacao;
- deploy independente reduz risco real;
- falha dele nao pode derrubar o caixa/pedido;
- dono tecnico ou ciclo de evolucao diferente;
- contrato de dados esta estavel e testado.

Se nao cumprir, fica como modulo no monolito. Microservico sem necessidade e vaidade tecnica cara.
