# Auditoria do DRE — Julho/2026

Filial auditada: `bady-bassitt`  
Competência: `2026-07`

## Conclusão

O CMV não mudou. A queda do resultado líquido de **R$ 2.410,60** para
**R$ 210,60** foi causada por duas alterações retroativas comprovadas:

1. A rotina nova de folha criou **R$ 3.800,00** em obrigações RH para Fábio e
   Carol em Julho, apesar de a folha consolidada de **R$ 3.680,00** já ter sido
   importada da planilha.
2. A regra semanal nova de Marketing, de **R$ 400,00**, sobrescreveu o valor
   histórico importado de Julho, que era **R$ 2.000,00**. Isso reduziu a despesa
   em **R$ 1.600,00**.

Efeito líquido indevido: `R$ 3.800,00 - R$ 1.600,00 = R$ 2.200,00`.

`R$ 2.410,60 - R$ 2.200,00 = R$ 210,60`, exatamente o valor corrompido observado.

## Comparação por componente

| Componente | Original | Corrompido | Restaurado |
|---|---:|---:|---:|
| Receita bruta | R$ 59.438,77 | R$ 59.438,77 | R$ 59.438,77 |
| Deduções da receita | R$ 2.008,94 | R$ 2.008,94 | R$ 2.008,94 |
| Receita líquida/oficial | R$ 57.429,83 | R$ 57.429,83 | R$ 57.429,83 |
| CMV / insumos | R$ 26.497,52 | R$ 26.497,52 | R$ 26.497,52 |
| Folha fixa | R$ 3.680,00 | R$ 7.480,00 | R$ 3.680,00 |
| Folha extra | R$ 14.370,00 | R$ 14.370,00 | R$ 14.370,00 |
| Refeições | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| Marketing | R$ 2.000,00 | R$ 400,00 | R$ 2.000,00 |
| Impostos | R$ 784,48 | R$ 784,48 | R$ 784,48 |
| Outros custos fixos | R$ 7.210,02 | R$ 7.210,02 | R$ 7.210,02 |
| Outras despesas | R$ 477,21 | R$ 477,21 | R$ 477,21 |
| **Resultado líquido** | **R$ 2.410,60** | **R$ 210,60** | **R$ 2.410,60** |

## Evidências utilizadas

- Snapshot imutável `DRE_2026-07_BEFORE_OBLIGATIONS`, gravado antes da evolução
  das obrigações financeiras.
- Planilha original `planilha pro sistema.xlsx`, cujo saldo é R$ 2.410,60.
- Obrigações persistidas de Julho e seus horários de criação/atualização.
- Cálculo reproduzido pelo script `back-end/scripts/audit-historical-month.mjs`.

Nenhum lançamento compensatório foi criado para “fazer bater”. A restauração
remove somente as obrigações RH duplicadas sem pagamentos e devolve Marketing
ao valor original comprovado.

## Proteções implementadas

- Salário e atributos derivados passam a ter vigência mensal por funcionário.
- Configurações de folha/RH passam a ter vigência mensal.
- Custos recorrentes passam a registrar seu histórico de vigência.
- Uma competência fechada bloqueia alterações em obrigações, pagamentos,
  transações, conferências de caixa, presenças, ajustes e fechamentos de extras.
- Reabertura exige ação explícita e motivo.
- O fechamento integrado passa a persistir o snapshot completo da DRE.
- Julho/2026 é restaurado e marcado como `closed`.

## Critério de regressão

Com Julho fechado, alterar salário, divisão de pagamento, configuração de RH ou
custo recorrente em Agosto não pode modificar nenhuma linha fonte de Julho nem
o resultado líquido de R$ 2.410,60.

## Validação em produção

- Migrations aplicadas: `202608140001` e `202608140002`.
- Backend publicado: `https://rei-das-esfihas-backend.vercel.app`.
- Frontend publicado: `https://rei-das-esfihas-frontend.vercel.app`.
- Health do backend: `status: ok`.
- Auditoria após o deploy: receita líquida R$ 57.429,83; CMV R$ 26.497,52;
  folha fixa R$ 3.680,00; folha extra R$ 14.370,00; Marketing R$ 2.000,00;
  zero obrigações RH duplicadas; resultado líquido R$ 2.410,60; fechamento
  `closed`.
- O bundle publicado foi verificado usando a URL do backend de produção e sem
  referência a `localhost`.
