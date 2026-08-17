# Baseline e evidências: Otimização do bootstrap

## Ambiente e controle de mudança

- Data: 2026-08-17 (America/Sao_Paulo).
- Branch de trabalho: `codex/010-optimize-bootstrap`.
- HEAD inicial: `82e0b43e887913b029eb74fb67a1be9225d1a8d7` (`docs: registrar validacao do backend`).
- Worktree inicial: limpo; somente `specs/010-optimize-bootstrap/` foi criado pelo intake antes do código.
- Backend oficial: `https://rei-das-esfihas-backend.vercel.app`.
- Frontend oficial: `https://rei-das-esfihas-frontend.vercel.app`.
- Deployment backend anterior: `dpl_8tMemvLKg6ohtrftKuNMsmvodQ7y`, estado `READY`, runtime Node.js 24.x, 2048 MB, timeout 60 s.
- Tenant de aceitação disponível na sessão do Chrome: `teste-02`.
- CLI Vercel autenticada como `diegoyann`.

## Contrato e consumidores antes

- O contrato top-level está congelado em `contracts/bootstrap-contract.md`.
- O dashboard bloqueia em `Promise.all` de bootstrap, supply-chain e saldos; a latência visual é a maior das três.
- O bootstrap hidrata permissões, settings, RH, financeiro, clientes/pedidos, catálogo e cardápio.
- `ingredientUnits` é recriado localmente; `financialPayments` não possui leitura direta identificada no `App.jsx`, mas as chaves continuam preservadas por compatibilidade.

## Inventário estático antes

- O read model consulta o tenant e dispara 10 projeções superiores em `Promise.all`.
- Piso aproximado: 44 chamadas remotas por bootstrap, sem contar loops variáveis das sincronizações financeiras.
- Foram localizados 35 usos diretos de `select('*')` nas projeções, além da consulta de pedidos com `*` em quatro relações.
- Duplicações observáveis: tenant e perfis/permissões são carregados duas vezes; finanças relê tabelas após sincronizações; pedidos embutem clientes, formas de pagamento e entregadores também carregados separadamente.
- Sequenciamento observável: o handler aguarda o bootstrap antes de permissões; finanças aguarda obrigações e repasses antes de 10 leituras paralelas.
- N+1 observável: obrigações iteram custo × mês × ocorrência; folha gera por funcionário/mês; extras relêem fechamento/obrigação; repasses consultam por canal/semana.
- Índices já declarados cobrem slug de tenant, memberships, pedidos/data, transações/data/tipo, obrigações, repasses, logs e perfis. Nenhuma migration está autorizada sem plano real.

## Medição publicada anterior a mudanças de produto

Sessão real no Chrome, URL `https://rei-das-esfihas-frontend.vercel.app/app/teste-02`, readiness por `Painel Administrativo` + `Saúde financeira`, sem sleep fixo:

| Amostra quente | Dashboard utilizável | Falha visual | Console error |
|---|---:|---:|---:|
| 1 | 3.209 ms | não | 0 |
| 2 | 3.661 ms | não | 0 |
| 3 | 3.127 ms | não | 0 |

- Média visual quente: 3.332 ms.
- Todas as amostras ficaram abaixo de 5 s neste tenant, contrariando a premissa atual de ~12 s.
- A primeira abertura autenticada também concluiu, mas não foi classificada como cold start porque não há sinal confiável de nova instância no deployment anterior.
- Logs Vercel correlatos mostram `GET /api/app/bootstrap` com HTTP 200 e cache `BYPASS`; a versão anterior não registra duração interna nem bytes.
- Nenhuma resposta 500/504 foi observada nessas amostras.

## Limitação da linha de base

O deployment anterior não possui spans de GET nem tamanho de payload nos logs. Portanto autenticação, tenant, permissões, projeções, consultas, montagem e serialização ainda precisam ser medidos em diagnóstico instrumentado antes de qualquer otimização. A falta dessa decomposição bloqueia afirmar a causa.

## Medição diagnóstica e comparação final

O diagnóstico foi executado contra o banco real do tenant `teste-02`, pelo script
`back-end/scripts/measure-bootstrap-performance.mjs`, antes de qualquer correção de desempenho.

| Cenário | Antes | Depois | Meta |
|---|---:|---:|---:|
| Primeira amostra do processo | 13.983,89 ms | 2.684,50 ms | < 10.000 ms |
| Quente 1 | 11.406,12 ms | 2.096,99 ms | < 5.000 ms |
| Quente 2 | 11.813,76 ms | 2.059,74 ms | < 5.000 ms |
| Consultas por chamada | 94 | 53 | redução comprovada |
| Payload JSON | 13.828 bytes | 13.828 bytes | contrato preservado |

### Causa comprovada

- A projeção financeira consumia 10,6–11,6 s antes da correção.
- A sincronização de obrigações consumia 8,2–9,1 s e executava SELECT de obrigação,
  SELECT de fechamento e UPSERT sequenciais por obrigação/mês.
- Foram observados 27 SELECTs de `financial_obligations` e 14 de `financial_closings`
  na mesma chamada, além de leituras repetidas em folha e extras.
- Quatro projeções construíam `Promise.all` com resultados já aguardados, serializando
  consultas que aparentavam estar paralelas.
- Tenant e perfis/permissões eram resolvidos novamente após já estarem presentes no
  bootstrap. Permissões isoladamente custavam cerca de 667 ms no diagnóstico intermediário.

