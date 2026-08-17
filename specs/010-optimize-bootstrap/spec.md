# Feature Specification: Otimizar carregamento inicial do dashboard

**Feature Branch**: `codex/010-optimize-bootstrap`

**Created**: 2026-08-17

**Status**: Ready

**Input**: User description: "Otimizar o carregamento inicial de GET /api/app/bootstrap, hoje em aproximadamente 12 segundos, sem alterar comportamentos, dados, regras, autorização, isolamento por tenant ou contratos existentes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir o dashboard rapidamente (Priority: P1)

Como usuário autenticado, quero que o dashboard carregue rapidamente para iniciar meu trabalho sem aguardar cerca de 12 segundos.

**Why this priority**: O bootstrap bloqueia a experiência autenticada inteira; sua latência afeta todos os usuários e telas dependentes.

**Independent Test**: Abrir a aplicação oficial com sessão válida, recarregar o dashboard três vezes e confirmar que o conteúdo aparece completo dentro das metas, sem falha, perda de sessão ou erro de servidor.

**Acceptance Scenarios**:

1. **Given** uma sessão válida e o serviço já inicializado, **When** o usuário recarrega o dashboard, **Then** o carregamento inicial conclui em menos de 5 segundos.
2. **Given** uma sessão válida e uma inicialização fria, **When** o usuário abre o dashboard, **Then** o carregamento inicial conclui em menos de 10 segundos.
3. **Given** o dashboard carregado, **When** o usuário navega pelas principais telas dependentes dos dados iniciais, **Then** os mesmos dados e recursos disponíveis antes da otimização continuam funcionando.

---

### User Story 2 - Preservar segurança e dados (Priority: P1)

Como responsável pelo sistema, quero que a melhoria de desempenho preserve autenticação, autorização, isolamento por tenant, regras e contratos para que rapidez não introduza exposição ou inconsistência.

**Why this priority**: Uma otimização que cruza tenants ou altera regras financeiras, de RH, cardápio, pedidos ou contratos é inaceitável.

**Independent Test**: Comparar o contrato e o conteúdo observável antes e depois para usuários autorizados e executar os testes de isolamento, autorização e regras existentes.

**Acceptance Scenarios**:

1. **Given** usuários pertencentes a tenants distintos, **When** cada um carrega o dashboard, **Then** cada resposta contém somente dados autorizados do respectivo tenant.
2. **Given** um consumidor atual do bootstrap, **When** recebe a resposta otimizada, **Then** o formato e a semântica esperados permanecem compatíveis.
3. **Given** uma sessão ausente, inválida ou sem permissão, **When** o bootstrap é solicitado, **Then** o comportamento de autenticação e autorização permanece inalterado.

---

### User Story 3 - Diagnosticar e comprovar a melhoria (Priority: P2)

Como mantenedor, quero medições detalhadas e comparáveis para aplicar apenas otimizações sustentadas por evidência e identificar gargalos remanescentes.

**Why this priority**: Sem decomposição dos tempos, qualquer mudança seria especulativa e poderia deslocar o problema ou criar risco sem benefício comprovado.

**Independent Test**: Registrar antes e depois os tempos de autenticação, tenant, permissões, cada projeção, consultas, montagem e serialização, além do tamanho do payload e das chamadas publicadas.

**Acceptance Scenarios**:

1. **Given** a implementação anterior, **When** o bootstrap é medido, **Then** existe uma linha de base separando todas as etapas exigidas.
2. **Given** uma otimização candidata, **When** as medições não comprovam um gargalo ou ganho, **Then** a alteração não é incorporada.
3. **Given** a versão publicada, **When** o dashboard é recarregado três vezes, **Then** duração, status, erros, console, rede e tamanho do payload são registrados e comparados com a linha de base.

### Edge Cases

