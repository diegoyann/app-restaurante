# Quickstart: Validação da otimização do bootstrap

## Pré-requisitos

- Dependências instaladas pelos lockfiles; Vercel autenticada; sessão válida oficial ou `storageState` seguro fora do repositório.
- Acesso somente leitura ao Supabase se consulta lenta exigir EXPLAIN.
- Nunca imprimir tokens, `.env` ou corpos do tenant.

## Linha de base

1. Publicar somente instrumentação diagnóstica, sem alterar contrato/fluxo.
2. Fazer uma execução fria e três recargas quentes.
3. Registrar em `baseline.md`: autenticação, tenant, permissões, projeções, sincronizações, operações Supabase, montagem, serialização, total, status, bytes, supply-chain/saldos e logs correlacionados.
4. Consultar EXPLAIN/índices reais apenas para consultas marcadas lentas.

## Regressões e gates

No `back-end`:

```powershell
npm test
```

No `front-end/app/mock`:

```powershell
node --test "src/**/*.test.mjs"
npm run lint
npm run build
```

Novos testes de duplicação/sequência devem falhar antes da correção; contrato/tenant passam em ambas. Se houver migration, validar banco real e ação compensatória.

## Publicação

Após validação Git, commit e push, executar `vercel --prod --yes` em `back-end` e também no frontend somente se alterado. Capturar URLs e confirmar conclusão.

## Navegação autenticada

1. Abrir a URL oficial com sessão válida.
2. Recarregar três vezes usando readiness por elementos/respostas, sem sleeps fixos.
3. Registrar duração/status/bytes do bootstrap e duração visual.
4. Navegar por dashboard, financeiro, RH, pedidos habilitados, catálogo/CMV, cardápio e configurações permitidas.
5. Confirmar sessão, conteúdo, zero mensagem de falha, zero console/requestfailed e zero 500/504.
6. Consultar logs e preencher antes/depois em `baseline.md`.

## Critério de parada

Não concluir se quente >=5 s, frio >=10 s, dashboard perto de 12 s, houver 500/504, quebra de contrato/tenant ou faltar navegação autenticada real.
