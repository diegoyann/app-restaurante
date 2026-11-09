# Implementation Plan: Otimizar carregamento inicial do dashboard

**Branch**: `codex/010-optimize-bootstrap` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

## Summary

Instrumentar o bootstrap sem alterar seu contrato, publicar a instrumentação diagnóstica e registrar a linha de base por fase, consulta, projeção e payload. Somente depois, adicionar regressões e aplicar os menores ajustes sustentados pelas medições: remover trabalho duplicado, tirar sincronizações mutáveis do caminho crítico quando houver alternativa compatível, paralelizar dependências independentes e selecionar colunas necessárias. Índices, cache e carregamento sob demanda permanecem bloqueados até evidência real.

## Technical Context

**Language/Version**: JavaScript ESM; CI em Node.js 22, produção Vercel observada em Node.js 24.x; React 19 no cliente

**Primary Dependencies**: Supabase JS 2.104, Vercel Functions, Vite 8, Playwright 1.62

**Storage**: PostgreSQL/Supabase; migrations SQL forward-only em `supabase/migrations`

**Testing**: Node test runner no backend e frontend; ESLint; build Vite; Playwright contra produção

**Target Platform**: Função serverless Vercel e aplicação web

**Project Type**: Backend REST e frontend separados

**Performance Goals**: bootstrap quente <5 s; frio <10 s; três recargas publicadas dentro da meta; zero 500/504

**Constraints**: contrato compatível; autorização e tenant inalterados; nenhuma regra financeira/RH/pedidos modificada; `maxDuration` não conta como otimização; logs sem dados sensíveis

**Scale/Scope**: um handler, dez projeções, cerca de 44 chamadas remotas estáticas mais sincronizações financeiras variáveis, três requisições iniciais concorrentes no frontend

## Constitution Check

- [x] Critérios mensuráveis, casos-limite e domínios afetados estão especificados.
- [x] Testes de contrato, segurança e desempenho antecedem cada otimização.
- [x] Impactos financeiro, RH, pedidos e tenant estão delimitados; histórico e regras são preservados.
- [x] Validação, autorização, tenant e erros do contrato permanecem iguais.
- [x] Gates locais, deploy, logs e navegação autenticada estão no quickstart.

**Gate result**: PASS antes e depois do desenho. Todas as otimizações candidatas têm gate de evidência e recuperação.

## Design and Execution Strategy

### Fase diagnóstica

1. Adicionar observabilidade estruturada e correlacionada ao GET, sem mudar corpo, status ou autorização.
2. Medir autenticação, tenant, permissões, cada projeção, operações Supabase, sincronizações financeiras, montagem, serialização e bytes.
3. Publicar somente a instrumentação, realizar uma execução fria e pelo menos três quentes com sessão válida e salvar a linha de base em `baseline.md`.
4. Consultar logs Vercel e, apenas para consultas lentas observadas, validar planos e índices no banco real com operações somente leitura.

### Regressão e otimização

1. Fixar contrato, isolamento, ordem necessária e operações duplicadas em testes que falhem no código anterior.
2. Remover apenas duplicações comprovadas, começando por tenant/perfis/permissões e sincronizações N+1 que dominarem a linha de base.
3. Selecionar colunas somente quando mappers e contrato provarem equivalência.
4. Não remover chaves. Lazy-load exige endpoint e hidratação compatíveis, inclusive hashes diretos e reconsultas após mutação.
5. Não adicionar cache sem chave de tenant, invalidação por mutação, expiração e recuperação.
6. Não criar migration sem EXPLAIN real; se necessária, usar índice aditivo e rollback compensatório.

### Rollout e recuperação

- Telemetria pode ser desativada/removida sem alterar dados.
- Otimizações internas serão revertidas por commit/deploy se contrato, segurança ou meta falhar.
- Migration eventual terá ação compensatória `DROP INDEX ... IF EXISTS`; nenhum dado será apagado ou recriado.
- Novo 500/504, quebra de contrato ou tempo próximo de 12 s bloqueia fechamento.

## Project Structure

```text
specs/010-optimize-bootstrap/
├── plan.md
├── research.md
├── data-model.md
├── baseline.md
├── quickstart.md
├── contracts/bootstrap-contract.md
├── checklists/
└── tasks.md

back-end/
├── api-handlers/app/bootstrap.js
├── src/auth/identity.js
├── src/lib/supabaseAdmin.js
├── src/modules/app/tenantBootstrapReadModel.js
├── src/modules/app/projections/*.js
├── src/modules/finance/{obligationsService,settlementService}.js
└── src/repositories/appRepository.js

front-end/app/mock/
├── src/App.jsx
├── src/services/realApi.js
├── src/**/*.test.mjs
└── e2e/*.spec.mjs
```

**Structure Decision**: Manter a arquitetura existente. O handler orquestra autenticação e contrato; o read model coordena projeções; cada projeção preserva seu mapeamento. Telemetria transversal ficará em utilitário sem regra de negócio. O frontend só muda se a medição provar necessidade para a meta ponta a ponta.

## Complexity Tracking

Não há violação constitucional ou nova camada arquitetural a justificar.
