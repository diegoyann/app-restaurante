# Quickstart: Validar recuperação de sessão

1. Em `front-end/app/mock`, execute `node --test "src/**/*.test.mjs"`.
2. Confirme: falha transitória não zera sessão existente; erro definitivo a zera.
3. Execute `npm run lint` e `npm run build`.
4. Integrado: autentique-se, interrompa brevemente a API/rede e confirme que não há redirecionamento para `/login`.
