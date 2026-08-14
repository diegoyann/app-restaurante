# Implementation Plan: Separar Folha Extra por Grupo

**Branch**: `codex/006-separar-folha-extra` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-separar-folha-extra/spec.md`

## Summary

Separar as obrigacoes `FOLHA_EXTRA` por periodo e classificacao do funcionario, produzindo grupos `COZINHA` e `MOTOBOY` com vencimento recebido da obrigacao individual. Adaptar o card e o detalhamento de Contas a Pagar para mostrar composicoes especificas e adaptar a planilha para nomes, colunas e arquivos exclusivos por grupo. A API ja fornece `payrollDetail.role`, composicao individual e `dueDate`; a regra de RH ja calcula segunda para cozinha e quinta para motoboy, portanto o ajuste nao exige mudanca de persistencia, autorizacao ou regra financeira no servidor.

## Technical Context

**Language/Version**: JavaScript ESM, React 19 e Node.js conforme os manifests atuais

**Primary Dependencies**: React, Vite, SheetJS (`xlsx`), Node Test Runner

**Storage**: Supabase/PostgreSQL existente; nenhuma mudanca de schema ou dado

**Testing**: `node --test "src/**/*.test.mjs"`, ESLint e build Vite em `front-end/app/mock`

**Target Platform**: Aplicacao web responsiva implantada na Vercel

**Project Type**: Aplicacao web com frontend React e API Node; somente frontend afetado nesta entrega

**Performance Goals**: Agrupar e exportar as obrigacoes do mes sem chamada adicional e sem degradacao perceptivel em relacao a lista atual

**Constraints**: Preservar IDs e objetos de obrigacao individuais; nao recalcular regras financeiras no frontend; nao misturar funcionarios sem classificacao; nao alterar RH, API, banco ou outros cards financeiros

**Scale/Scope**: Uma tela, dois modelos puros e seus testes; dados limitados as obrigacoes da competencia selecionada

## Constitution Check

- [x] Requirements include measurable acceptance criteria, edge cases, and affected domains.
- [x] Test strategy maps every behavior change to unit, integration, or E2E coverage before implementation tasks.
- [x] Financial, HR, order, inventory, tenant, or migration impact is stated; where applicable, historical-data safety, idempotency, and recovery are designed.
- [x] API changes define validation, authorization, tenant scoping, and error contract; frontend changes keep business rules server-side.
- [x] Affected commands and release-quality gates are listed below.

**Gate result**: PASS — o frontend apenas classifica pela funcao/cargo ja retornado, agrega objetos existentes e exibe `dueDate` fornecido pelo servidor. Nenhuma regra de pagamento, autorizacao, tenant ou persistencia muda.

## Project Structure

### Documentation (this feature)

```text
specs/006-separar-folha-extra/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── payroll-extra-groups.md
├── checklists/
│   ├── requirements.md
│   └── financial-integrity.md
└── tasks.md
```

### Source Code (repository root)

```text
front-end/app/mock/src/features/finance/
├── AccountsPayablePage.jsx
├── payrollGroupingModel.js
├── payrollGroupingModel.test.mjs
├── payrollWorkbook.js
└── payrollWorkbook.test.mjs

back-end/src/modules/hr/
├── workforceService.js                 # inspecionado; inalterado
└── weeklyExtraModel.test.js            # regra existente; inalterada

back-end/src/modules/finance/
├── obligationsService.js               # contrato existente; inalterado
└── extraObligationModel.js              # obrigacao individual; inalterada
```

**Structure Decision**: Concentrar a mudanca na camada de apresentacao do frontend. `payrollGroupingModel.js` cria grupos derivados sem mutar obrigacoes; `AccountsPayablePage.jsx` apresenta card/detalhamento; `payrollWorkbook.js` gera a exportacao especifica. O backend permanece fonte de verdade para vencimento, totais, autorizacao e identidade individual.

## Design and Delivery Decisions

- A classificacao sera normalizada a partir de `payrollDetail.role`: valores contendo `moto` ou `entrega` sao `MOTOBOY`; demais cargos nao vazios sao `COZINHA`, coerente com a regra existente do servidor.
- Obrigacoes sem cargo reconhecivel nao entram nos dois grupos; permanecem fora do conjunto agrupado e, assim, continuam visiveis como obrigacoes individuais para correcao, sem contaminar totais.
- A chave do grupo inclui periodo e tipo. O vencimento do grupo vem das obrigacoes classificadas e deve ser uniforme dentro do grupo; nenhuma data sera recalculada na interface.
- O detalhamento de cozinha omite taxas de entrega e destaca tipos/quantidades de diaria. O de motoboy separa diarias e taxas; refeicao nao existe no total da obrigacao nem no contrato de exportacao.
- A planilha tera layout, titulo, aba e filename distintos por tipo de extra.
- Rollback: reverter os arquivos de frontend desta feature. Como nao ha migration nem escrita nova, nao existe compensacao de dados.
- Rollout: validar testes, lint e build; commit/push da branch; deploy de producao apenas de `front-end/app/mock`.

## Test Strategy and Quality Gates

1. Antes da implementacao, atualizar testes do agrupador para exigir dois grupos, filtros exclusivos, vencimentos e preservacao das obrigacoes individuais.
2. Antes da implementacao da exportacao, atualizar testes da planilha para exigir arquivos/colunas exclusivos e ausencia do grupo oposto.
3. Executar todos os testes do frontend: `node --test "src/**/*.test.mjs"`.
4. Executar lint do frontend: `npm run lint`.
5. Executar build de producao do frontend: `npm run build`.

## Constitution Re-check After Design

- [x] A rastreabilidade cobre FR-001 a FR-016 por cenarios, contrato e tarefas planejadas.
- [x] Testes precedem alteracoes nos tres arquivos de comportamento.
- [x] Integridade financeira e historica e preservada por agregacao derivada e ausencia de escrita/migration.
- [x] O backend continua responsavel por vencimento, pagamento, autorizacao e tenant; o frontend nao replica essas regras.
- [x] Gates e deploy afetado estao explicitamente delimitados.

**Post-design gate result**: PASS.

## Complexity Tracking

Sem violacoes ou complexidade adicional que exija justificativa.
