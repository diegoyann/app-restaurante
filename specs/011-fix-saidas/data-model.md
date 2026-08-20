# Data Model: Categorias de Saída no Bootstrap

## Categoria financeira de saída

- `id`: identificador estável no contrato. Para categoria própria, vem do registro persistido; para fallback, é um identificador interno determinístico.
- `name`: nome visível e valor enviado no lançamento.
- `source` (conceitual, não exposto): `tenant` quando persistida ou `default` quando oferecida em memória.

### Regras

- Nomes do fallback são únicos.
- Lista persistida vazia resolve para exatamente sete categorias padrão.
- Lista persistida não vazia preserva exatamente seus itens e ordem.
- A resolução não grava, atualiza ou remove registros.
- Um erro de consulta interrompe a projeção antes da resolução.

## Unidade/tenant

- Delimita a consulta das categorias persistidas e o lançamento financeiro.
- O fallback não contém referência a outro tenant e é igual para unidades sem cadastro.

## Lançamento financeiro

- Continua armazenando a categoria pelo nome escolhido.
- Nenhum campo, relacionamento ou transição de estado é alterado nesta correção.

## Transições relevantes

```text
consulta válida com itens -> mapear itens do tenant -> retornar
consulta válida vazia     -> copiar categorias padrão -> retornar
consulta com erro          -> propagar falha -> não retornar fallback
```
