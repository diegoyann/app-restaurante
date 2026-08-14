# Varredura funcional — 12/08/2026

## Ambiente e método

- **Frontend:** `https://rei-das-esfihas-frontend.vercel.app`
- **Filial:** `bady-bassitt`
- **Perfil usado:** Financeiro (`contato.fabiolcorrea@gmail.com`)
- **Método:** navegação real no ambiente publicado, inspeção visual/semântica, console do navegador, persistência entre módulos e conferência no Supabase quando necessária.
- **Dados de teste:** prefixo `QA AUTO 2026-08-12`; devem ser removidos ao encerrar a varredura.

## Legenda

- **P0:** aplicação indisponível ou perda/corrupção de dados.
- **P1:** cálculo, persistência ou fluxo principal incorreto.
- **P2:** problema funcional contornável ou apresentação enganosa.
- **P3:** acabamento, acessibilidade ou consistência visual.

## Resumo final

| Situação | Quantidade |
|---|---:|
| Bugs abertos confirmados na varredura original | 17 |
| Novos achados externos pendentes de reconfirmação | 10 |
| Limitações de teste | 2 |
| Fluxos aprovados até agora | 14 |

## Situação após correção e publicação — 12/08/2026

As 27 ocorrências foram tratadas no código e publicadas. A validação combinou 49 testes automatizados, lint, build de produção e navegação real no domínio publicado com o perfil Financeiro da filial `bady-bassitt`.

| IDs | Situação após correção | Evidência principal |
|---|---|---|
| 001, 002, 024, 025, 026 | Corrigidos | Dashboard identifica CMV provisório; DRE mostra percentuais; competências são estáveis; fechamento mensal usa a mesma apuração da DRE; cards não truncam valores. |
| 003, 009, 018, 019 | Corrigidos | Conferências aparecem como controle; folha legada fica fora dos custos fixos atuais; lançamentos e obrigações respeitam a competência selecionada. |
| 004, 007, 013, 014, 015, 016, 017 | Corrigidos | Ações receberam nomes acessíveis; categoria exige confirmação; conferência não falha após salvar; datas parciais não apagam o mês; modais fecham na navegação; data diária usa hoje; logout possui saída imediata e limite de espera. |
| 005, 006, 020, 021 | Corrigidos | RH respeita permissão efetiva; erros aparecem no modal; cargo vazio é explicado; regra 40%/60% foi centralizada; campo monetário mantém `100` como `100,00`. |
| 008, 010 | Corrigidos | Combos impossíveis são rejeitados no servidor e omitidos do cardápio público; pagamento deve ser selecionado ou o cliente confirma explicitamente que será combinado. |
| 011, 012 | Corrigidos | Menu e navegação direta usam as permissões efetivas retornadas pelo servidor. No perfil Financeiro testado, CMV e Configurações não são exibidos. |
| 022, 023 | Corrigidos | Fornecedor e compra exibem validação/erro acionável; compra sem fornecedor oferece atalho para cadastro. |
| 027 | Corrigido | Possíveis duplicidades agora têm ações persistentes `Mesclar` e `Manter separados`; a fusão preserva pagamentos e remove apenas previsões futuras repetidas. |

### Validação publicada

- Backend e frontend publicados na Vercel e migration `202608120006` aplicada no Supabase remoto.
- Lançamentos em agosto exibiram `0 registros em 2026-08`, sem misturar julho.
- Contas a Pagar exibiu somente competência `2026-08`, incluindo o saldo de 60% com vencimento em `07/09/2026` sem mudar sua competência.
- Dashboard e DRE exibiram o mesmo resultado operacional de `-R$ 13.109,92`; o resultado líquido da DRE ficou em `-R$ 13.894,40` após IRPJ/CSLL, diferença agora identificada pela natureza do indicador.
- O combo inválido `COMBO DO REI` deixou de ser publicado; nenhum erro apareceu no console.
- O modal de retirada do RH foi aberto e cancelado em produção, confirmando aviso de preservação do histórico sem alterar o funcionário real.

