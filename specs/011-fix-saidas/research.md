# Research: Restaurar Lançamento de Saídas

## Decisão 1: aplicar fallback na projeção financeira do backend

**Decision**: Quando a consulta válida de `finance_expense_categories` retornar vazia, a projeção entrega as sete categorias padrão já reconhecidas pela aplicação.

**Rationale**: O navegador publicado mostrou zero opções no seletor obrigatório. Corrigir no contrato do backend beneficia todos os consumidores e evita duplicar a regra no frontend.

**Alternatives considered**:

- Preservar os valores iniciais do estado React: corrige apenas um consumidor e mantém o contrato vazio.
- Inserir automaticamente durante cada bootstrap: introduz escrita em leitura, risco de corrida e duplicação.
- Migration para todos os tenants: impõe categorias persistentes sem necessidade e dificulta distinguir padrão de cadastro próprio.

## Decisão 2: categorias próprias têm precedência total

**Decision**: Uma lista persistida não vazia é mapeada como está; padrões não são mesclados.

**Rationale**: A classificação financeira pode ser personalizada. Misturar nomes adicionaria opções não aprovadas e poderia fragmentar relatórios.

**Alternatives considered**:

- Completar apenas nomes ausentes: altera silenciosamente a taxonomia de tenants existentes.
- Sempre usar padrões: descartaria categorias próprias e quebraria histórico operacional.

## Decisão 3: não ocultar falhas de consulta

**Decision**: O tratamento de erro existente ocorre antes da resolução do fallback.

**Rationale**: Lista vazia é um estado de dados válido; erro de banco é falha operacional. Confundir ambos reduziria observabilidade e poderia mascarar indisponibilidade.

**Alternatives considered**:

- Capturar qualquer erro e retornar padrões: permitiria abrir o formulário, mas esconderia falhas que também podem afetar persistência e outros dados financeiros.

## Decisão 4: sem migration

**Decision**: Não alterar schema nem dados persistidos.

**Rationale**: O defeito está no contrato vazio e pode ser resolvido de forma reversível, compatível com tenants futuros e sem tocar no histórico.

**Alternatives considered**:

- Seed por migration: é forward-only e idempotente quando bem desenhado, mas cria dados que o usuário não pediu e exige estratégia de remoção/identificação dos defaults.
