# Feature flags operacionais

Estas funções ficam desligadas por padrão porque a interface existe, mas o fluxo de negócio não foi validado de ponta a ponta.

| Variável | Padrão | Motivo | Critério para habilitar |
| --- | --- | --- | --- |
| `VITE_FEATURE_REVIEW_MANAGEMENT` | `false` | A tela de avaliações usa estado somente no navegador; publicar/ignorar não grava nem envia resposta ao Google/iFood. | Ingestão e publicação reais, com persistência e auditoria. |
| `VITE_FEATURE_AI_BEHAVIOR_SETTINGS` | `false` | As preferências são salvas, mas não há motor de IA usando-as para gerar ou publicar respostas. | Motor consumidor das configurações, com teste de ponta a ponta. |
| `VITE_FEATURE_GOOGLE_AUTH` | `false` | O botão OAuth existe, mas o provedor Google não foi validado no Supabase de produção. | Login, retorno e autorização testados em produção. |
| `VITE_FEATURE_ORDER_OPERATIONS` | `false` | A operação de pedidos depende de integrações que não serão utilizadas neste momento. | Integração escolhida configurada e fluxo de pedido validado de ponta a ponta. |

Para habilitar uma função, configure a variável como `true` no Vercel e faça um novo deploy. Links diretos para telas desativadas retornam ao Dashboard.