### Limite consciente do teste

A confirmação final de retirada de um funcionário real e as ações de mesclar/manter duplicidades não foram executadas no ambiente produtivo para evitar alteração destrutiva dos dados existentes. Os contratos do servidor e a migration foram validados automaticamente; a interface e os botões foram validados em produção até o passo anterior à confirmação.

## Cruzamento com relatório complementar

Relatório complementar recebido em 12/08/2026, cobrindo Dashboard, Lançamentos, Contas a Pagar, Fluxo de Caixa, DRE, Fechamento, RH, Estoque, Compras e Fornecedores.

| Item do relatório | Classificação no histórico | Destino |
|---:|---|---|
| 1 | Novo | `QA-20260812-018` |
| 2 | Já encontrado | Complementa `QA-20260812-003`; não duplicado |
| 3 | Novo | `QA-20260812-019` |
| 4 | Novo | `QA-20260812-020` |
| 5 | Já encontrado | Coberto por `QA-20260812-005` e `QA-20260812-006`; não duplicado |
| 6 | Novo | `QA-20260812-021` |
| 7 | Novo, com conflito em relação ao teste anterior | `QA-20260812-022` |
| 8 | Novo, com conflito em relação ao teste anterior | `QA-20260812-023` |
| 9 | Novo, com conflito em relação ao teste anterior | `QA-20260812-024` |
| 10 | Novo | `QA-20260812-025` |
| 11 | Novo | `QA-20260812-026` |
| 12 | Novo | `QA-20260812-027` |

Os itens novos abaixo foram relatados por uma segunda execução de QA, mas ainda não foram reproduzidos durante esta varredura. Quando um novo relato contradiz um fluxo anteriormente aprovado, ele deve ser tratado como possível regressão ou comportamento dependente de dados/permissões até que seja reconfirmado no mesmo tenant, perfil e competência.

## Bugs confirmados

### QA-20260812-001 — Dashboard chama CMV provisório de “CMV Fechado”

- **Prioridade:** P1
- **Tela:** Dashboard
- **Como reproduzir:** abrir o Dashboard em agosto/2026 e observar o card referente a julho/2026.
- **Resultado atual:** o card mostra `CMV Fechado — Julho de 2026 — 46,1%`, embora julho não possua inventário final fechado. Na DRE da mesma competência, o próprio sistema informa que o CMV é provisório.
- **Resultado esperado:** exibir “CMV provisório” ou “Sem fechamento” até existir inventário final fechado; somente usar “CMV Fechado” quando `inventoryCmv.status === CLOSED`.
- **Impacto:** o gestor pode tomar decisão acreditando que a apuração física foi concluída.
- **Evidência técnica:** `executiveDashboardModel.js` calcula o card anterior usando `previous.dre.costOfSales`, sem exigir `previous.dre.cmvStatus === 'CLOSED'`.

### QA-20260812-002 — Percentual de CMV desaparece para recebimentos e CMV fechado

- **Prioridade:** P1
- **Tela:** DRE Mensal
- **Como reproduzir:** registrar um recebimento de compra, abrir a DRE da competência e expandir/observar os detalhes de custos dos produtos vendidos.
- **Resultado atual:** a obrigação `QA AUTO 2026-08-12 — Recebimento 2026-08-12` entra no custo, mas não mostra a porcentagem sobre a receita líquida. O mesmo ocorre com a linha `CMV Fechado | Inventário`.
- **Resultado esperado atualizado:** no modelo provisório, mostrar `(gasto com insumos − Refeição Funcionários) ÷ faturamento oficial × 100`, verde até 35% e vermelho acima de 35%. No CMV fechado, preservar a fórmula por inventário sem descontar refeições.
- **Causa provável:** `DreMonthlyPage.jsx` só considera CMV quando `category === 'CMV | Insumo'`.
- **Impacto:** a regra visual solicitada não funciona justamente na nova arquitetura de compras e inventário.

### QA-20260812-003 — Conferências são exibidas como saídas e podem mostrar sinal duplo negativo

