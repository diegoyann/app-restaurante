# Research: Recuperação de sessão

## Decision

Classificar a falha da validação de sessão antes de alterar o estado autenticado.

## Rationale

O código atual converte toda exceção em `session = null`. Uma interrupção breve entre o navegador e a API, portanto, vira logout. A sessão fornecida pelo Supabase continua válida e deve ser preservada até haver prova de invalidez.

## Alternatives considered

- Recarregar a página automaticamente: não resolve a causa e pode perder estado da tela.
- Sempre manter a sessão mesmo após 401/403: inseguro, pois mascara sessão invalidada.
- Alterar a API: sem evidência; o contrato HTTP atual já permite ao cliente classificar a falha.
