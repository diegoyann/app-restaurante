# Quickstart: Aceite de Pedidos Cancelados

## Pré-requisitos

- Executar a aplicação com um tenant que possua fornecedor ativo e insumo vinculado.
- Abrir Estoque e Compras > Pedidos de Compra.

## Roteiro de aceite

1. Selecione agosto de 2026 e abra **Ativos**.
2. Crie um pedido TESTE datado em agosto de 2026 e confirme que ele aparece em Ativos.
3. Cancele o pedido informando o motivo.
4. Confirme que ele desaparece imediatamente de Ativos.
5. Abra **Histórico** e confirme o mesmo pedido com status Cancelado.
6. Atualize o navegador e confirme novamente que Ativos não o contém e Histórico o contém.

## Gates

No diretório `front-end/app/mock`, executar:

```powershell
node --test "src/**/*.test.mjs"
npm run lint
npm run build
```