- **Prioridade:** P1
- **Tela:** Financeiro → histórico de lançamentos
- **Como reproduzir:** consultar os registros importados de julho/2026.
- **Resultado atual:** aparecem registros como `Saída - Conferência | Entrada`, quantidade de funcionários formatada como dinheiro e perda negativa como `- R$ -6.00` ou `- R$ -12.00`.
- **Resultado esperado:** lançamentos de controle devem ser identificados como “Controle/Conferência”, contagens não devem usar moeda e valores devem ter apenas um sinal coerente.
- **Complemento do relatório:** entradas diárias importadas da planilha aparecem como `SAÍDA - CONFERÊNCIA | ENTRADA` e com valor negativo. É necessário verificar também o mapeamento persistido, garantindo que entrada/receita não tenha sido transformada em despesa; conferência de caixa não deve compor a DRE.
- **Impacto:** o extrato visual induz interpretação errada e, se o tipo persistido também estiver incorreto, pode contaminar os totais financeiros. A DRE deve continuar ignorando controles de conferência.

### QA-20260812-004 — Botões de custos fixos não possuem nome acessível

- **Prioridade:** P3
- **Tela:** Financeiro → Custos Fixos
- **Como reproduzir:** inspecionar os controles de cada custo com leitor de tela ou árvore de acessibilidade.
- **Resultado atual:** os botões de ações ao lado de diversos custos aparecem apenas como `button`, sem nome.
- **Resultado esperado:** nomes como “Marcar Aluguel como pago”, “Editar Aluguel” e “Arquivar Aluguel”.
- **Impacto:** usuários de tecnologia assistiva não conseguem distinguir as ações e testes automatizados ficam frágeis.

### QA-20260812-005 — RH oferece cadastro que o perfil financeiro não pode concluir

- **Prioridade:** P1
- **Tela:** RH → Funcionários
- **Como reproduzir:** entrar com o perfil Financeiro, clicar em `Cadastrar Funcionário`, preencher os campos e salvar.
- **Resultado atual:** o botão muda para `Salvando...`, retorna ao estado normal, mantém o modal aberto e não apresenta erro. O funcionário não é criado.
- **Resultado esperado:** a ação deve respeitar a permissão efetiva: ou o usuário autorizado consegue cadastrar, ou o botão fica indisponível com explicação clara.
- **Causa confirmada:** a interface expõe o cadastro para o perfil, mas o `POST /hr/employees` aceita somente `tenant_admin`. A falha é colocada em `settingsError`, que não é exibido na tela de RH.
- **Impacto:** o usuário acredita que salvou dados trabalhistas, mas nada é persistido.

### QA-20260812-006 — Cargo obrigatório pode ficar vazio sem qualquer validação

- **Prioridade:** P2
- **Tela:** RH → Funcionários
- **Como reproduzir:** abrir o cadastro quando não existem cargos cadastrados, preencher os demais campos e salvar.
- **Resultado atual:** o seletor mostra `Nenhum resultado encontrado`; ao salvar, a função encerra silenciosamente porque o cargo é obrigatório.
- **Resultado esperado:** informar que é necessário cadastrar/selecionar um cargo e oferecer um atalho para isso.
- **Impacto:** o usuário fica preso em um formulário que aparenta estar completo.

### QA-20260812-007 — Exclusão de categoria do cardápio é imediata e desassocia produtos

- **Prioridade:** P2
- **Tela:** Cardápio → Organização do cardápio
- **Como reproduzir:** clicar no ícone de exclusão de uma categoria.
- **Resultado atual:** a categoria é apagada no primeiro clique, sem confirmação. No servidor, todos os produtos dela recebem `category_id = null` antes da exclusão.
- **Resultado esperado:** apresentar confirmação informando quantos produtos serão afetados e pedir uma decisão explícita sobre mover, manter sem categoria ou cancelar.
- **Impacto:** um clique acidental pode retirar diversos itens da organização do cardápio público.

### QA-20260812-008 — Combo publicado não possui opções e não pode ser comprado

