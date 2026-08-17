import assert from "node:assert/strict";
import test from "node:test";
import { formatDateOnlyBr, localDateIso } from "./transactionDateModel.js";

test("gera a data civil local sem avançar para o dia UTC seguinte", () => {
  const lateLocalDay = new Date(2026, 7, 14, 23, 30, 0);
  assert.equal(localDateIso(lateLocalDay), "2026-08-14");
});

test("formata 14/08/2026 sem construir instante ou aplicar timezone", () => {
  assert.equal(formatDateOnlyBr("2026-08-14"), "14/08/2026");
});
