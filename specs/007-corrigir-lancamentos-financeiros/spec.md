# Feature Specification: Corrigir Lançamentos Financeiros

**Feature Branch**: `codex/007-corrigir-lancamentos-financeiros`

**Created**: 2026-08-17

**Status**: Draft

**Input**: Corrigir exclusivamente a data civil de lançamentos e a exclusão persistente de um lançamento QA/TESTE em Financeiro > Lançamentos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preservar a data escolhida (Priority: P1)

Como usuário financeiro, quero que a data selecionada em um lançamento seja salva e exibida sem mudança de dia para que a competência e o histórico reflitam o evento real.

**Why this priority**: Alterar 14/08 para 15/08 corrompe o registro financeiro, os filtros e a conciliação diária.

**Independent Test**: Criar entradas e saídas selecionando 14/08/2026 e verificar que listagem, recarregamento e dados persistidos permanecem em 14/08/2026.

**Acceptance Scenarios**:

1. **Given** o usuário seleciona 14/08/2026, **When** salva uma entrada, **Then** o lançamento é salvo e exibido em 14/08/2026.
2. **Given** o usuário seleciona 14/08/2026, **When** salva uma saída, **Then** o lançamento é salvo e exibido em 14/08/2026.
3. **Given** um lançamento salvo em uma data local, **When** a página é atualizada, **Then** a data exibida continua exatamente igual à escolhida.

---

### User Story 2 - Excluir lançamento definitivamente (Priority: P1)

Como usuário financeiro autorizado, quero excluir um lançamento de QA/TESTE de forma persistente para que ele não reapareça após sincronização ou recarregamento.

**Why this priority**: Um lançamento excluído que retorna torna os dados financeiros não confiáveis e pode contaminar totais.

**Independent Test**: Excluir o lançamento QA/TESTE, atualizar a página e repetir a consulta; o registro não reaparece nem é recriado por sincronização.

**Acceptance Scenarios**:

1. **Given** um lançamento QA/TESTE existente, **When** um usuário autorizado confirma a exclusão, **Then** a fonte persistente deixa de retorná-lo.
2. **Given** o lançamento foi excluído, **When** a tela é recarregada ou sincronizada, **Then** ele continua ausente.
3. **Given** a exclusão é repetida ou a resposta chega atrasada, **When** a tela reconcilia os dados, **Then** o registro não é recriado nem duplicado.
4. **Given** uma falha de exclusão persistente, **When** a operação termina, **Then** a interface informa o erro e não finge sucesso definitivo.

### Edge Cases

- Datas no início/fim do mês, ano e em período com mudança de horário não podem avançar nem retroceder um dia.
- A data escolhida deve ser tratada como data civil da loja, não como instante UTC.
- O lançamento pode vir de fonte manual ou automática; excluir um registro manual não pode disparar sua recriação.
- Se o lançamento tiver uma origem protegida que não pode ser apagada diretamente, a exclusão deve remover ou invalidar de forma persistente a fonte correta sem apagar outros registros.
- Exclusão repetida deve ser idempotente e restrita ao tenant/unidade e ID solicitados.
- Falhas de rede ou autorização não podem deixar a interface divergente do estado persistido após recarregamento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST salvar a data civil selecionada pelo usuário exatamente no mesmo dia.
- **FR-002**: O sistema MUST exibir a data persistida sem conversão que avance ou retroceda o calendário.
- **FR-003**: Entradas e saídas MUST obedecer à mesma regra de data local.
- **FR-004**: Recarregar, filtrar ou sincronizar MUST preservar a data original do lançamento.
- **FR-005**: O sistema MUST excluir persistentemente o lançamento selecionado quando o usuário autorizado confirmar a ação.
- **FR-006**: Após exclusão bem-sucedida, consultas e recarregamentos MUST NOT retornar o lançamento excluído.
- **FR-007**: A exclusão MUST atingir a fonte persistente correta e MUST NOT ser apenas uma remoção do estado visual.
- **FR-008**: Sincronizações, projeções ou dados de bootstrap MUST NOT recriar um lançamento manual excluído.
- **FR-009**: A exclusão MUST ser idempotente e limitada ao ID e ao tenant/unidade autorizados.
- **FR-010**: Falhas de persistência ou autorização MUST ser informadas ao usuário e a tela MUST reconciliar com o estado real.
- **FR-011**: A correção MUST preservar os demais lançamentos, totais, categorias, origens financeiras e regras de outras telas.
- **FR-012**: Testes de regressão MUST reproduzir o avanço de data e o reaparecimento após exclusão antes das correções.

### Key Entities

- **Lançamento financeiro**: Registro individual com ID, tenant/unidade, data civil, tipo, valor, origem, categoria e fonte.
- **Data civil da loja**: Dia de calendário escolhido pelo usuário, independente de conversão de fuso horário.
- **Origem do lançamento**: Fonte manual ou automática responsável por persistir ou regenerar o registro.
- **Exclusão persistente**: Estado em que o registro e sua fonte aplicável não voltam a alimentar a listagem.

## Risk, Boundaries, and Non-Functional Requirements *(mandatory)*

- **Affected boundaries**: Tela de Lançamentos, serviço/API de criação e exclusão e persistência correspondente. Outras telas e regras financeiras permanecem inalteradas.
- **Authorization and tenant scope**: Criação e exclusão MUST validar sessão e tenant no servidor; um tenant não pode alterar registros de outro.
- **Data integrity and retry behavior**: Datas históricas e demais lançamentos MUST permanecer inalterados. Exclusão repetida deve convergir para ausência sem criar duplicatas.
- **Failure and recovery behavior**: Em falha, a interface deve exibir o erro e recarregar o estado persistido. Rollback deve reverter código; qualquer ajuste de dados precisa ser pontual, auditável e não destrutivo para registros alheios.
- **Performance, accessibility, or observability requirement**: A correção não deve adicionar chamadas recorrentes desnecessárias. Erros de salvar/excluir devem ser diagnosticáveis sem expor dados sensíveis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das entradas e saídas testadas mantêm a mesma data civil selecionada após salvar e recarregar.
- **SC-002**: O caso 14/08/2026 permanece 14/08/2026 em formulário, persistência e listagem.
- **SC-003**: 100% dos lançamentos excluídos com sucesso permanecem ausentes após recarregamento e nova sincronização.
- **SC-004**: Repetir a exclusão não recria o registro nem altera outros lançamentos.
- **SC-005**: Todos os testes existentes das áreas financeiras afetadas continuam passando sem mudança em outras telas.

## Assumptions

- O campo de data representa somente um dia de calendário da loja, sem horário.
- A loja usa o fuso local configurado pela aplicação; datas civis não devem ser convertidas para UTC para exibição.
- O lançamento QA/TESTE é identificável pelo ID retornado à tela; não será feita exclusão ampla baseada apenas no texto.
- Se a origem for automática, a causa de recriação será corrigida sem desativar sincronizações legítimas de outros registros.