- **Prioridade:** P1
- **Tela:** Cardápio público → `COMBO DO REI`
- **Como reproduzir:** abrir o combo no cardápio público.
- **Resultado atual:** o grupo `ESFIHAS CLÁSSICAS` exige exatamente 4 escolhas, mas mostra `Nenhuma opção disponível neste grupo`; o botão `ADICIONAR AO PEDIDO` permanece desabilitado.
- **Resultado esperado:** listar as opções ativas vinculadas ao grupo ou impedir a publicação do combo enquanto sua configuração estiver incompleta.
- **Impacto:** um produto visível e anunciado por R$ 30,00 é impossível de comprar.

### QA-20260812-009 — Central Financeira soma folha automática aos custos antigos de folha

- **Prioridade:** P1
- **Tela:** Financeiro → Custos Fixos e totalizador
- **Como reproduzir:** abrir os custos fixos com funcionários ativos no RH.
- **Resultado atual:** o sistema mantém simultaneamente `Folha Salarial Real (Automático RH) — R$ 5.034,00`, `Folha Fixo — R$ 3.680,00` e `Folha Extra — R$ 14.370,00`; a Central Financeira apresenta os três dentro dos 16 itens e do total de custos fixos de R$ 30.424,50.
- **Resultado esperado:** ao ativar a folha automática, os custos antigos equivalentes precisam ser arquivados ou marcados claramente como históricos e ficar fora do total atual.
- **Impacto:** o totalizador operacional informa uma despesa corrente inflada. Na DRE de agosto, os custos antigos não apareceram, portanto a divergência está, até aqui, confirmada no resumo da Central Financeira e não no cálculo da DRE desse mês.

### QA-20260812-010 — Cardápio público não oferece forma de pagamento

- **Prioridade:** P2
- **Tela:** Cardápio público → checkout
- **Como reproduzir:** adicionar um produto e tentar escolher o pagamento.
- **Resultado atual:** existe apenas o botão inerte `Pagamento a combinar`; nenhuma forma de pagamento pode ser selecionada. O pedido ainda é aceito sem essa definição.
- **Resultado esperado:** oferecer as formas ativas da filial ou tornar explícito, na confirmação, que o pagamento será combinado e exigir esse aceite.
- **Impacto:** pedidos chegam sem informação necessária para cobrança e conciliação.

### QA-20260812-011 — Usuário sem permissão de CMV recebe formulário completo de edição

- **Prioridade:** P2
- **Tela:** CMV / Ficha Técnica
- **Como reproduzir:** entrar com o perfil Financeiro, que não possui `cmv.view`, preencher um novo insumo e salvar.
- **Resultado atual:** navegação, dados, botões de editar/inativar e formulário de cadastro ficam disponíveis. Somente depois do envio aparece `Você não tem permissão para este recurso`; nada é persistido.
- **Resultado esperado:** ocultar a tela/ações não autorizadas ou disponibilizar uma versão estritamente de leitura, com indicação prévia.
- **Impacto:** a interface promete uma operação que o servidor rejeita e expõe dados fora da matriz de permissões configurada.

### QA-20260812-012 — Configurações permanecem editáveis mesmo com acesso negado

- **Prioridade:** P2
- **Tela:** Configurações
- **Como reproduzir:** abrir a tela com o perfil Financeiro.
- **Resultado atual:** a mensagem de falta de permissão aparece, mas todos os campos, inclusive nova senha, e o botão `Salvar` continuam habilitados.
- **Resultado esperado:** campos e ações devem ficar bloqueados ou a rota deve ser removida da navegação.
- **Impacto:** o usuário pode preencher alterações extensas para descobrir apenas ao final que não consegue salvá-las.

### QA-20260812-013 — Conferência de caixa é salva, mas a tela informa erro