- Inicialização fria simultânea do serviço e das conexões externas.
- Projeção individual lenta ou indisponível enquanto as demais concluem normalmente.
- Usuário autenticado sem tenant válido ou sem permissões suficientes.
- Tenants com volumes de dados muito diferentes e payloads grandes.
- Consultas repetidas ou etapas que aparentam paralelismo, mas compartilham dependências reais.
- Falha parcial, resposta 500/504, perda de sessão ou mensagem "Falha ao carregar o backend".
- Otimização de payload que possa remover dado ainda consumido por alguma tela.
- Cache com chave ou invalidação insuficiente que possa servir dados obsoletos ou de outro tenant.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST registrar, antes de qualquer otimização de produção, a duração separada de autenticação, resolução de tenant, permissões, cada projeção, cada operação de persistência, montagem e serialização da resposta.
- **FR-002**: A linha de base MUST registrar duração total, estado de inicialização, status da resposta e tamanho do payload.
- **FR-003**: O diagnóstico MUST identificar consultas lentas ou duplicadas, dependências sequenciais evitáveis, dados ou campos excessivos e necessidades comprovadas de estrutura de acesso aos dados.
- **FR-004**: O sistema MUST aplicar somente mudanças cujo benefício e segurança sejam sustentados pelas medições registradas.
- **FR-005**: Operações independentes MAY ser executadas em paralelo, mas dependências de autenticação, autorização, tenant e regras MUST permanecer na ordem necessária.
- **FR-006**: A resposta otimizada MUST preservar o contrato e a semântica atualmente consumidos pela interface.
- **FR-007**: Autenticação, autorização, isolamento por tenant, cálculos financeiros, regras de RH, cardápio, pedidos e contratos existentes MUST permanecer inalterados.
- **FR-008**: Qualquer redução de dados iniciais MUST comprovar que os dados não são necessários ao dashboard e MUST manter compatibilidade para as telas que os consomem.
- **FR-009**: Qualquer cache MUST possuir invalidação explícita, isolamento por tenant e comportamento seguro diante de atualização, erro e expiração; na ausência disso, cache MUST NOT ser utilizado.
- **FR-010**: Qualquer alteração de estrutura de dados persistidos MUST ser nova, compatível com dados existentes, validada sem apagar ou recriar dados e acompanhada de ação compensatória documentada.
- **FR-011**: Testes de regressão e contrato do bootstrap MUST ser adicionados antes da correção e preservar o formato e as garantias de segurança existentes.
- **FR-012**: Todos os testes do backend e frontend, lint e build MUST passar antes da publicação.
- **FR-013**: Após a publicação, a aplicação oficial MUST ser navegada com sessão válida, incluindo três recargas do dashboard e as principais telas dependentes do bootstrap.
- **FR-014**: A validação publicada MUST confirmar ausência de erros de console, respostas 500/504, perda de sessão e mensagem "Falha ao carregar o backend".
- **FR-015**: Os registros publicados MUST incluir duração, status e erros das chamadas, comparação antes/depois e URL validada.
- **FR-016**: A solução MUST atingir as metas sem depender do limite máximo de duração da função como mecanismo de desempenho.

### Key Entities

- **Medição do bootstrap**: execução observada com estado quente ou frio, duração total, tempos por etapa, status, tamanho do payload e identificador de correlação sem dados sensíveis.
- **Projeção inicial**: conjunto de dados autorizado carregado pelo bootstrap, com duração, dependências e tamanho observável próprios.
- **Contexto do tenant**: vínculo autorizado entre sessão, tenant e permissões que delimita todas as leituras e qualquer eventual cache.

## Risk, Boundaries, and Non-Functional Requirements *(mandatory)*

- **Affected boundaries**: Dashboard autenticado, contrato do bootstrap, orquestração das projeções, consultas de leitura e observabilidade. Módulos de domínio só podem mudar se a medição comprovar necessidade sem alterar regra. Estrutura persistida somente se um índice seguro for comprovadamente necessário.
- **Authorization and tenant scope**: Toda leitura, medição e eventual cache deve manter a autorização no servidor e o isolamento estrito por tenant. Logs não podem registrar segredos, tokens ou conteúdo sensível.
- **Data integrity and retry behavior**: A carga é de leitura; paralelismo, repetição ou falha não podem criar escrita, duplicidade ou divergência. Dados históricos e resultados financeiros, de RH, pedidos e estoque permanecem intactos.
- **Failure and recovery behavior**: Cada otimização deve ser reversível por código ou ação compensatória documentada. Uma falha parcial deve manter o contrato de erro atual e preservar a sessão; nenhum fallback pode servir dados de outro tenant ou obsoletos sem regra explícita.
- **Performance, accessibility, or observability requirement**: Carregamento normal abaixo de 5 segundos e frio abaixo de 10 segundos, com telemetria suficiente para decompor o tempo sem exposição de dados e sem usar aumento do limite de duração como solução.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em três recargas consecutivas da aplicação oficial já inicializada, 100% dos dashboards ficam completamente utilizáveis em menos de 5 segundos.
- **SC-002**: Em uma abertura oficial com inicialização fria comprovada, o dashboard fica completamente utilizável em menos de 10 segundos.
- **SC-003**: As execuções publicadas de aceitação apresentam zero respostas 500 ou 504, zero mensagens de falha de backend e zero perda de sessão.
- **SC-004**: A linha de base e a medição final contêm 100% das etapas solicitadas, duração total e tamanho do payload, permitindo atribuir a causa e o ganho observado.
- **SC-005**: O contrato automatizado e as principais telas dependentes apresentam o mesmo conteúdo e comportamento observável anterior para usuários autorizados.
- **SC-006**: Todos os gates automatizados de backend e frontend são aprovados, e a navegação publicada não apresenta erro de console ou rede.

## Assumptions

- A sessão válida já disponível para a aplicação oficial pode ser usada na navegação sem criar ou alterar credenciais.
- A medição anterior deve ser capturada na versão vigente antes de publicar a otimização, usando carga e tenant representativos disponíveis com segurança.
- A meta é avaliada ponta a ponta pelo carregamento visível do dashboard e também pela duração do bootstrap, pois ambos precisam melhorar.
- Compatibilidade significa preservar chaves, tipos, significado, autorização e disponibilidade dos dados atualmente consumidos; mudanças internas não observáveis são permitidas.
- Dados somente de telas secundárias podem ser candidatos a carregamento sob demanda apenas quando a análise de consumidores provar compatibilidade.