### Correções sustentadas pelas medições

- Obrigações recorrentes, folha e extras agora produzem candidatos e fazem uma leitura
  consolidada de obrigações/competências seguida de um único upsert em lote.
- As consultas independentes de catálogo, settings, financeiro e RH recebem promises
  pendentes no `Promise.all`.
- Geração de obrigações e repasses inicia em paralelo; o repasse reutiliza o tenant resolvido.
- Permissões reutilizam tenant e role profiles do mesmo bootstrap; a etapa caiu para
  0,02–0,16 ms e mantém teste de negação cross-tenant.

### Decomposição final representativa

- resolução do tenant: 165,75–371,42 ms;
- permissões: 0,02–0,16 ms;
- projeção financeira: 1.893,60–2.310,71 ms;
- projeção tenant/perfis: 521,92–889,39 ms;
- demais projeções: 175,91–533,49 ms cada, executadas concorrentemente;
- montagem da resposta: 0,00–0,02 ms;
- serialização e autenticação: instrumentadas no handler e serão confirmadas nos logs
  do deployment, pois o script de banco não possui token de usuário.

### Índices, seleção e payload

- Nenhuma consulta individual apresentou evidência de plano ruim: o custo dominante era
  quantidade de round-trips sequenciais, comprovado pela queda de 94 para 53 queries.
- Não foi executado `EXPLAIN ANALYZE` nem criada migration. Os índices declarados já cobrem
  os filtros dominantes; sem acesso SQL direto a `pg_indexes`, não há base para adicionar
  índice apenas por hipótese.
- `select('*')` não foi trocado: o payload real tem somente 13.828 bytes e permaneceu estável;
  reduzir colunas ou lazy-load aumentaria risco contratual sem ganho material demonstrado.
- Não houve cache nem mudança de `maxDuration`.

### Regressões antes das correções

- `bootstrapTrace.test.js` falhou inicialmente pela ausência do módulo de trace.
- `bootstrapFinancePerformance.test.js` falhou inicialmente pela ausência do planejador em lote.
- `bootstrapProjectionContract.test.js` falhou ao detectar awaits dentro de `Promise.all`.
- `bootstrapPermissions.test.js` falhou inicialmente pela ausência do resolvedor que reutiliza
  o contexto do bootstrap. Todos passam após as correções.

## Gates locais finais

Executados em 2026-08-17 no estado final anterior ao commit:

- backend `npm test`: aprovado, 0 falhas (3.393,55 ms);
- frontend `node --test "src/**/*.test.mjs"`: aprovado, 0 falhas (2.280,17 ms);
- frontend `npm run lint`: aprovado, sem issues;
- frontend `npm run build`: aprovado; permanece apenas o aviso preexistente de chunk > 500 kB;
- E2E autenticado: arquivo criado e carregado pelo Playwright; execução CLI local ficou skip
  sem `E2E_STORAGE_STATE`. A aceitação efetiva será feita na sessão autenticada do Chrome.

## Publicação e aceitação oficial

- Commit: `84cf5b1` (`fix: otimizar bootstrap autenticado`).
- Branch publicada: `codex/010-optimize-bootstrap`.
- Deployment backend: `dpl_3Q9dBKVeFn7zKqPAgYB7XB9vRYJG`, estado `READY`.
- URL do deployment: `https://rei-das-esfihas-backend-mgb9vkpl1-diegoyanns-projects.vercel.app`.
- Alias oficial: `https://rei-das-esfihas-backend.vercel.app`.
- Frontend oficial navegado: `https://rei-das-esfihas-frontend.vercel.app/app/teste-02`.

### Navegação autenticada

| Recarga | Dashboard utilizável | Falha backend | Perda de sessão |
|---|---:|---:|---:|
| 1 | 2.561 ms | não | não |
| 2 | 2.070 ms | não | não |
| 3 | 2.339 ms | não | não |

- Telas validadas: Dashboard, Cardápio, CMV, Lançamentos, Contas a Pagar, RH e Configurações.
- Console da origem oficial: 0 erros. Foram vistos 6 warnings de extensão do Chrome,
  fora da origem da aplicação.
- E2E de produção: smoke do cardápio público aprovado; cenário autenticado CLI ficou skip
  sem storage state, substituído pela navegação autenticada real acima.

### Logs Vercel depois

Sete traces correlacionados do deployment foram consolidados:

- chamadas quentes: 633,37–925,74 ms;
- chamadas marcadas como cold start: 965,77–1.331,06 ms;
- status: 200 em 100% das amostras;
- payload: 13.828 bytes em 100% das amostras;
- queries: 55 por chamada publicada (inclui autenticação, contra 94 no diagnóstico anterior);
- autenticação: 89,55–179,74 ms;
- tenant: 25,86–186,26 ms;
- permissões: 0,03–0,07 ms;
- financeiro: 446,19–1.092,23 ms;
- montagem: 0,00–0,04 ms;
- serialização: 0,08–0,14 ms;
- HTTP 500 no deployment: 0; HTTP 504: 0.

Um warning de depreciação de `url.parse()` emitido por dependência/runtime foi classificado
pela Vercel como log de nível error em uma invocação, mas o trace da própria chamada terminou
HTTP 200 em 641,29 ms. Não houve erro funcional correspondente.
