# Frontend web

Aplicação web React e Vite do Rei das Esfihas. A API é acessada por `src/services/`; a fonte de dados padrão é a API real e pode ser trocada por dados simulados com `VITE_DATA_SOURCE=mock`.

Para visão geral e inicialização dos dois serviços, consulte o [README principal](../../../README.md).

## Rodar localmente

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Configure `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`. Para usar os dados simulados, defina `VITE_DATA_SOURCE=mock`. As flags `VITE_FEATURE_REVIEW_MANAGEMENT`, `VITE_FEATURE_AI_BEHAVIOR_SETTINGS`, `VITE_FEATURE_GOOGLE_AUTH` e `VITE_FEATURE_ORDER_OPERATIONS` ficam desligadas por padrão; habilite uma integração somente após configurá-la e validá-la.

Variáveis `VITE_*` ficam visíveis no bundle do navegador. Use apenas valores públicos neste projeto; segredos, senhas e tokens devem ficar no backend.

## Validação

```bash
node --test "src/**/*.test.mjs"
npm run lint
npm run build
```

## Publicação na Vercel

Este diretório corresponde ao projeto Vercel do frontend. Configure as variáveis de produção no painel da Vercel e publique com:

```bash
vercel --prod --yes
```
