# Roadmap - Sistema Unico para Gestao Completa de Restaurantes

**Objetivo:** substituir todos os sistemas atuais (Anota Ai, Foody, planilhas, Tangerino, etc.) por uma unica plataforma integrada.

**Principio:** do pedido ao resultado: operacao -> dinheiro -> controle -> decisao.

**Status avaliado em:** 2026-05-03.

**Criterio usado para marcar checkbox:** marcado apenas quando ha estrutura persistida no Supabase e endpoint/fluxo de aplicacao coerente. Mock, tela isolada, configuracao solta ou dado demonstrativo nao contam como modulo concluido.

---

## Fase 1 - Base do Sistema

**Objetivo:** criar o nucleo e garantir que tudo converse entre si.

**Inclui:**

- [x] Cadastro de lojas
- [x] Usuarios e permissoes
- [x] Cadastro de produtos
- [x] Categorias
- [x] Clientes
- [x] Formas de pagamento
- [x] Estrutura de pedidos
- [x] Estrutura financeira basica
- [x] Multiempresa / multiloja

**Criterio de saida:**

- [x] Base solida para todos os modulos funcionarem juntos

**Observacao dura:** a Fase 1 agora tem fundacao tecnica suficiente. Nao confunda isso com operacao pronta: a criacao real de pedido, caixa, cozinha e impressao ainda pertencem a Fase 2.

---

## Fase 2 - Pedidos Proprios

**Objetivo:** fazer o pedido nascer dentro do sistema e eliminar Anota Ai no canal proprio.

**Inclui:**

- [x] Cardapio digital (link)
- [x] Criacao de pedido
- [x] Endereco do cliente
- [x] Forma de pagamento
- [x] Status do pedido
- [x] Impressao automatica
- [x] Tela do caixa
- [x] Tela da cozinha
- [x] Separacao visual: comida / bebida / observacoes

**Criterio de saida:**

- [x] Pedido do canal proprio roda 100% dentro do sistema sem gambiarra

**Substitui:**

- [x] Anota Ai (canal proprio)

**Observacao dura:** a substituicao tecnica do canal proprio existe. Ainda falta maturar operacao real com loja usando todos os dias, mas o pedido ja nasce no sistema, entra na fila interna, imprime e carrega endereco, pagamento, status e separacao para cozinha.

---

## Fase 3 - Expedicao e Entrega

**Objetivo:** trazer a entrega para dentro do sistema e eliminar Foody.

**Inclui:**

- [x] Fila de pedidos prontos
- [x] Painel de expedicao
- [x] Cadastro de motoboys
- [x] Vinculo pedido -> motoboy
- [x] Status de saida e entrega
- [x] Entrega concluida
- [x] Taxa de entrega
- [x] Controle de maquina/troco
- [x] Calculo por entrega e diaria

**Criterio de saida:**

- [x] Saber quem levou, quando saiu, quando entregou e quanto custa

**Substitui:**

- [x] Foody (expedicao/entrega)

**Observacao dura:** a substituicao tecnica da expedicao existe: pedido pronto entra na fila, recebe motoboy, sai para entrega, conclui, registra custo, diaria, troco e maquina. O proximo risco real e financeiro: esses custos ainda precisam entrar automaticamente no fechamento da Fase 4.

---

## Fase 4 - Fechamento Financeiro Automatico

**Objetivo:** parar de usar planilhas e ter controle financeiro real.

**Inclui:**

- [x] Receita automatica por pedido
- [x] Separacao por forma de pagamento
- [x] Fluxo de entradas e saidas
- [x] Conciliacao diaria
- [x] Fechamento diario
- [x] Fechamento semanal
- [x] Fechamento mensal
- [x] Custos fixos
- [x] Folha simples integrada
- [x] Custos de motoboy integrados as entregas

**Criterio de saida:**

- [x] Fechar o dia dentro do sistema, nao fora dele

**Substitui:**

- [x] Planilhas de controle financeiro

**Observacao dura:** a Fase 4 agora existe de verdade: pedido entregue gera receita automatica, motoboy entra como custo, e o fechamento diario/semanal/mensal fica persistido. Ainda nao e contabilidade completa, mas ja mata a planilha operacional.

---

## Fase 5 - Integracoes Externas

**Objetivo:** transformar o sistema no centro de controle de tudo que vende.

**Inclui:**

- [ ] Integracao com iFood
- [x] Importacao/sincronizacao de pedidos
- [x] Tratamento financeiro desses pedidos
- [x] Taxas da plataforma
- [x] Fechamento unificado (canal proprio + iFood)

**Criterio de saida:**

- [x] Nao fazer dois fechamentos separados

**Substitui:**

- [ ] Consolidacao manual de canais

**Observacao dura:** a base operacional do iFood existe: pedido externo entra idempotente, vira pedido interno, gera receita automatica com taxa da plataforma e cai no fechamento junto com o canal proprio. Ainda nao existe conector oficial com OAuth/webhook/API do iFood; por isso a integracao em si continua aberta.

---

## Fase 6 - Fiscal (NF)

**Objetivo:** formalizar o processo fiscal dentro do sistema.

**Inclui:**

- [ ] Integracao com provedor de NF
- [ ] Emissao automatica por pedido finalizado
- [ ] Status da NF (pendente / emitida / erro)
- [ ] Tratamento de erro e reprocessamento
- [ ] Vinculo NF -> pedido -> financeiro