- **Prioridade:** P1
- **Tela:** Fluxo de Caixa
- **Como reproduzir:** preencher e salvar uma conferência diária.
- **Resultado atual:** o registro é efetivamente criado no banco, porém a tela exibe `Cannot read properties of null (reading 'reset')` após o envio.
- **Resultado esperado:** confirmar o salvamento, limpar o formulário com segurança e atualizar a lista/competência correspondente.
- **Causa provável:** acesso tardio a `event.currentTarget.reset()` depois de uma operação assíncrona, quando a referência do evento já está nula.
- **Impacto:** o usuário tende a reenviar e criar duplicidade porque acredita que a primeira gravação falhou.

### QA-20260812-014 — Digitação da competência da DRE apaga o mês

- **Prioridade:** P1
- **Tela:** DRE Mensal
- **Como reproduzir:** focar a competência, selecionar o conteúdo e digitar outra data manualmente.
- **Resultado atual:** durante a digitação parcial, o estado recebe uma competência vazia; o campo zera e o título passa para `DRE — Mês selecionado`.
- **Resultado esperado:** permitir digitar uma data completa e só aplicar o mês quando o valor for válido, mantendo o último mês válido durante a edição.
- **Impacto:** a funcionalidade solicitada de digitar a competência não funciona; somente o seletor de calendário tem chance de funcionar.

### QA-20260812-015 — Modal de categorias continua aberto após mudar de módulo

- **Prioridade:** P3
- **Tela:** Financeiro → Categorias Financeiras / navegação geral
- **Como reproduzir:** abrir `Categorias Financeiras` e navegar diretamente para CMV.
- **Resultado atual:** o modal permanece montado sobre a nova tela e precisa ser fechado manualmente.
- **Resultado esperado:** qualquer mudança de rota deve encerrar diálogos pertencentes à tela anterior.
- **Impacto:** mistura contextos e pode levar o usuário a alterar categorias acreditando estar agindo no novo módulo.

### QA-20260812-016 — Conferência diária abre no primeiro dia do mês, não no dia atual

- **Prioridade:** P2
- **Tela:** Fluxo de Caixa
- **Como reproduzir:** abrir a tela em 12/08/2026.
- **Resultado atual:** o campo `Data` inicia em `01/08/2026`.
- **Resultado esperado:** iniciar em `12/08/2026` (hoje), mantendo a competência atual; o usuário ainda pode alterar.
- **Impacto:** uma conferência diária pode ser lançada no dia errado sem que o operador perceba.

### QA-20260812-017 — Botão “Sair do Reino” pode ficar preso sem encerrar a sessão

- **Prioridade:** P1
- **Tela:** Navegação lateral / autenticação
- **Como reproduzir:** clicar em `Sair do Reino` no ambiente publicado e aguardar.
- **Resultado atual:** após mais de três segundos, a aplicação continua em `/app/bady-bassitt#dashboard`, com o usuário autenticado e o botão ainda visível; não há mensagem de erro nem log de console.
- **Resultado esperado:** encerrar a sessão e redirecionar imediatamente para `/login`, mesmo se a revogação remota falhar ou demorar.
- **Causa provável:** `handleLogout` aguarda indefinidamente `supabase.auth.signOut()`; o `navigate('/login')` está no `finally`, mas só roda quando a promessa termina.
- **Impacto:** especialmente grave em computador compartilhado: o usuário acredita que saiu, mas a sessão permanece aberta.

## Novos achados do relatório complementar — pendentes de reconfirmação

### QA-20260812-018 — Lançamentos mistura competências de julho e agosto

- **Prioridade reportada:** Crítica
- **Tela:** Financeiro → Lançamentos
- **Como reproduzir:** abrir Lançamentos com a competência em agosto/2026.
- **Resultado reportado:** a lista inclui saídas de 17/07, 18/07, 19/07, 20/07 e 21/07.
- **Resultado esperado:** mostrar apenas a competência selecionada ou identificar claramente uma visão de histórico sem filtro mensal.
- **Risco:** mistura operação atual com histórico e torna os totalizadores ambíguos.
- **Validação necessária:** conferir separadamente o filtro da lista e o filtro dos cards, preservando integralmente o DRE histórico validado de julho/2026.

