# Segurança operacional

## Regras duras

- `sb_secret_*` nunca entra no frontend.
- `sb_secret_*` nunca entra em arquivo versionado.
- `sb_secret_*` nunca vai para documentação pública.
- o frontend usa só `VITE_SUPABASE_PUBLISHABLE_KEY`
- qualquer operação administrativa sensível roda só no backend

## Riscos que existiam

- login mock
- token mock
- `sessionStorage` usado como fonte de verdade
- backend em memória
- CORS aberto
- credencial secreta exposta fora do backend

## Mitigações implementadas

- Supabase Auth no frontend
- bearer token real nas chamadas para `/api`
- backend validando identidade antes de responder
- endpoints admin exigindo `super_admin`
- schema multi-tenant com `tenant_id`
- RLS preparada no banco
- examples de `.env` separados por frontend/backend
- `.gitignore` no backend para bloquear `.env`

## O que ainda exige ação manual

- rotacionar a chave secreta antiga
- aplicar migration no Supabase remoto
- rodar o seed inicial
- cadastrar origens reais em `CORS_ALLOWED_ORIGINS`
- revisar as senhas temporárias criadas pelo seed
