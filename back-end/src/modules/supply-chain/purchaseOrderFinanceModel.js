const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function estimatedOrderTotal(items = []) {
  return money(items.reduce((sum, item) => (
    sum + Number(item.ordered_quantity ?? item.orderedQuantity ?? 0) * Number(item.estimated_unit_price ?? item.estimatedUnitPrice ?? 0)
  ), 0));
}

export function activeReceiptTotal(receipts = []) {
  return money(receipts
    .filter((receipt) => receipt.status === 'ACTIVE')
    .reduce((sum, receipt) => sum + Number(receipt.total_amount ?? receipt.totalAmount ?? 0), 0));
}

export function purchaseObligationAmounts({ orderStatus, items = [], receipts = [] }) {
  const forecastAmount = estimatedOrderTotal(items);
  const receivedAmount = activeReceiptTotal(receipts);
  const fullyReceived = orderStatus === 'RECEIVED';
  return {
    forecastAmount,
    finalAmount: fullyReceived ? receivedAmount : null,
    currentAmount: fullyReceived ? receivedAmount : forecastAmount,
    receivedAmount
  };
}

export function purchaseOrderCanBeEdited(order = {}) {
  const hasActiveReceipt = (order.purchase_receipts || order.receipts || []).some((receipt) => receipt.status === 'ACTIVE');
  return ['DRAFT', 'ORDERED', 'AWAITING_DELIVERY'].includes(order.status) && !hasActiveReceipt;
}
