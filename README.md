# Rei das Esfihas

Sistema web de gestão de restaurante com suporte a múltiplas lojas (tenants). Reúne operações administrativas, cardápio, pedidos, estoque, financeiro e equipe em uma aplicação React; a API Node.js aplica as regras de negócio e usa Supabase para autenticação e persistência.

## Funcionalidades

- Empresas, lojas, usuários e perfis de acesso.
- Cardápio, categorias, produtos, ingredientes, preparações e combos.
- Clientes, pedidos, entregas e importação de pedidos do iFood.
- Compras, fornecedores, recebimentos, estoque e inventário.
- Receitas, despesas, obrigações, conciliação de caixa, canais de venda e fechamentos financeiros.
- Funcionários, jornadas, presenças e cálculos de folha.
- Extensão Chrome para apoiar a criação de pedidos.

Algumas integrações têm feature flags desligadas por padrão. Habilite-as somente depois de configurar e validar a integração correspondente.

## Tecnologias

- Frontend: React, Vite e JavaScript.
- API: Node.js ESM, funções serverless da Vercel.
- Dados e autenticação: Supabase (PostgreSQL e Supabase Auth).
- Extensão: Chrome Manifest V3.
- Testes: Node.js Test Runner e Playwright para fluxos de navegador.

## Estrutura do repositório

```text
back-end/              API, regras de negócio e testes
front-end/app/mock/    Aplicação web React/Vite
chrome-extension/      Extensão Chrome para pedidos
shared/                Código compartilhado com o frontend
supabase/migrations/   Migrações versionadas do banco
specs/                 Requisitos, decisões e tarefas das funcionalidades
```

## Requisitos

- Node.js e npm em versões compatíveis com as dependências dos projetos.
- Projeto Supabase configurado para autenticação e banco de dados.
- Vercel CLI somente para executar localmente com `vercel dev` ou publicar.

## Desenvolvimento local

Configure a API em um terminal:

```powershell
cd back-end
Copy-Item .env.example .env
npm ci
npm run dev
```

Preencha o `.env` do backend com as configurações do seu ambiente Supabase. A API local inicia em `http://localhost:3000`; o endpoint de saúde é `http://localhost:3000/health`.

Em outro terminal, configure e inicie o frontend:

```powershell
cd front-end/app/mock
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Defina no `.env.local` os valores de `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. O endereço local da API é `http://localhost:3000/api`. A fonte de dados padrão é `real`; para desenvolver a interface com dados simulados, defina `VITE_DATA_SOURCE=mock`.

As variáveis `VITE_*` são incorporadas ao JavaScript entregue ao navegador. Use no frontend somente valores que podem ser públicos, como a chave publishable do Supabase. Nunca coloque `SUPABASE_SECRET_KEY`, senhas ou tokens em variáveis `VITE_*`.

## Validação

Backend, a partir de `back-end/`:

```bash
npm test
```

Frontend, a partir de `front-end/app/mock/`:

```bash
node --test "src/**/*.test.mjs"
npm run lint
npm run build
```

O build de produção do frontend fica em `front-end/app/mock/dist/`.

## Configuração e publicação

Os exemplos de variáveis ficam em `back-end/.env.example` e `front-end/app/mock/.env.example`. Crie arquivos locais `.env`/`.env.local` e configure variáveis de produção nos ambientes da Vercel. Não versione arquivos de ambiente com valores reais; mantenha nos exemplos apenas placeholders.

As aplicações de frontend e backend são projetos Vercel separados, vinculados às pastas `front-end/app/mock/` e `back-end/`. Para publicar, configure as variáveis necessárias nos respectivos projetos e execute `vercel --prod --yes` dentro de cada pasta. Confira o URL e a conclusão de cada deploy antes de considerar a publicação pronta.

As migrações SQL estão em `supabase/migrations/`. Revise e aplique cada migração pelo fluxo autorizado do ambiente Supabase. Não edite uma migração já aplicada para alterar dados de produção; crie uma nova migração.

## Extensão Chrome

Consulte [`chrome-extension/README.md`](chrome-extension/README.md) para instalação em modo de desenvolvedor, configuração e requisitos de acesso.

## Licença

Este projeto está sob a licença MIT. Consulte [`LICENSE`](LICENSE). Dependências, serviços e marcas de terceiros continuam sujeitos às respectivas licenças e termos.
