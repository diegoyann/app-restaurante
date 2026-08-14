---
name: iniciar
description: Classifica e executa automaticamente uma solicitacao de desenvolvimento como bug ou feature. Use quando o usuario iniciar uma mensagem com /iniciar ou $iniciar seguido da descricao do problema ou funcionalidade desejada.
---

# Entrada Unica de Desenvolvimento

Use o texto apos `/iniciar` ou `$iniciar` como a solicitacao completa. Nao peca
que o usuario execute skills subsequentes.

## Triagem

1. Classifique como **bug** quando o comportamento atual estiver incorreto,
   regressivo, falhar ou divergir do esperado. Classifique como **feature**
   quando introduzir capacidade, fluxo, entidade ou regra novos.
2. Informe a classificacao e o risco em uma linha. Faca suposicoes razoaveis e
   registre-as na spec.
3. Pare apenas se faltar uma decisao material de produto, seguranca, autorizacao
   ou dado irreversivel. Faca no maximo tres perguntas objetivas nesse caso.
4. Trate pagamentos, folha, ponto, pedidos, estoque, tenants, autenticacao e
   migracoes Supabase como **criticos**.

## Execucao Automatica

Para **bug nao critico**, execute internamente, nesta ordem:

1. `$speckit-specify`, descrevendo atual, esperado, reproducao e impacto.
2. `$speckit-plan`.
3. `$speckit-tasks`, com o teste de regressao antes da correcao.
4. `$speckit-analyze`; corrija toda inconsistencia critica.
5. `$speckit-implement`, execute os gates afetados e reporte o resultado.

Para **feature** ou **bug critico**, execute internamente, nesta ordem:

1. `$speckit-specify`.
2. `$speckit-clarify` somente se restar ambiguidade de alto impacto.
3. `$speckit-plan` com contratos, dados, autorizacao, rollout e recuperacao.
4. `$speckit-checklist` orientada ao risco da solicitacao.
5. `$speckit-tasks`, com testes antes de toda mudanca de comportamento.
6. `$speckit-analyze`; nao implemente enquanto existir falha critica.
7. `$speckit-implement`, execute os gates afetados e reporte o resultado.
8. `$speckit-converge` para registrar desvios e pendencias pos-entrega.

## Fechamento Git Obrigatorio

1. Antes de iniciar, registre o estado de `git status --porcelain` como linha
   de base e deixe o hook `speckit.git.feature` criar a branch
   `codex/<numero>-<descricao>`.
2. Depois de todos os gates passarem, execute `$speckit-git-validate` e revise
   os arquivos alterados desde a linha de base.
3. Nunca use `git add .` ou `git add -A`. Prepare somente os arquivos criados
   ou alterados por esta solicitacao, incluindo `specs/<feature>/`.
4. Se um arquivo da solicitacao ja estivesse alterado na linha de base, pare o
   fechamento automatico; nao misture trabalho preexistente no commit.
5. Valide o indice com `git diff --cached --check`, crie um unico commit
   convencional (`fix:` para bug; `feat:` para feature) e inclua a atribuicao
   exigida pelo projeto.
6. Faca `git push -u origin HEAD`. Nunca envie diretamente para `main`; se a
   branch atual for `main`, crie a branch de feature antes do desenvolvimento.
7. Informe hash do commit, branch remota e qualquer arquivo nao enviado.

## Publicacao Vercel

1. Publique somente depois de commit, push e todos os gates locais passarem.
2. Identifique os projetos afetados: `back-end` para API e
   `front-end/app/mock` para a aplicacao web. Cada diretorio ja possui seu
   proprio vinculo `.vercel`.
3. Por padrao, publique em producao com `vercel --prod --yes` no diretorio
   afetado. Capture a URL e confirme que o deploy terminou com sucesso antes de
   concluir.
4. Use `vercel --yes` somente quando o usuario pedir explicitamente preview ou
   homologacao. Nunca finalize uma solicitacao validada sem publicar producao.
5. Nao exponha tokens, variaveis de ambiente ou conteudo de arquivos `.env`.
   Se a CLI nao estiver autenticada ou o deploy falhar, reporte o erro e nao
   alegue publicacao.
6. Alteracoes de schema Supabase exigem validacao propria; deploy na Vercel nao
   executa nem substitui migration de banco de dados.

## Regras de Entrega

- Leia e cumpra `.specify/memory/constitution.md` em todas as fases.
- Crie artefatos em `specs/<feature>/`; nao sobrescreva especificacoes anteriores.
- Nao altere codigo antes da spec, plano e analise exigidos pela classificacao.
- Para mudancas diretas sem comportamento, informe que o fluxo foi dispensado e
  valide somente o escopo afetado.
- Ao terminar, reporte classificacao, arquivos alterados, testes executados e
  qualquer decisao ou risco pendente, alem do commit, push e URLs de deploy.
