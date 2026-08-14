import assert from "node:assert/strict";
import test from "node:test";

import { purchaseOrderViews, selectPurchaseOrders } from "./purchaseOrderViewModel.js";

const orders = [
  { id: "active-aug", orderDate: "2026-08-03", status: "ORDERED" },
  { id: "cancelled-aug", orderDate: "2026-08-10", status: "CANCELLED" },
  { id: "received-aug", orderDate: "2026-08-12", status: "RECEIVED" },
  { id: "active-jul", orderDate: "2026-07-30", status: "DRAFT" },
];

test("expõe as abas Ativos e Cancelados", () => {
  assert.deepEqual(purchaseOrderViews, [
    ["ACTIVE", "Ativos"],
    ["HISTORY", "Cancelados"],
  ]);
});

test("Ativos exclui cancelados e respeita a competência selecionada", () => {
  assert.deepEqual(
    selectPurchaseOrders(orders, { month: "2026-08", view: "ACTIVE" }).map(
      (order) => order.id,
    ),
    ["active-aug", "received-aug"],
  );
});

test("Histórico mostra apenas cancelados da competência selecionada", () => {
  assert.deepEqual(
    selectPurchaseOrders(orders, { month: "2026-08", view: "HISTORY" }).map(
      (order) => order.id,
    ),
    ["cancelled-aug"],
  );
});

test("cancelamento e recarregamento preservam a separação entre abas", () => {
  const cancelled = orders.map((order) =>
    order.id === "active-aug" ? { ...order, status: "CANCELLED" } : order,
  );
  const reloaded = cancelled.map((order) => ({ ...order }));

  assert.deepEqual(
    selectPurchaseOrders(cancelled, { month: "2026-08", view: "ACTIVE" }).map(
      (order) => order.id,
    ),
    ["received-aug"],
  );
  assert.deepEqual(
    selectPurchaseOrders(reloaded, { month: "2026-08", view: "HISTORY" }).map(
      (order) => order.id,
    ),
    ["active-aug", "cancelled-aug"],
  );
});
