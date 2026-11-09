# Contract: Orçamento da função

- `api/index.js` recebe `maxDuration: 60`.
- Payloads, status funcionais, autenticação e rotas não mudam.
- Respostas concluídas entre 10 e 60 segundos não são encerradas pelo runtime.
- Operações que excedam 60 segundos continuam falhando e devem aparecer nos logs.
