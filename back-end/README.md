# Backend

API Node.js ESM para o sistema Rei das Esfihas. Os handlers HTTP ficam em `api-handlers/`, são encaminhados por `api/index.js` para execução como Vercel Functions e usam os módulos de `src/modules/` para regras de negócio. A persistência e autenticação usam Supabase.

Para visão geral, requisitos, configuração do frontend e validações do repositório, consulte o [README principal](../README.md).

## Requisitos

- Node.js e npm compatíveis com as dependências deste projeto.
- Projeto Supabase configurado.

## Rodar localmente

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Configure no `.env`:

| Variável | Uso |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública para operações que a usam |
| `SUPABASE_SECRET_KEY` | Chave privilegiada usada somente no backend |
| `CORS_ALLOWED_ORIGINS` | Origens frontend permitidas, separadas por vírgula |

O servidor local inicia em `http://localhost:3000`. Verifique a disponibilidade em `/health`; as rotas de negócio ficam sob `/api/`.

## Testes

```bash
npm test
```

## Publicação na Vercel

O projeto Vercel do backend está vinculado a esta pasta. Configure as variáveis no ambiente do projeto Vercel e publique com:

```bash
vercel --prod --yes
```

Não versione `.env` nem coloque `SUPABASE_SECRET_KEY`, tokens ou senhas no frontend. Arquivos `.env.example` devem conter apenas valores de exemplo.