### QA-20260812-019 — Contas a Pagar soma meses futuros na visão de agosto

- **Prioridade reportada:** Crítica
- **Tela:** Contas a Pagar e Dashboard
- **Como reproduzir:** abrir Contas a Pagar em agosto/2026 e comparar lista e card principal.
- **Resultado reportado:** obrigações de setembro e outubro aparecem junto com agosto; o Dashboard mostra `Contas a pagar R$ 41.543,20`, aparentemente incluindo meses futuros.
- **Resultado esperado:** totalizadores devem respeitar a competência selecionada; uma visão de todas as obrigações/futuras precisa ser separada e identificada.
- **Validação necessária:** decompor o valor por competência para confirmar quais parcelas alimentam o card.

### QA-20260812-020 — Regra de competência e vencimento da folha 40%/60% diverge entre telas

- **Prioridade reportada:** Crítica
- **Telas:** RH, Dashboard, Contas a Pagar, DRE e Fechamento
- **Resultado reportado:** Contas a Pagar mostra os 60% de agosto vencendo em `07/09/2026`, enquanto RH/Fechamento exibem `Pagamento 60% 07/08/2026` e o texto `5º dia útil de agosto +2`.
- **Resultado esperado:** os 40% da competência agosto vencem em 20/08; os 60% pertencem à competência agosto e vencem no 5º dia útil de setembro, aplicando de forma única a regra de dias úteis configurada.
- **Correção sugerida pelo QA:** centralizar o cálculo de competência/vencimento da folha e reutilizá-lo em todas as projeções e telas.

### QA-20260812-021 — Máscara de salário converte R$ 100,00 em R$ 1,00

- **Prioridade reportada:** Alta
- **Tela:** RH → Cadastrar Funcionário
- **Como reproduzir:** digitar `100` no campo salário.
- **Resultado reportado:** o campo exibe `1,00`.
- **Resultado esperado:** exibir e persistir `R$ 100,00`.
- **Risco:** salário salvo cem vezes menor por divergência entre reais e centavos.

### QA-20260812-022 — Cadastro de fornecedor pode não salvar e não apresenta feedback

- **Prioridade reportada:** Alta
- **Tela:** Fornecedores → Novo Fornecedor
- **Como reproduzir:** preencher `TESTE QA FORNECEDOR`, selecionar insumos e salvar.
- **Resultado reportado:** o modal permanece aberto, a lista continua vazia e nenhuma mensagem de erro aparece.
- **Resultado esperado:** fechar o modal e incluir o fornecedor na lista; se houver falha ou campo obrigatório ausente, mostrar uma mensagem acionável.
- **Conflito com histórico:** a varredura original aprovou cadastro de fornecedor com prazo D+7 e dois insumos. Repetir com o mesmo tenant, perfil, campos e resposta de rede para distinguir regressão, validação silenciosa ou diferença de permissão/dados.

### QA-20260812-023 — Novo Pedido fica sem saída orientada quando não há fornecedor

- **Prioridade reportada:** Alta
- **Tela:** Compras → Novo Pedido
- **Resultado reportado:** fornecedor vazio, botão de item desabilitado e ação de salvar indisponível, sem orientação suficiente.
- **Resultado esperado:** explicar que um fornecedor é obrigatório e oferecer atalho para cadastrá-lo ou um fluxo guiado equivalente.
- **Conflito com histórico:** a criação de pedido com fornecedor existente foi aprovada; este achado cobre especificamente o estado vazio e pode também ser consequência do `QA-20260812-022`.

### QA-20260812-024 — Dashboard altera o texto da competência sem recalcular os cards

- **Prioridade reportada:** Média
- **Tela:** Dashboard
- **Como reproduzir:** trocar a competência de agosto/2026 para julho/2026.
- **Resultado reportado:** o campo mostra `julho de 2026`, mas os cards continuam com os dados de agosto e o valor interno permanece `2026-08`.
- **Resultado esperado:** atualizar estado canônico, consultas e cards somente após receber uma competência mensal válida.
- **Conflito com histórico:** a matriz anterior marcou a navegação mensal como aprovada; tratar como possível regressão ou falha específica da digitação/controle usado.

