# Feature Specification: Separar Folha Extra por Grupo

**Feature Branch**: `codex/006-separar-folha-extra`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Separar a Folha Extra de Contas a Pagar em agrupamentos de Cozinha e Motoboy, com vencimentos e exportacoes proprios, preservando obrigacoes individuais e todas as demais regras de RH e Financeiro.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar compromissos separados (Priority: P1)

Como responsavel financeiro, quero visualizar a folha extra de cozinha e a folha extra de motoboy em agrupamentos distintos para saber imediatamente quanto pagar a cada grupo e em qual data.

**Why this priority**: A separacao visual e de vencimentos e o objetivo central e evita que compromissos com datas diferentes aparecam como se fossem um unico pagamento.

**Independent Test**: Em uma semana com extras de cozinha e motoboy, abrir Financeiro > Contas a Pagar e constatar dois cards independentes com o mesmo periodo semanal, vencimentos corretos e totais exclusivos de cada grupo.

**Acceptance Scenarios**:

1. **Given** uma semana de segunda-feira a domingo com extras de cozinha, **When** o responsavel abre Contas a Pagar, **Then** ve o card `FOLHA EXTRA — COZINHA` com periodo, vencimento na segunda-feira seguinte, previsto, pago, aberto e status.
2. **Given** a mesma semana com extras de motoboy, **When** o responsavel abre Contas a Pagar, **Then** ve o card `FOLHA EXTRA — MOTOBOY` com periodo, vencimento na quinta-feira seguinte, previsto, pago, aberto e status.
3. **Given** a semana de 10/08/2026 a 16/08/2026, **When** os cards sao exibidos, **Then** cozinha vence em 17/08/2026 e motoboy vence em 20/08/2026.
4. **Given** uma semana com apenas um dos grupos, **When** o responsavel abre Contas a Pagar, **Then** nao ha mistura de funcionarios ou valores entre grupos.

---

### User Story 2 - Gerenciar obrigacoes individuais (Priority: P1)

Como responsavel financeiro, quero expandir cada agrupamento e gerenciar cada funcionario individualmente sem perder a composicao especifica de cozinha ou motoboy.

**Why this priority**: O agrupamento e apenas visual; pagar ou gerenciar uma pessoa errada compromete folha, historico e conciliacao financeira.

**Independent Test**: Expandir os dois cards de uma mesma semana e validar que cada linha pertence ao grupo correto, conserva sua obrigacao individual e apresenta composicao, saldos, status e acao adequados.

**Acceptance Scenarios**:

1. **Given** extras classificados como cozinha e motoboy no mesmo periodo, **When** o card de cozinha e expandido, **Then** aparecem somente extras de cozinha com funcionario, dias trabalhados, tipos e quantidades de diaria, valor total, pago, aberto, status e acao Gerenciar/Pagar.
2. **Given** extras classificados como cozinha e motoboy no mesmo periodo, **When** o card de motoboy e expandido, **Then** aparecem somente motoboys com funcionario, dias trabalhados, valor das diarias, taxas de entrega, total previsto, pago, aberto, status e acao Gerenciar/Pagar.
3. **Given** um motoboy com diarias, taxas de entrega e refeicao, **When** seus valores sao apresentados, **Then** o total devido ao funcionario corresponde a diarias mais taxas de entrega e exclui a refeicao.
4. **Given** pagamentos parciais ou totais de funcionarios distintos, **When** os agrupamentos sao recalculados, **Then** previsto, pago, aberto e status refletem a soma das obrigacoes individuais sem criar uma obrigacao coletiva.

---

### User Story 3 - Exportar cada grupo separadamente (Priority: P2)

Como responsavel financeiro, quero exportar planilhas separadas de cozinha e motoboy para compartilhar e conferir apenas os dados pertinentes a cada grupo.

**Why this priority**: A exportacao deve preservar a mesma separacao operacional vista na tela e evitar mistura de categorias.

**Independent Test**: Exportar cozinha e motoboy para a mesma semana e verificar que cada arquivo contem apenas seus funcionarios, colunas e valores esperados.

**Acceptance Scenarios**:

