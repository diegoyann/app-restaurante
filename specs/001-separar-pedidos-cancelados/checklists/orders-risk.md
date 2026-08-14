# Checklist de qualidade de requisitos: Separação de pedidos cancelados

**Purpose**: Revisar clareza, completude e risco dos requisitos de pedidos críticos.
**Created**: 2026-08-14
**Ownership**: Este checklist é do revisor; itens marcados representam qualidade dos requisitos, não conclusão da implementação.

## Completude de requisitos

- [ ] CHK001 Os critérios definem explicitamente quais estados pertencem a Ativos e a Histórico? [Completude, Spec §FR-001–FR-002]
- [ ] CHK002 Os requisitos delimitam a competência que rege cada uma das duas visualizações? [Completude, Spec §FR-001–FR-002]
- [ ] CHK003 A preservação de registro, status, motivo e trilha de auditoria está especificada para o cancelamento? [Completude, Spec §FR-003]

## Clareza e consistência

- [ ] CHK004 A expressão de cancelamento persistida e o rótulo apresentado estão desambiguados? [Clareza, Assumptions]
- [ ] CHK005 Os requisitos impedem que um mesmo pedido pertença simultaneamente às duas abas da mesma competência? [Consistência, Contract]
- [ ] CHK006 Os critérios de atualização imediata e após novo carregamento usam a mesma fonte de verdade? [Consistência, Spec §FR-004–FR-005]

## Cobertura de cenário e risco

- [ ] CHK007 Os requisitos abordam lista vazia, competência diferente e pedido já recebido? [Cobertura, Edge Cases]
- [ ] CHK008 Os requisitos preservam explicitamente os limites de estoque, financeiro, fornecedores e recebimentos? [Cobertura, Spec §FR-006]
- [ ] CHK009 Os requisitos descrevem comportamento de falha e recuperação para tentativa de cancelamento não concluída? [Cobertura, Risk]

## Mensurabilidade e rastreabilidade

- [ ] CHK010 Cada requisito funcional possui cenário de aceite ou critério de sucesso rastreável? [Rastreabilidade, Spec §FR-001–FR-006]
- [ ] CHK011 Os resultados de sucesso permitem medir a ausência total de cancelados em Ativos e a inclusão exclusiva no Histórico? [Mensurabilidade, Spec §SC-001–SC-004]

## Notes

- A solicitação define escopo, estados e roteiro de aceite de forma suficiente; este artefato mantém a revisão de risco registrada.
