# Contract: Categorias Financeiras no Bootstrap

## Entrada

Leitura autenticada do bootstrap de uma unidade acessível ao usuário.

## Saída relevante

```json
{
  "financeExpenseCategories": [
    { "id": "default-expense-supplies", "name": "Compra de Insumos" }
  ]
}
```

## Regras de compatibilidade

- O formato de cada item permanece `{ id, name }`.
- Categorias persistidas mantêm seus IDs e nomes atuais.
- Quando não houver categoria persistida, a lista contém exatamente: Compra de Insumos, Fornecedor, Manutenção, Marketing, Imposto, Retirada e Outras Saídas.
- A existência de ao menos uma categoria persistida desativa todo o fallback.
- Erro ao consultar a tabela continua produzindo erro do bootstrap; não retorna uma lista padrão enganosa.

## Autorização e tenant

- A rota e o bootstrap continuam usando a identidade e o tenant já resolvidos.
- O fallback é estático, não consulta nem transporta dados entre tenants.

## Escrita de lançamento

- O contrato de criação não muda.
- A categoria selecionada continua sendo enviada como nome no campo de referência/categoria.
- Sucesso, validação e erros permanecem com o contrato existente.
