# ADR-002 — Fronteiras do módulo Financeiro

## Status

Aceito em 2026-08-12.

## Contexto

A antiga tela `Lançamentos` misturava registro manual, cadastro recorrente, baixa de pagamento, categorias, indicadores e histórico importado. O antigo `Fechamento` também combinava caixa e competência sem apresentar saldos e inventário. Isso permitia dupla contagem e tornava impossível explicar de qual regime vinha cada número.

## Decisão

- **DRE** reconhece receitas e despesas pela competência econômica.
- **Cadastros recorrentes** são regras mestres; não possuem ação de “pago”.
- **Contas a Pagar** materializa obrigações mensais por competência e vencimento.
- **Fluxo de Caixa** contém somente valores realizados e conferência física diária.
- **Saldos** controla abertura, fechamento, transferências e diferenças de banco e dinheiro.
- **Fechamento** é uma projeção final, somente leitura, que consolida DRE, Fluxo, Saldos, obrigações e Estoque sem fundir suas bases.
- **Lançamentos** contém apenas entradas e saídas manuais e separa visualmente registros importados.

## Consequências

- Pagar uma obrigação cria movimento realizado, mas não duplica a despesa na DRE.
- Alterar um cadastro recorrente afeta novas obrigações; histórico pago permanece imutável.
- O fechamento só é considerado pronto quando há conferência de caixa, saldos fechados e inventário fechado.
- Dados importados continuam disponíveis, mas não competem visualmente com a operação manual cotidiana.

## Validação

- Testes unitários isolam competências e comprovam que pagamentos não duplicam a DRE.
- O modelo de fechamento possui teste próprio para as quatro bases independentes.
- A validação de interface deve cobrir as seis rotas financeiras e os breakpoints móvel e desktop.