1. **Given** um card de cozinha com funcionarios, **When** `EXPORTAR EXCEL — COZINHA` e acionado, **Then** o arquivo contem somente cozinha e inclui funcionario, periodo, dias, tipos de diaria, valores, total, pago, aberto e status.
2. **Given** um card de motoboy com funcionarios, **When** `EXPORTAR EXCEL — MOTOBOY` e acionado, **Then** o arquivo contem somente motoboys e inclui funcionario, periodo, dias, diarias, taxas de entrega, total, pago, aberto e status.

### Edge Cases

- Uma semana possui extras apenas de cozinha ou apenas de motoboy.
- Um funcionario nao possui classificacao valida para cozinha nem motoboy; ele nao pode ser silenciosamente incluido no grupo errado.
- Uma obrigacao esta parcialmente paga, totalmente paga ou em aberto, exigindo agregacao coerente de valores e status.
- Um motoboy possui refeicao registrada junto a diarias e taxas; a refeicao permanece separada e fora do total pago ao funcionario.
- A semana cruza mes ou ano; o periodo continua de segunda-feira a domingo e os vencimentos permanecem na segunda e quinta seguintes.
- O usuario repete a abertura da tela ou a exportacao; nenhuma nova obrigacao financeira pode ser criada por essas operacoes de consulta.
- Dados historicos ja pagos devem manter valores, vinculos individuais e rastreabilidade.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST substituir a apresentacao unica de Folha Extra por dois agrupamentos visuais independentes: `FOLHA EXTRA — COZINHA` e `FOLHA EXTRA — MOTOBOY`.
- **FR-002**: Ambos os agrupamentos MUST usar periodo semanal de segunda-feira a domingo.
- **FR-003**: O vencimento de cozinha MUST ser a segunda-feira imediatamente posterior ao domingo de encerramento do periodo.
- **FR-004**: O vencimento de motoboy MUST ser a quinta-feira imediatamente posterior ao domingo de encerramento do periodo.
- **FR-005**: Cada card MUST exibir periodo, vencimento, previsto, pago, aberto e status calculados exclusivamente a partir das obrigacoes individuais de seu grupo.
- **FR-006**: O detalhamento de cozinha MUST conter somente funcionarios extras classificados como cozinha e exibir funcionario, dias trabalhados, tipos de diaria, quantidade de diarias, valor total, pago, aberto, status e acao Gerenciar/Pagar.
- **FR-007**: O detalhamento de motoboy MUST conter somente funcionarios extras classificados como motoboy e exibir funcionario, dias trabalhados, valor das diarias, taxas de entrega, total previsto, pago, aberto, status e acao Gerenciar/Pagar.
- **FR-008**: O total previsto de cada motoboy MUST corresponder a diarias mais taxas de entrega, sem incluir refeicao no valor pago ao funcionario.
- **FR-009**: O sistema MUST preservar uma obrigacao individual por funcionario e periodo; os cards MUST apenas agregar e organizar visualmente essas obrigacoes.
- **FR-010**: Pagamentos e acoes Gerenciar/Pagar MUST continuar atuando sobre a obrigacao individual selecionada, com as autorizacoes financeiras existentes.
- **FR-011**: O sistema MUST disponibilizar `EXPORTAR EXCEL — COZINHA` e `EXPORTAR EXCEL — MOTOBOY` separadamente para o periodo do respectivo card.
- **FR-012**: A exportacao de cozinha MUST conter somente funcionarios de cozinha e as colunas funcionario, periodo, dias, tipos de diaria, valores, total, pago, aberto e status.
- **FR-013**: A exportacao de motoboy MUST conter somente motoboys e as colunas funcionario, periodo, dias, diarias, taxas de entrega, total, pago, aberto e status.
- **FR-014**: Consultar, expandir ou exportar um agrupamento MUST NOT criar, fundir, duplicar ou alterar obrigacoes financeiras.
- **FR-015**: O ajuste MUST NOT alterar outras regras de RH ou Financeiro, incluindo classificacao de funcionarios, calculo de refeicao e historico de pagamentos.
- **FR-016**: Funcionarios sem classificacao reconhecida MUST NOT ser incluidos em cozinha ou motoboy e a situacao MUST permanecer observavel para correcao sem corromper totais.

