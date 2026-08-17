# Data Model: Orçamento de runtime

Não há entidade persistida.

- **maxDuration**: inteiro em segundos, mínimo aceito 30, valor escolhido 60.
- **Função afetada**: `api/index.js`, roteador de todas as rotas do backend.
- **Estado**: configuração versionada e aplicada no deploy.
