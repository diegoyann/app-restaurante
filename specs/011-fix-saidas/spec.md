# Feature Specification: Restaurar Lançamento de Saídas

**Feature Branch**: `codex/011-fix-saidas`

**Created**: 2026-08-20

**Status**: Draft

**Input**: Corrigir o fluxo Financeiro > Lançamentos, no qual o usuário abre “Lançar saída avulsa”, mas não consegue registrar a saída porque o seletor obrigatório de categoria não apresenta opções.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lançar saída quando não há categorias cadastradas (Priority: P1)

Como usuário financeiro autorizado, quero encontrar categorias padrão ao lançar uma saída em uma unidade sem categorias próprias para conseguir registrar a despesa com valor, data, pagamento e origem corretos.

**Why this priority**: Sem uma categoria selecionável, o fluxo financeiro fica totalmente bloqueado e a despesa real deixa de ser registrada.

**Independent Test**: Carregar uma unidade cuja lista persistida de categorias financeiras está vazia, abrir “Lançar saída avulsa”, selecionar uma categoria padrão, salvar e confirmar que a saída aparece na competência escolhida após recarregar.

**Acceptance Scenarios**:

1. **Given** uma unidade autorizada sem categorias financeiras cadastradas, **When** o usuário abre o formulário de saída, **Then** o seletor apresenta as sete categorias padrão.
2. **Given** o formulário com uma categoria padrão selecionada e os demais campos válidos, **When** o usuário lança a saída, **Then** ela é persistida uma única vez e exibida na competência escolhida.
3. **Given** uma falha ao persistir a saída, **When** a tentativa termina, **Then** a interface informa o erro e não inclui um lançamento apenas visual.

---

### User Story 2 - Preservar categorias próprias (Priority: P1)

Como gestor de uma unidade que já possui categorias financeiras, quero continuar vendo somente o cadastro existente para que a correção não altere minha classificação financeira.

**Why this priority**: Misturar categorias padrão com um cadastro próprio pode fragmentar relatórios e comprometer a consistência histórica.

**Independent Test**: Carregar uma unidade com categorias próprias e verificar que a resposta mantém exatamente essas categorias, sem inserir padrões ou duplicatas.

**Acceptance Scenarios**:

1. **Given** uma unidade com uma ou mais categorias próprias, **When** os dados financeiros são carregados, **Then** o sistema retorna integralmente as categorias cadastradas e não adiciona padrões.
2. **Given** carregamentos repetidos de uma unidade sem categorias, **When** a lista padrão é oferecida, **Then** a quantidade e os nomes permanecem estáveis e nenhum registro persistente é criado por esse carregamento.

### Edge Cases

- Uma lista vazia deve ativar o conjunto padrão; erro de consulta não pode ser disfarçado como lista vazia.
- Nomes padrão devem permanecer únicos e estáveis entre carregamentos.
- A existência de apenas uma categoria própria já impede a mistura automática com as categorias padrão.
- O fallback não pode alterar lançamentos históricos, saldos, competências ou categorias já persistidas.
- Repetir a criação da saída após timeout ou resposta incerta não deve ser feito automaticamente pela interface.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST apresentar categorias de saída selecionáveis para uma unidade cuja lista de categorias financeiras esteja vazia.
- **FR-002**: O conjunto padrão MUST conter Compra de Insumos, Fornecedor, Manutenção, Marketing, Imposto, Retirada e Outras Saídas.
- **FR-003**: Quando existir ao menos uma categoria própria, o sistema MUST retornar somente o cadastro da unidade, sem acrescentar categorias padrão.
- **FR-004**: O fallback MUST ser determinístico e MUST NOT persistir, duplicar ou remover categorias durante a leitura.
- **FR-005**: Erros ao consultar categorias MUST continuar sendo informados como falha, sem ativar silenciosamente o fallback.
- **FR-006**: Um usuário autorizado MUST conseguir selecionar uma categoria e concluir o lançamento de saída com os demais campos válidos.
- **FR-007**: A saída concluída MUST permanecer vinculada ao tenant autorizado e à data civil escolhida.
- **FR-008**: Falhas de persistência MUST ser mostradas ao usuário e MUST NOT gerar sucesso apenas no estado visual.
- **FR-009**: A correção MUST preservar categorias próprias, lançamentos históricos, totais, DRE, fluxo de caixa e competências fechadas.
- **FR-010**: Um teste de regressão MUST demonstrar que a lista vazia produzia zero categorias antes da correção e passa a produzir as categorias padrão depois dela.
- **FR-011**: O fluxo crítico MUST ser validado no navegador contra o ambiente publicado, incluindo ausência de erros de console, rede, CORS e servidor.

### Key Entities

- **Categoria financeira de saída**: Classificação selecionável usada no lançamento manual de uma despesa; pode ser própria da unidade ou pertencer ao conjunto padrão de fallback.
- **Unidade/tenant**: Limite de autorização e isolamento do cadastro financeiro.
- **Lançamento financeiro**: Registro de saída com tenant, data civil, valor, pagamento, categoria, origem financeira e observação.

## Risk, Boundaries, and Non-Functional Requirements *(mandatory)*

- **Affected boundaries**: Projeção financeira do backend, contrato de bootstrap consumido pelo formulário e teste de aceitação no frontend. Endpoint de gravação e banco permanecem sem alteração de contrato ou schema.
- **Authorization and tenant scope**: O carregamento e o lançamento continuam exigindo sessão e permissão do tenant; o fallback é comum e não contém dados de outro tenant.
- **Data integrity and retry behavior**: A leitura não grava categorias. Categorias próprias e lançamentos históricos permanecem intactos. O fallback é idempotente e não provoca retries automáticos de lançamentos.
- **Failure and recovery behavior**: Rollback é a reversão do código. Como não há migration nem escrita corretiva, não existe compensação de dados; falhas reais de consulta continuam visíveis.
- **Performance, accessibility, or observability requirement**: O fallback não adiciona consultas nem chamadas de rede. O seletor deve continuar operável por nome visível, e o smoke test deve registrar erros de console/rede relevantes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos carregamentos testados com zero categorias persistidas apresentam exatamente sete categorias padrão selecionáveis.
- **SC-002**: 100% dos carregamentos testados com categorias próprias preservam exatamente a lista cadastrada, sem padrões adicionais.
- **SC-003**: Um usuário autorizado conclui o lançamento de uma saída no ambiente publicado e encontra o registro após recarregar.
- **SC-004**: Carregamentos repetidos não aumentam a quantidade de categorias nem criam registros persistentes.
- **SC-005**: Todos os gates afetados passam e o navegador não registra erro de console, rede, CORS ou servidor durante o fluxo publicado.

## Assumptions

- “Saídas” se refere ao fluxo Financeiro > Lançamentos > Lançar saída avulsa.
- O tenant reproduzido está sem linhas em seu cadastro de categorias financeiras; a lista vazia observada no ambiente publicado é a causa bloqueadora.
- As sete categorias já usadas como padrão pela aplicação representam o fallback de negócio vigente.
- Categorias próprias, quando presentes, têm precedência total sobre o conjunto padrão.
- Não será feita escrita automática no banco durante o bootstrap, evitando duplicação, conflito de nomes e alteração irreversível de dados.