### QA-20260812-025 — Dashboard, DRE e Fechamento usam bases financeiras incompatíveis

- **Prioridade reportada:** Média
- **Competência:** agosto/2026
- **Resultado reportado:** Dashboard apresenta resultado operacional de `-R$ 13.109,92`; DRE apresenta resultado líquido de `-R$ 13.894,40`, incluindo imposto; Fechamento apresenta saldo de `-R$ 3.870,00` e somente três itens de RH.
- **Resultado esperado:** cada tela deve declarar e aplicar consistentemente sua base: DRE por competência, Fluxo de Caixa por pagamento e Fechamento integrado com custos fixos, RH e lançamentos.
- **Validação necessária:** montar uma memória de cálculo por origem antes de concluir que toda diferença é bug; resultado operacional e resultado líquido podem divergir legitimamente quando o imposto está explícito.
- **Relação:** complementar ao `QA-20260812-009`, que já identificou duplicidade da folha no totalizador da Central Financeira.

### QA-20260812-026 — Cards de Lançamentos truncam valores monetários

- **Prioridade reportada:** Média
- **Tela:** Financeiro → Lançamentos
- **Resultado reportado:** valores aparecem abreviados como `R$ 5...`, `R$ 2...` e `R$ 3...`.
- **Resultado esperado:** exibir o valor completo ou adotar uma abreviação monetária inequívoca e acessível, com valor integral disponível.
- **Validação necessária:** testar nas larguras desktop e móvel suportadas.

### QA-20260812-027 — Alerta de possíveis duplicidades não oferece resolução nem garante idempotência

- **Prioridade reportada:** Média
- **Tela:** Contas a Pagar
- **Resultado reportado:** aparece o alerta `Contadora × Contador — nomes semelhantes`, mas não existe fluxo claro para revisar, mesclar ou ignorar.
- **Resultado esperado:** impedir duplicidades exatas por chave natural/idempotência e oferecer ação explícita para suspeitas por semelhança.
- **Critério sugerido pelo QA:** considerar tipo, competência, vencimento e origem, sem apagar automaticamente registros históricos legítimos.

## Regras de integridade destacadas no relatório complementar

- CMV deve obedecer à categoria econômica **INSUMO**, independentemente da forma de pagamento. Pix, boleto ou dinheiro alteram Fluxo de Caixa e saldo físico, não a classificação econômica do CMV.
- O DRE histórico de julho/2026 deve ser preservado integralmente. Correções de filtro, apresentação e importação não podem recalcular, sobrescrever ou destruir números históricos já validados sem uma migração auditável e aprovação explícita.

## Limitações do ambiente de teste

### QA-ENV-20260812-001 — Download de Excel não emitiu evento observável

- O botão **Excel** do pedido foi acionado, mas o navegador integrado não entregou um evento de download nem apresentou erro de console.
- O código utiliza download por `blob` através do `xlsx`, comportamento que pode ser bloqueado pelo navegador integrado.
- **Status:** não classificado como bug do produto sem repetir em Chrome/Edge comum.

### QA-ENV-20260812-002 — Override de viewport móvel não foi aplicado pelo navegador integrado

- A auditoria programática das 14 rotas não encontrou overflow horizontal no viewport efetivo entre 862 e 877 px.
- O navegador integrado aceitou o comando de 390 × 844, mas continuou reportando a largura anterior; por isso não seria honesto declarar os breakpoints de celular como aprovados.
- **Status:** repetir a inspeção visual em Chrome/Edge real a 390 × 844 antes de encerrar a cobertura móvel.

## Fluxos aprovados

