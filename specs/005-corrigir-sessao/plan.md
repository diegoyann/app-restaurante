# Implementation Plan: Corrigir Renovacao de Sessao

**Branch**: `codex/005-corrigir-sessao` | **Date**: 2026-08-14 | **Spec**: [spec.md](spec.md)

## Summary

Extrair a recuperacao de sessao para funcao testavel, renovar uma vez apos `401`
e preservar sessoes que recebem `403` ou falhas transitorias.

## Constitution Check

- [x] Testes de regressao escritos antes da implementacao.
- [x] Autenticacao e tenant tratados como fronteiras criticas.
- [x] Sem mudanca de schema ou segredo.
- [x] Testes, lint, build e deploy de producao exigidos.

**Gate result**: PASS

## Files

```text
front-end/app/mock/src/hooks/
├── sessionRecovery.js
├── sessionRecovery.test.mjs
└── useAuthSession.js
```
