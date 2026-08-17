# Contract: Datas e Exclusão de Lançamentos

## POST/PUT de transação

- `date` obrigatório no formato exato `YYYY-MM-DD` e válido no calendário.
- A resposta retorna `transaction.date` idêntico ao dia aceito.
- Timestamp ou data impossível retorna erro de validação.
- Autorização e tenant permanecem obrigatórios.

## DELETE de transação

- Entrada: `{ "id": "<id individual>" }`.
- A remoção é limitada ao tenant resolvido pela sessão.
- Registro existente em competência aberta é removido persistentemente.
- Registro já ausente retorna sucesso idempotente.
- Falha real retorna erro; o frontend mantém o item até confirmação.
