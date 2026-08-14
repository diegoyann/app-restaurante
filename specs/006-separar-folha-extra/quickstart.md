# Quickstart de Validacao: Separar Folha Extra por Grupo

## Pre-requisitos

- Dependencias instaladas pelo `package-lock.json` de `front-end/app/mock`.
- Massa com a semana 10/08/2026 a 16/08/2026 contendo ao menos um extra de cozinha e um motoboy, incluindo pagamento parcial e taxa de entrega.

## Gates automatizados

Executar em `front-end/app/mock`:

```powershell
node --test "src/**/*.test.mjs"
npm run lint
npm run build
```

Resultado esperado: todos os testes passam, lint sem erros e build de producao concluido.

## Cenario 1: cards e vencimentos

1. Abrir Financeiro > Contas a Pagar na competencia 08/2026.
2. Localizar os cards de cozinha e motoboy da semana 10/08/2026 a 16/08/2026.
3. Esperar cozinha com vencimento 17/08/2026 e motoboy com vencimento 20/08/2026.
4. Conferir que previsto, pago e aberto de cada card equivalem apenas as linhas daquele grupo.

## Cenario 2: detalhamento individual

1. Expandir cozinha e verificar ausencia de motoboys e presenca de tipos/quantidades de diaria.
2. Expandir motoboy e verificar ausencia de cozinha, separacao entre diarias e taxas e ausencia de refeicao no total.
3. Acionar Gerenciar/Pagar e verificar que a obrigacao aberta e a individual selecionada.

## Cenario 3: exportacoes

1. Exportar Excel de cozinha e conferir identificacao, colunas e somente funcionarios de cozinha.
2. Exportar Excel de motoboy e conferir identificacao, colunas e somente motoboys.
3. Confirmar que os totais de cada arquivo fecham com o respectivo card.

## Cenario 4: integridade e recuperacao

1. Recarregar e repetir exportacoes; confirmar que nenhuma obrigacao ou pagamento novo surge.
2. Conferir que itens historicos e IDs individuais permanecem inalterados.
3. Se houver cargo ausente, confirmar que a obrigacao permanece visivel individualmente e nao entra em nenhum dos dois totais.

## Rollback

Reverter o commit de frontend e publicar novamente. Nao ha migration, transformacao de dados ou acao compensatoria no banco.

## Evidencia de validacao local (2026-08-14)

- Testes direcionados antes da implementacao: 3 falhas esperadas (export ausente e workbooks genericos).
- Testes direcionados depois da implementacao: 9/9 aprovados.
- Suite completa do frontend: 69/69 testes aprovados.
- Lint do frontend: aprovado, zero erros.
- Build de producao do frontend: aprovado com 1.838 modulos transformados.
- Escopo do codigo: somente `AccountsPayablePage.jsx`, `payrollGroupingModel.js`, `payrollWorkbook.js` e seus dois testes; backend, RH e Supabase inalterados.
