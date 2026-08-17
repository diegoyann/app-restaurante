# Data Model

## Lançamento financeiro existente

- `id`: identidade imutável da exclusão.
- `tenant_id`: limite obrigatório de leitura e escrita.
- `transaction_date`: data civil `YYYY-MM-DD`, sem hora ou fuso.
- `source_type` / `source_id`: origem existente; inalterados.
- demais valores, categorias e origens: inalterados.

## Transições

- Criar: data civil válida → registro persistido com o mesmo valor.
- Excluir existente: presente → ausente.
- Excluir ausente: ausente → ausente (sucesso idempotente).
- Falha de exclusão: persistência inalterada e item mantido na tela.

Não há alteração de schema.
