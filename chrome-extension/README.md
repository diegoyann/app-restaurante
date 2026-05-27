# Extensão Chrome - Rei das Esfihas

Extensão MV3 para criar pedidos operacionais usando a base do sistema.

## O que ela faz

- Configura API base URL, Supabase URL e Supabase publishable key.
- Faz login com e-mail e senha pelo Supabase Auth.
- Valida a sessão em `/auth/session`.
- Lista as lojas/tenants acessíveis ao usuário.
- Carrega clientes, formas de pagamento e itens de cardápio via `/app/bootstrap`.
- Cria ou atualiza cliente em `/customers`.
- Cria pedido em `/orders` com status `placed`.

## Como instalar em desenvolvimento

1. Abra `chrome://extensions`.
2. Ative `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactação`.
4. Selecione a pasta `chrome-extension`.
5. Abra a extensão e preencha:
   - API base URL: `http://localhost:3000/api` em desenvolvimento.
   - API base URL em produção: `https://rei-das-esfihas-backend.vercel.app/api`.
   - Supabase URL: URL do projeto Supabase.
   - Supabase publishable key: chave pública usada pelo front-end.

## Requisitos

- O back-end precisa estar acessível pela URL configurada.
- O usuário precisa ter acesso ao tenant como `tenant_admin` ou `tenant_staff`.
- O projeto Supabase precisa aceitar login por senha para o usuário informado.
- O back-end aceita origem `chrome-extension://...` para uso da extensão. Se essa regra for endurecida no futuro, inclua a origem da extensão depois de instalar, no formato `chrome-extension://ID_DA_EXTENSAO`.

## Observação importante

O endpoint `/auth/login` do back-end está desativado. A extensão autentica direto no Supabase Auth e usa o token Bearer nas chamadas para a API. Se isso for alterado no futuro, altere `popup.js` antes de mexer no back-end às cegas.
