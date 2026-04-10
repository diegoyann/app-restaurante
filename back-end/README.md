# Backend de Regras de Folha para Vercel

Base mínima para começar a regra de:

- vale salarial
- pagamento final
- percentual do vale
- dias de pagamento
- ajuste automático para dia útil

## Stack correta para Vercel

- linguagem: `JavaScript / Node.js`
- arquitetura: `Vercel Functions`
- formato: endpoints em `/api`

Node é aceito no Vercel. O que não faz sentido lá é depender de servidor Express rodando fixo como se fosse VPS.

## Rodar localmente

Você precisa do Vercel CLI:

```bash
npm install -g vercel
```

Depois:

```bash
vercel dev
```

Servidor local padrão do Vercel CLI:

```text
http://localhost:3000
```

## Endpoints

### Health

```http
GET /health
```

### Configuração da folha

```http
GET /api/payroll/config
PUT /api/payroll/config
```

Exemplo de payload:

```json
{
  "advancePercentage": 40,
  "advanceDay": 15,
  "advanceBusinessDayPolicy": "previous",
  "finalPaymentDay": 5,
  "finalPaymentMonthOffset": 1,
  "finalPaymentBusinessDayPolicy": "previous",
  "holidays": ["2026-05-01", "2026-05-21"]
}
```

### Funcionários

```http
GET /api/payroll/employees
```

### Simulação da folha

```http
GET /api/payroll/preview?month=2026-04
```

## Regras implementadas

- `advancePercentage`: percentual do salário pago no vale
- `advanceDay`: dia base do vale
- `finalPaymentDay`: dia base do pagamento final
- `finalPaymentMonthOffset`: se o pagamento final cai no mesmo mês (`0`) ou no mês seguinte (`1`)
- `advanceBusinessDayPolicy` e `finalPaymentBusinessDayPolicy`:
  - `none`
  - `previous`
  - `next`
- `holidays`: lista opcional de feriados em `YYYY-MM-DD`

## Estrutura

```text
api/
  health.js
  payroll/
    config.js
    employees.js
    preview.js
src/
  data/
  services/
  utils/
```

## Observação importante

Ainda é backend inicial com armazenamento em memória. Em ambiente serverless isso é ainda mais frágil, porque a instância pode ser reciclada a qualquer momento. Então isso serve para validar regra, não para produção.
