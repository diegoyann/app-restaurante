# Financial Integrity Checklist: Corrigir Lançamentos Financeiros

**Purpose**: Revisar a qualidade dos requisitos de data civil e exclusão persistente
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Reviewer-owned requirements-quality artifact; itens novos permanecem sem marcação.

## Date Requirements

- [ ] CHK001 A definição de data civil distingue claramente calendário local de instante UTC? [Clarity, Spec §FR-001 a §FR-004]
- [ ] CHK002 Os requisitos cobrem entrada, saída, persistência, exibição, filtro e reload? [Completeness, Spec §FR-001 a §FR-004]
- [ ] CHK003 As bordas de mês, ano e horário estão documentadas sem ambiguidade? [Coverage, Edge Cases]

## Deletion and Integrity

- [ ] CHK004 A exclusão persistente está distinguida de remoção visual? [Clarity, Spec §FR-005 a §FR-008]
- [ ] CHK005 ID individual, tenant e autorização estão definidos como limites obrigatórios? [Security, Spec §FR-009]
- [ ] CHK006 Retry, ausência prévia e falha de rede têm resultados explícitos? [Recovery, Spec §FR-009 e §FR-010]
- [ ] CHK007 A preservação de outros lançamentos e fontes está claramente delimitada? [Scope, Spec §FR-011]

## Acceptance Quality

- [ ] CHK008 Os critérios permitem provar 14/08/2026 em todas as camadas sem mudança de dia? [Measurability, Spec §SC-001 e §SC-002]
- [ ] CHK009 Os critérios exigem ausência após reload e sincronização? [Measurability, Spec §SC-003]
- [ ] CHK010 A exigência de regressão antes da correção está rastreável aos dois bugs? [Traceability, Spec §FR-012]

## Notes

- `[x]` significa aprovação humana da qualidade dos requisitos, não implementação.
