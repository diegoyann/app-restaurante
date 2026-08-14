# Research: Separar Pedidos Cancelados

## Decision: Filtrar no frontend a coleção já carregada

**Rationale**: `loadOrders` retorna todos os pedidos do tenant, o que é necessário para métricas e histórico. A tela também recebe todos os pedidos via refresh após cada mutação. A falha está na renderização direta de `data.orders`, portanto duas coleções derivadas, por competência e status, corrigem tanto a atualização imediata como o refresh.

**Alternatives considered**:

- Filtrar a query de carregamento para ativos: rejeitado porque o Histórico precisa dos cancelados e outros consumidores podem precisar da coleção completa.
- Esconder o card com CSS: rejeitado porque preserva o pedido na lista operacional e não cria histórico filtrado.

## Decision: Competência por `orderDate.slice(0, 7)`

**Rationale**: A entidade já expõe `orderDate` em formato de data e a tela usa campos de competência no padrão `YYYY-MM`; a comparação é determinística e independente do fuso horário.

**Alternatives considered**:

- Usar data de cancelamento: rejeitado pois o requisito pede pedidos da competência do pedido, não do momento de cancelamento.

## Decision: Preservar domínio, API e banco

**Rationale**: O cancelamento já atualiza o status para `CANCELLED`, guarda motivo/data, sincroniza obrigação, audita e é relido pelo refresh. A correção de lista não deve alterar essas garantias críticas.

**Alternatives considered**:

- Nova rota ou migração: rejeitado por não haver necessidade de persistência ou contrato novo.
