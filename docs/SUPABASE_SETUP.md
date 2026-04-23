# Supabase Setup

## 1. Rotação de segredo

Trate a `SUPABASE_SECRET_KEY` antiga como comprometida.

Faça antes de qualquer deploy:

1. Gere uma nova `secret key` no painel do Supabase.
2. Atualize apenas no backend/Vercel.
3. Garanta que o frontend use somente a `publishable key`.

## 2. Variáveis de ambiente

### Frontend

Use [front-end/app/mock/.env.example](D:/Git/binho/ReiDasEsfihas/front-end/app/mock/.env.example) como base.

### Backend

Use [back-end/.env.example](D:/Git/binho/ReiDasEsfihas/back-end/.env.example) como base.

## 3. Aplicar schema

Este repositório agora possui a migration inicial em:

- [20260420_000001_initial_schema.sql](D:/Git/binho/ReiDasEsfihas/supabase/migrations/20260420_000001_initial_schema.sql)

Como o Supabase CLI não estava instalado/configurado no ambiente atual, a migration foi preparada mas não aplicada remotamente daqui.

Fluxo recomendado na máquina com acesso ao projeto:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## 4. Seed inicial

Depois do schema aplicado:

```bash
cd back-end
npm run seed:supabase
```

O script cria tenants e usuários demo com senha temporária. Troque todas imediatamente.

## 5. Deploy

### Vercel

Configurar no projeto:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `CORS_ALLOWED_ORIGINS`

No frontend:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 6. Checklist de validação

- login Supabase funciona para admin global e tenant admin
- `/api/auth/session` retorna memberships corretos
- `/api/app/bootstrap?tenant=<slug>` retorna apenas dados autorizados
- `/admin` só abre para `super_admin`
- bundle do frontend não contém `sb_secret_`
