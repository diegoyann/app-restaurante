# Implementation Plan: Corrigir falha de sessão durante o uso

**Branch**: `codex/005-corrigir-sessao` | **Date**: 2026-08-14 | **Spec**: [spec.md](spec.md)

## Summary

Preservar sessões válidas durante falhas transitórias e durante a janela de
renovação de token, sem reduzir a proteção para credenciais realmente inválidas.

## Technical Context

**Language/Version**: JavaScript ESM, React 19 e Node.js

**Primary Dependencies**: `@supabase/supabase-js`, React e Vite

**Storage**: Sessão persistida pelo Supabase; sem mudança de banco

**Testing**: `node --test` em módulos de recuperação de sessão

**Target Platform**: navegador e API Vercel

**Project Type**: aplicação web com API

## Constitution Check

- [x] Regressões automatizadas precedem a correção.
- [x] A sessão, autorização e tenant são tratados como fronteiras críticas.
- [x] Não há migração, mutação financeira ou exposição de segredo.
- [x] O fechamento exige testes, lint, build e deploy de produção.

**Gate result**: PASS

## Design

1. Classificar somente `401` como indício de credencial inválida.
2. Para o primeiro `401`, chamar refresh do Supabase e repetir a validação uma
   vez; o cliente de API usa o token atualizado na segunda chamada.
3. Para `403`, rede, cancelamento e `5xx`, manter a sessão atual e expor o erro
   recuperável.
4. Após refresh falho ou segundo `401`, limpar a sessão e redirecionar ao login.

## Project Structure

```text
front-end/app/mock/src/
├── hooks/sessionRecovery.js
├── hooks/sessionRecovery.test.mjs
└── hooks/useAuthSession.js
```