**Criterio de saida:**

- [ ] Pedido finalizado e fiscalmente tratado sem esforco manual

**Substitui:**

- [ ] Processos fiscais manuais/externos

---

## Fase 7 - Estoque

**Objetivo:** sair do CMV teorico e ter custo real.

**Inclui:**

- [x] Cadastro de insumos
- [x] Receitas vinculadas aos produtos
- [ ] Baixa automatica por venda
- [ ] Ajustes manuais
- [ ] Alertas de estoque
- [ ] Atualizacao de custo em tempo real

**Criterio de saida:**

- [ ] Venda impacta estoque automaticamente

**Substitui:**

- [ ] Controles paralelos de estoque

**Observacao dura:** hoje isso esta mais perto de ficha tecnica/CMV do que de estoque real. Falta quantidade em estoque, movimentacao, ajuste e baixa por venda.

---

## Fase 8 - RH Simples

**Objetivo:** centralizar controle de equipe.

**Inclui:**

- [x] Cadastro de funcionarios
- [x] Salario
- [x] Categoria (registrado / freelance)
- [x] Folha simples
- [ ] Ponto simples
- [ ] Integracao com financeiro

**Criterio de saida:**

- [ ] Custo da equipe entra automaticamente no fechamento

**Substitui:**

- [ ] Tangerino e controles paralelos

---

## Fase 9 - Inteligencia e Automacoes

**Objetivo:** transformar o sistema em ferramenta estrategica.

**Inclui:**

- [ ] Mapa de calor de vendas
- [ ] Ticket medio por regiao
- [ ] Tempo medio de entrega
- [ ] Identificacao de gargalos
- [ ] Automacao de resposta de avaliacoes
- [ ] Alertas inteligentes

**Criterio de saida:**

- [ ] Sistema orienta decisoes e crescimento

**Substitui:**

- [ ] Falta de visao estrategica e analises manuais

---

## Ordem de Substituicao dos Sistemas Atuais

- [ ] Anota Ai (canal proprio)
- [ ] Foody (entrega)
- [ ] Planilhas de fechamento
- [ ] Consolidacao iFood
- [ ] Fiscal manual
- [ ] Tangerino (basico)
- [ ] Controle de estoque paralelo
- [ ] Camada de inteligencia

---

## Principios do Roadmap

- [x] Construir por dependencia real da operacao
- [ ] Cada fase permite desligar um sistema antigo
- [x] Foco em simplificar, nao adicionar sistemas
- [x] Cada modulo gera valor real e se conecta com os demais

**Observacao dura:** o projeto comecou por cadastros e administracao. Isso e necessario, mas a dependencia real agora e pedido. Continuar refinando cadastro antes de pedido e perder tempo bonito.

---

## Resultado Final

- [ ] Pedidos centralizados
- [ ] Entregas controladas
- [ ] Financeiro automatizado
- [ ] Fiscal integrado
- [ ] Estoque automatico
- [x] RH centralizado
- [ ] Inteligencia e decisoes baseadas em dados

Menos tempo gerindo.

Mais tempo vendendo.

Base para escalar e abrir novas lojas.

---

## Evidencias Usadas

- `supabase/migrations/20260420_000001_initial_schema.sql`: tenants, memberships, settings, payroll, financeiro manual, funcionarios, insumos, preparacoes, produtos, cardapio, avaliacoes e auditoria.
- `supabase/migrations/20260430_000002_company_branch_access.sql`: companies, company_id em lojas, codigo/nome de filial e acesso por empresa.
- `supabase/migrations/20260501_000003_phase1_customers_payments_orders.sql`: clientes, formas de pagamento, pedidos e itens de pedido.
- `supabase/migrations/20260503_000004_phase2_order_item_sections.sql`: classificacao persistida dos itens do pedido para cozinha.
- `back-end/api/index.js`: endpoints reais para admin, auth, catalogo, cardapio, financeiro, RH, folha e configuracoes.
- `back-end/src/repositories/appRepository.js`: operacoes persistidas de tenant, usuarios, settings, folha, funcionarios, transacoes, custos recorrentes, clientes, formas de pagamento, pedidos, categorias/itens de menu, unidades, insumos, preparacoes e produtos.
- `back-end/api-handlers/public/menu.js` e `back-end/api-handlers/public/orders.js`: cardapio publico e criacao publica de pedidos do canal proprio.
- `front-end/app/mock/src/pages/PublicMenuPage.jsx`: link publico do cardapio digital.
- `front-end/app/mock/src/features/orders/OrderOperationsPage.jsx`: caixa, cozinha, status e impressao de pedidos.
- `supabase/migrations/202605030005_phase3_delivery_dispatch.sql`: motoboys, status de entrega, horarios de saida/entrega, custo, diaria, troco e maquina.
- `back-end/api-handlers/delivery/drivers.js`: CRUD de motoboys.
- `front-end/app/mock/src/features/orders/OrderOperationsPage.jsx`: painel de expedicao e entrega integrado a fila de pedidos.
- `supabase/migrations/20260512_000008_ifood_order_imports.sql`: identificador externo de pedidos, taxa da plataforma e log de importacao de pedidos externos.
- `back-end/api-handlers/integrations/ifood-orders.js`: endpoint autenticado para importar/sincronizar pedidos iFood.
- `back-end/src/repositories/appRepository.js`: importacao idempotente de pedidos iFood e receita automatica com taxa/liquido no fechamento.
