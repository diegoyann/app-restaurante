# Problemas encontrados em QA

**Ambiente:** produção — `rei-das-esfihas-frontend.vercel.app`  
**Data:** 11/08/2026  
**Escopo:** navegação e telas disponíveis para o tenant `reidasesfihas`.

## Limitações do ambiente de teste

### QA-ENV-001 — Navegador integrado bloqueia Supabase Auth

- **Resultado:** ao abrir `https://stzefrbxpflzmzvwffue.supabase.co/auth/v1/health`, o navegador integrado retorna `ERR_BLOCKED_BY_CLIENT`.
- **Consequência:** o login pela interface retorna `Failed to fetch`, embora a autenticação Supabase e a validação de sessão do backend funcionem quando testadas diretamente.
- **Classificação:** limitação do navegador integrado de QA; não há evidência de defeito no Supabase, backend ou credenciais do aplicativo.
- **Como validar o produto:** testar o login em Chrome/Edge comum, sem bloqueador de conteúdo que intercepte `*.supabase.co`.

## Críticos

### QA-005 — Login bloqueado pelo preflight CORS da API

- **Prioridade:** P0
- **Como reproduzir:** autenticar pelo frontend publicado após o deploy anterior.
- **Resultado atual (antes da correção):** o Supabase autenticava, mas a chamada `GET /api/auth/session` era bloqueada no navegador e o login não redirecionava.
- **Causa raiz:** o frontend envia `X-Request-Id`, porém o backend publicado não o declarava em `Access-Control-Allow-Headers`.
- **Correção:** backend publicado com `X-Request-Id` permitido no preflight; o frontend também passou a validar a sessão e navegar no próprio submit.
- **Status:** resolvido e validado em produção em 11/08/2026 com o login de `rei@reidasesfihas.com`.

### QA-001 — Navegação interna do tenant não troca de tela

- **Prioridade:** P0
- **Como reproduzir:** entrar em `/app/reidasesfihas` com um usuário administrador e clicar em qualquer item da barra lateral, por exemplo **Cardápio Operacional**, **Pedidos**, **Financeiro** ou **Configurações**.
- **Resultado esperado:** o cabeçalho e o conteúdo principal devem mudar para a tela selecionada.
- **Resultado atual:** o cabeçalho continua como `DASHBOARD`, o conteúdo não muda e o item clicado não recebe estado ativo.
- **Impacto:** bloqueia o uso e a validação de quase todos os módulos do tenant.
- **Evidência:** reproduzido em produção; nenhum erro de console foi emitido.
- **Status:** encerrado em 11/08/2026. O achado original foi um falso positivo de QA: no viewport móvel, os itens da barra lateral ficam fora da tela até o usuário abrir o menu pelo botão do cabeçalho. Com esse fluxo real, Cardápio, Pedidos e Configurações funcionam em produção. A navegação por hash permanece como melhoria de robustez.

## Dados e consistência

### QA-002 — Empresas duplicadas com o mesmo nome

- **Prioridade:** P1
- **Onde:** painel de super administrador, busca por empresa.
- **Resultado atual:** existem duas entradas chamadas **Rei das Esfihas**, com slugs `rei-das-esfihas` e `reidasesfihas`.
- **Impacto:** o administrador pode operar no escopo errado; métricas e usuários aparecem diferentes conforme a empresa escolhida.
- **Ação sugerida:** definir o registro canônico, migrar vínculos necessários e remover/mesclar o duplicado de forma controlada.

### QA-003 — Cardápio público sem formas de pagamento configuradas

- **Prioridade:** P1
- **Onde:** `GET /api/public/menu?tenant=reidasesfihas`.
- **Resultado atual:** a resposta contém `paymentMethods: []`; a interface aplica o fallback genérico **Pagamento a combinar**.
- **Impacto:** o pedido pode continuar, mas não há forma de pagamento explícita nem dados para conciliação financeira.
- **Ação sugerida:** definir se o fallback é comportamento desejado. Se não for, cadastrar formas de pagamento do tenant e incluí-las no processo de bootstrap/seed.

## Interface

### QA-004 — Botão “Ver mais” não exibe informação adicional

- **Prioridade:** P2
- **Onde:** cardápio público, item **Esfiha Premium de Carne**.
- **Como reproduzir:** clicar em **Ver mais**.
- **Resultado esperado:** exibir detalhes adicionais do produto ou não apresentar o botão quando não houver conteúdo adicional.
- **Resultado atual:** o texto do botão muda para **Ver menos**, mas nenhum conteúdo extra aparece na tela.
- **Impacto:** gera falsa expectativa e parece que a interface falhou.

## Recursos desativados por feature flag

### QA-006 — Recursos expostos sem fluxo de produção comprovado

- **Itens:** Gestão de Avaliações, Comportamento da IA e login com Google.
- **Evidência:** avaliações altera somente estado no navegador; as configurações de IA não são consumidas por um motor de IA; OAuth Google não foi validado no projeto Supabase de produção.
- **Ação aplicada:** removidos da interface por padrão no deploy de produção, com reativação explícita pelas variáveis documentadas em `docs/FEATURE_FLAGS.md`.
- **Status:** mitigado em 11/08/2026. Não reativar por estética: cada item precisa do fluxo ponta a ponta e auditoria correspondente.
