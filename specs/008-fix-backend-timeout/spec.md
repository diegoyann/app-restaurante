# Feature Specification: Corrigir timeout do backend

**Feature Branch**: `codex/009-fix-backend-timeout`
**Created**: 2026-08-17
**Status**: Ready
**Input**: User description: "corrigir o erro falha ao carregar o back end"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir o painel sem falha (Priority: P1)

Como operador autenticado, quero abrir e recarregar o painel publicado sem que o
carregamento inicial seja interrompido pelo backend.

**Why this priority**: O timeout bloqueia todo o painel e interrompe o trabalho.

**Independent Test**: Navegar pela URL oficial com sessão válida, recarregar o
painel e observar o dashboard completo sem a mensagem de falha.

**Acceptance Scenarios**:

1. **Given** uma sessão válida e o backend em inicialização fria, **When** o
   painel solicita os dados iniciais, **Then** a função tem tempo suficiente para
   concluir e responde antes do limite publicado.
2. **Given** o painel carregado, **When** o usuário recarrega a página, **Then**
   o dashboard reaparece sem exigir novo login.
3. **Given** uma falha real que ultrapasse o novo limite, **When** a tela receber
   o erro, **Then** a sessão continua preservada e a ação existente de tentar
   novamente permanece disponível.

### Edge Cases

- Inicialização fria simultânea do backend e da conexão com o banco.
- Várias consultas de projeção executadas em paralelo com latências diferentes.
- Resposta que ultrapassa 10 segundos, mas conclui dentro do novo orçamento.
- Usuário sem sessão continua sendo direcionado ao login.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A função compartilhada do backend MUST ter orçamento de execução
  superior aos 10 segundos que produziram os erros 504 observados.
- **FR-002**: O novo limite MUST cobrir o carregamento inicial real sem alterar
  payload, autenticação, tenant ou regras de negócio.
- **FR-003**: Um teste automatizado MUST falhar enquanto o limite permanecer em
  10 segundos e exigir pelo menos 30 segundos.
- **FR-004**: Os testes existentes de backend e frontend MUST permanecer aprovados.
- **FR-005**: Após o deploy, a tela autenticada MUST ser aberta e recarregada por
  automação de navegador, sem erro 504 ou mensagem de falha ao carregar.
- **FR-006**: A validação publicada MUST registrar tempo, console, estado visual
  e ausência de novos erros 5xx nos logs.

## Risk, Boundaries, and Non-Functional Requirements *(mandatory)*

- **Affected boundaries**: Configuração de duração da função do backend e gate de
  navegação. Código de domínio, banco e interface permanecem inalterados.
- **Authorization and tenant scope**: Sem mudança; a navegação usa sessão já válida.
- **Data integrity and retry behavior**: Somente leituras; nenhum dado é alterado.
- **Failure and recovery behavior**: Reverter o limite e republicar o backend;
  manter o botão existente de nova tentativa.
- **Performance and observability**: O bootstrap deve concluir em até 60 segundos
  e a entrega deve registrar a ausência de 504 após a publicação.

## Success Criteria *(mandatory)*

- **SC-001**: A configuração publicada permite até 60 segundos para a função.
- **SC-002**: A navegação autenticada abre e recarrega o dashboard duas vezes
  consecutivas sem mostrar "Falha ao carregar o backend".
- **SC-003**: Os logs do teste publicado não contêm novos 504 do bootstrap.
- **SC-004**: Todos os gates locais afetados são aprovados.

## Assumptions

- Os 504 observados nos logs de produção são a causa da mensagem apresentada.
- O bootstrap já paraleliza suas projeções; esta correção não reestrutura dados.
- A sessão disponível no navegador integrado pode validar o fluxo real sem criar
  credenciais ou dados de QA.
