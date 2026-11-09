# Quickstart: Validar timeout do backend

## Gates locais

1. Executar `npm test` em `back-end`.
2. Executar `node --test "src/**/*.test.mjs"`, `npm run lint` e `npm run build`
   em `front-end/app/mock`.
3. Executar `npm run test:e2e:production` para o smoke público.

## Gate autenticado após deploy

1. Publicar o backend com `vercel --prod --yes` em `back-end`.
2. Abrir `/app` na URL oficial usando a sessão existente no navegador integrado.
3. Recarregar a página duas vezes e aguardar o heading do dashboard.
4. Confirmar ausência de "Falha ao carregar o backend" e erros relevantes no console.
5. Consultar logs de produção desde o deploy e reprovar se houver novo 504 em
   `/api/app/bootstrap`.

## Resultado

- 2026-08-17 — regressão confirmou falha com `maxDuration: 10`.
- 2026-08-17 — backend tests: PASS.
- 2026-08-17 — frontend Node tests: PASS.
- 2026-08-17 — frontend lint: PASS.
- 2026-08-17 — frontend production build: PASS.
- 2026-08-17 — primeiro deploy removeu 504, mas revelou um 500 isolado:
  `readMenuProjection` foi cancelada pelo timeout de statement do banco.
- 2026-08-17 — consulta relacional profunda do menu substituída por quatro
  leituras simples em paralelo e montagem em memória; regressão e gates: PASS.
- 2026-08-17 — deploy final:
  `https://rei-das-esfihas-backend-4e3l0mz3q-diegoyanns-projects.vercel.app`,
  alias `https://rei-das-esfihas-backend.vercel.app`.
- 2026-08-17 — smoke Playwright publicado: PASS em 16,8 s, sem falha de
  CORS, rede ou servidor.
- 2026-08-17 — navegação autenticada no dashboard: duas recargas aprovadas em
  12,161 s e 11,873 s; dashboard visível, tela de falha ausente e nenhum erro
  relevante no console.
- 2026-08-17 — logs do deployment `dpl_8tMemvLKg6ohtrftKuNMsmvodQ7y`:
  bootstrap respondeu somente 200/204 nas chamadas do gate; nenhum 500 ou 504.
