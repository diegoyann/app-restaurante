import assert from "node:assert/strict";
import test from "node:test";
import { deletePersistedTransaction } from "./transactionActions.js";

test("exclui na API antes de retirar o lançamento do estado", async () => {
  const events = [];
  let transactions = [{ id: "qa" }, { id: "keep" }];
  await deletePersistedTransaction({
    tenantSlug: "loja",
    transactionId: "qa",
    deleteTransaction: async (tenant, id) => events.push(`api:${tenant}:${id}`),
    updateTransactions: (updater) => {
      events.push("state");
      transactions = updater(transactions);
    },
  });
  assert.deepEqual(events, ["api:loja:qa", "state"]);
  assert.deepEqual(transactions, [{ id: "keep" }]);
});

test("mantém o lançamento visível quando a exclusão persistente falha", async () => {
  let transactions = [{ id: "qa" }];
  await assert.rejects(
    deletePersistedTransaction({
      tenantSlug: "loja",
      transactionId: "qa",
      deleteTransaction: async () => { throw new Error("Falha persistente"); },
      updateTransactions: (updater) => { transactions = updater(transactions); },
    }),
    /Falha persistente/,
  );
  assert.deepEqual(transactions, [{ id: "qa" }]);
});
