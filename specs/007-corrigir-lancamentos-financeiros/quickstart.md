# Quickstart

## Gates

Em `back-end`: `npm test` e `npm run build` quando disponível.

Em `front-end/app/mock`: `node --test "src/**/*.test.mjs"`, `npm run lint` e `npm run build`.

## Aceite

1. Criar entrada e saída em 14/08/2026; conferir 14/08/2026 após reload.
2. Excluir o lançamento QA/TESTE; atualizar e confirmar ausência.
3. Simular erro DELETE; confirmar que o item continua na lista e o erro aparece.
4. Conferir que outros lançamentos e telas não mudaram.

## Rollback

Reverter o commit e redeployar ambos os projetos. Não há migration.

## Evidência local — 2026-08-17

- Regressões antes da correção: 3 módulos ausentes/falhando conforme esperado.
- Testes direcionados: frontend 4/4 e backend 2/2 aprovados.
- Backend completo: 47/47 testes aprovados.
- Frontend completo: 73/73 testes aprovados.
- Frontend lint: aprovado.
- Frontend build: aprovado; aviso preexistente de chunk acima de 500 kB, fora do escopo.
- Backend não possui script de build; `npm test` é o gate definido pelo projeto.
- Nenhuma migration ou alteração de schema.
