import assert from "node:assert/strict";
import test from "node:test";
import { requireTransactionDate } from "./transactionDateModel.js";

test("preserva exatamente a data civil 14/08/2026", () => {
  assert.equal(requireTransactionDate("2026-08-14"), "2026-08-14");
});

test("rejeita timestamps e datas impossíveis", () => {
  assert.throws(() => requireTransactionDate("2026-08-14T23:00:00Z"), /inválida/);
  assert.throws(() => requireTransactionDate("2026-02-30"), /inválida/);
});