- Login do usuário financeiro e abertura da filial `bady-bassitt`.
- Carregamento isolado: módulos sem permissão não derrubam o painel inteiro.
- Cadastro de fornecedor com prazo D+7 e dois insumos vinculados.
- Criação de pedido usando somente insumos vinculados ao fornecedor.
- Recebimento parcial: 4 de 10 unidades, com saldo restante de 6.
- Atualização do estoque para 4 unidades e custo real de R$ 5,50.
- Geração automática de obrigação de R$ 22,00 com competência do recebimento e vencimento D+7.
- Modal de pagamento trouxe corretamente origem `BANK` e método `BOLETO` sugeridos pelo fornecedor.
- Arquivamento de funcionário removeu-o da folha sem apagar o cadastro histórico.
- Histórico do funcionário arquivado permaneceu acessível, inclusive a consulta de pagamentos anteriores.
- Reativação trouxe o funcionário de volta à folha uma única vez, sem duplicação.
- Carrinho público permitiu adicionar, aumentar, reduzir e remover um item comum corretamente.
- Descrição longa do cardápio público alternou corretamente entre `Ver mais` e `Ver menos`.
- Pedido público comum criou cliente e pedido, esvaziou o carrinho e retornou o protocolo `WEB-1208-18133`.

## Limpeza dos dados de teste

- Removidos exclusivamente os registros com o marcador `QA AUTO 2026-08-12`: fornecedor e vínculos, pedido de compra, recebimento, obrigação, movimentos e histórico de preço, funcionário, seis obrigações de folha, cliente e pedido público, conferência de caixa e rascunho de inventário com 50 itens.
- O custo da `FARINHA`, alterado pelo recebimento de teste, foi restaurado de R$ 5,50 para R$ 3,20, igual ao `package_cost` anterior.
- Consulta final no banco confirmou zero registros remanescentes com o marcador nas entidades auditadas e nenhum movimento restante da farinha.

## Matriz de cobertura

| Área | Navegação | Leitura | Criação | Edição | Exclusão/estorno | Cálculo/persistência | Situação |
|---|---|---|---|---|---|---|---|
| Login/permissões | OK | OK | N/A | N/A | Logout com bug | Permissões com bugs | Concluído |
| Dashboard | OK | OK | N/A | Navegação mensal OK | N/A | Bug encontrado | Concluído |
| Cardápio | OK | OK | Modal validado | Organização validada | Exclusão com bug | Persistência OK | Concluído |
| CMV/Ficha técnica | OK | OK | Bloqueado pela permissão | Bloqueado pela permissão | Bloqueado pela permissão | Bugs encontrados | Concluído |
| Fornecedores | OK | OK | OK | Dados vinculados OK | Limpeza validada | OK | Concluído |
| Compras | OK | OK | OK | N/A na UI atual | Limpeza validada | Recebimento parcial OK | Concluído |
| Estoque/Inventário | OK | OK | Rascunho OK | Contagem validada | Limpeza validada | Recebimento OK | Concluído |
| Lançamentos | OK | OK | Validação OK | Custos exibidos | Não alterado | Bugs encontrados | Concluído |
| Contas a pagar | OK | OK | Automático OK | Modais validados | N/A | Sugestões OK | Concluído |
| Fluxo de caixa | OK | OK | Grava, mas mostra erro | N/A | Limpeza validada | Bug encontrado | Concluído |
| Saldos | OK | OK | Modais validados | Modais validados | N/A | Estados coerentes | Concluído |
| DRE | OK | OK | N/A | Competência com bug | N/A | Bugs encontrados | Concluído |
| Extrato/Fechamento | OK | OK | N/A | Leitura mensal validada | N/A | Totais renderizados | Concluído |
| RH | OK | OK | Permissão com bug | Reativação OK | Arquivamento OK | Histórico preservado | Concluído |
| Configurações | OK | OK | N/A | Permissão com bug | N/A | Bloqueio inconsistente | Concluído |
| Cardápio público | OK | OK | Pedido comum OK | Carrinho OK | Remoção OK | Combo/pagamento com bugs | Concluído |
| Responsividade | Auditada | Auditada | N/A | N/A | N/A | Sem overflow no viewport efetivo; override móvel inconclusivo | Parcial |
