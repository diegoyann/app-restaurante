# Implementation Plan: Corrigir timeout do backend

**Branch**: `codex/009-fix-backend-timeout` | **Date**: 2026-08-17 | **Spec**: [spec.md](spec.md)

## Summary

Elevar de 10 para 60 segundos o orçamento da Vercel Function que atende o
bootstrap, proteger a configuração com regressão automatizada e validar a tela
autenticada por navegação após o deploy.

## Technical Context

**Language/Version**: JavaScript ESM em Node.js 20+
**Primary Dependencies**: Vercel Functions, React/Vite e Playwright/navegador integrado
**Storage**: N/A
**Testing**: `node:test`, testes frontend, lint, build, smoke público Playwright e navegação autenticada
**Target Platform**: Vercel e Chromium
**Project Type**: Aplicação web com frontend e backend separados
**Performance Goals**: Conclusão do bootstrap abaixo de 60 segundos
**Constraints**: Não alterar dados, payload, autenticação ou regra de domínio
**Scale/Scope**: Uma configuração de runtime e seus gates de regressão/release

## Constitution Check

- [x] Requisitos e causa têm evidência nos logs de produção.
- [x] A regressão precede a alteração de configuração.
- [x] O fluxo afetado será validado pela origem e sessão reais no navegador.
- [x] Não há migração, escrita, mudança de autorização ou tenant.
- [x] Rollback e observabilidade estão definidos.

**Gate result**: PASS.

## Project Structure

```text
back-end/
├── vercel.json
├── src/lib/vercelRuntime.test.js
└── package.json

front-end/app/mock/
├── e2e/production-backend.smoke.spec.mjs
├── playwright.config.mjs
├── package.json
└── package-lock.json
```

## Rollout and Recovery

1. Fazer a regressão falhar com o limite atual.
2. Elevar o limite para 60 segundos e executar todos os gates.
3. Publicar somente o backend.
4. Recarregar duas vezes a tela autenticada no navegador integrado.
5. Consultar logs recentes; qualquer 504 reprova a entrega.
6. Em regressão, reverter `vercel.json` e republicar.

## Complexity Tracking

Nenhuma violação constitucional.
