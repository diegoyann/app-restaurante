# Research: Otimizar carregamento inicial do dashboard

## Medir antes de otimizar

**Decision**: Criar spans correlacionados para todas as fases exigidas, contagem/duração de operações Supabase, linhas e bytes por projeção, montagem, serialização e payload total. Registrar uma execução fria e três quentes antes de alterar o fluxo.

**Rationale**: GETs não têm telemetria. A inspeção estática identifica candidatos, mas não atribui os 12 s.

**Alternatives considered**: Tempo ponta a ponta ou logs de erro omitem o responsável interno; APM/cache antes da linha de base adicionaria variáveis sem evidência.

## Sincronizações financeiras como hipótese principal

**Decision**: Instrumentar separadamente geração de obrigações, folha, extras e repasses, incluindo consultas, upserts e iterações.

**Rationale**: As dez projeções já usam `Promise.all`, mas finanças aguarda duas sincronizações mutáveis com loops sequenciais e custo variável. Há cerca de 44 chamadas remotas estáticas antes delas.

**Alternatives considered**: Paralelizar projeções já paralelas; aumentar `maxDuration`; mover sincronizações sem medir consistência.

## Duplicação de tenant e permissões

**Decision**: Medir e testar a busca duplicada de tenant e a execução duplicada de `ensureTenantRoleProfiles`; se confirmadas, reutilizar contexto/perfis já carregados para calcular permissões sem repetir I/O.

**Rationale**: O handler aguarda o bootstrap e depois permissões buscam novamente tenant/perfis, incluindo upsert/select no mesmo GET.

**Alternatives considered**: Apenas usar `Promise.all` preservaria I/O duplicado e inicializações concorrentes; cache global arriscaria tenant/invalidação.

## Seleção explícita depende de contrato

**Decision**: Medir bytes por projeção e substituir `select('*')` somente onde os campos usados por mappers/consumidores estiverem cobertos.

**Rationale**: Quase todas as projeções selecionam tudo, inclusive relações completas de pedidos e campos JSON pesados. Remoção sem contrato pode falhar silenciosamente.

**Alternatives considered**: Redução mecânica ou paginação alteraria conteúdo e comportamento.

## Sem lazy-load ou cache por padrão

**Decision**: Preservar todas as chaves. Lazy-load só para dados secundários comprovados com contrato compatível; cache só com invalidação, tenant na chave e recuperação.

**Rationale**: O dashboard usa settings, permissões, transações, recorrências, funcionários, logs e obrigações. Abas secundárias e reconsultas pós-mutação ainda dependem do bootstrap.

**Alternatives considered**: Remover chaves aparentemente não lidas no App pode quebrar outros clientes; cache temporal pode servir dado obsoleto.

## Índice somente com plano real

**Decision**: Verificar índices instalados e executar EXPLAIN somente nas consultas lentas. Migration aditiva apenas se o plano comprovar ganho.

**Rationale**: Migrations já cobrem várias consultas principais; candidatos estáticos podem ter cardinalidade pequena e custo de escrita maior que o benefício.

**Alternatives considered**: Criar todos os índices sugeridos aumenta risco sem prova.

## Endpoint e experiência separados

**Decision**: Medir bootstrap isolado e navegação real, registrando também supply-chain e saldos.

**Rationale**: O frontend espera as três chamadas em paralelo; o tempo visual é o máximo delas, embora a falha do bootstrap seja bloqueante.

**Alternatives considered**: `/health`, testes unitários e build não validam UX publicada.
