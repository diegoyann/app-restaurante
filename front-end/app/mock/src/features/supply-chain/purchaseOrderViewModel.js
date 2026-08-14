export const purchaseOrderViews = [
  ["ACTIVE", "Ativos"],
  ["HISTORY", "Cancelados"],
];

export function selectPurchaseOrders(orders, { month, view }) {
  const isHistory = view === "HISTORY";

  return (orders || []).filter((order) => {
    const isSelectedMonth = String(order.orderDate || "").slice(0, 7) === month;
    const isCancelled = order.status === "CANCELLED";

    return isSelectedMonth && (isHistory ? isCancelled : !isCancelled);
  });
}
