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

## Regras de Entrega

- Leia e cumpra `.specify/memory/constitution.md` em todas as fases.
- Crie artefatos em `specs/<feature>/`; nao sobrescreva especificacoes anteriores.
- Nao altere codigo antes da spec, plano e analise exigidos pela classificacao.
- Para mudancas diretas sem comportamento, informe que o fluxo foi dispensado e
  valide somente o escopo afetado.
- Ao terminar, reporte classificacao, arquivos alterados, testes executados e
  qualquer decisao ou risco pendente.