### Key Entities

- **Periodo semanal**: Intervalo inclusivo de segunda-feira a domingo usado para agrupar obrigacoes individuais.
- **Obrigacao individual de folha extra**: Compromisso financeiro de um funcionario em um periodo, com valores previsto, pago, aberto, status e vencimento aplicavel.
- **Grupo de folha extra**: Visao agregada de cozinha ou motoboy, sem identidade financeira coletiva propria.
- **Composicao de cozinha**: Dias, tipos e quantidades de diaria que formam o total individual de cozinha.
- **Composicao de motoboy**: Dias, diarias e taxas de entrega que formam o total individual de motoboy; refeicao permanece separada.
- **Exportacao de grupo**: Arquivo de conferencia limitado a um grupo e periodo.

## Risk, Boundaries, and Non-Functional Requirements *(mandatory)*

- **Affected boundaries**: Frontend de Contas a Pagar e exportacao; servico/API e regra de dominio somente se necessarios para fornecer classificacao, vencimento ou composicao sem duplicacao. Banco de dados e migracao devem permanecer inalterados salvo evidencia tecnica inevitavel, que exigiria novo gate antes de prosseguir.
- **Authorization and tenant scope**: As permissoes financeiras e o isolamento por unidade/tenant existentes MUST ser preservados em listagem, detalhamento, pagamento e exportacao; nenhum dado de outro escopo pode entrar nos agregados.
- **Data integrity and retry behavior**: A separacao MUST ser derivada das obrigacoes existentes e ser idempotente; recarregar, repetir consultas ou exportar nao pode criar nem alterar registros. Obrigacoes e pagamentos historicos MUST permanecer individualizados e inalterados.
- **Failure and recovery behavior**: Em caso de classificacao ausente ou resposta parcial, o sistema MUST evitar atribuicao ao grupo errado e sinalizar o dado inconsistente. O rollback operacional consiste em reverter a camada de apresentacao/calculo sem migracao destrutiva nem perda de historico.
- **Performance, accessibility, or observability requirement**: A tela com dois grupos MUST manter os padroes atuais de carregamento, navegacao por teclado, leitura de status e feedback de erro. Divergencias de classificacao ou exportacao MUST ser diagnosticaveis sem expor dados sensiveis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das semanas com dados validos, cozinha e motoboy aparecem em agrupamentos distintos, sem funcionario ou valor cruzado entre eles.
- **SC-002**: Para qualquer semana de segunda-feira a domingo, 100% dos vencimentos de cozinha correspondem a segunda-feira seguinte e 100% dos vencimentos de motoboy a quinta-feira seguinte.
- **SC-003**: Em 100% dos detalhamentos e exportacoes, os totais agregados coincidem com a soma das obrigacoes individuais exibidas, respeitando pagamentos parciais e totais.
- **SC-004**: Em 100% dos casos de motoboy, o valor devido ao funcionario inclui diarias e taxas de entrega e exclui refeicao.
- **SC-005**: As duas exportacoes contêm zero funcionarios do grupo oposto e todas as colunas requeridas.
- **SC-006**: O fluxo completo de identificar grupo, vencimento e valor aberto permanece realizavel diretamente na tela principal, sem abrir o detalhamento.
- **SC-007**: Nenhuma operacao de consulta, expansao ou exportacao cria, funde ou altera obrigacoes individuais existentes.

## Assumptions

- A classificacao atual de funcionario extra ja distingue cozinha de motoboy e sera reutilizada como fonte de verdade.
- A semana e calculada no calendario e fuso horario ja adotados pelo Financeiro; inicio e fim sao inclusivos.
- `quinta-feira seguinte` significa a primeira quinta-feira posterior ao domingo que encerra a semana.
- Os conceitos atuais de previsto, pago, aberto e status permanecem inalterados; somente sua agregacao passa a ser exclusiva por grupo.
- A acao Gerenciar/Pagar e as regras de autorizacao existentes permanecem sem mudanca.
- O escopo nao inclui alteracao de schema, retroacao de vencimentos persistidos nem reclassificacao automatica de funcionarios historicos.
