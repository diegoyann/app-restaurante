export function supplierDeletionMode({ orderCount = 0, priceHistoryCount = 0 } = {}) {
  return Number(orderCount) > 0 || Number(priceHistoryCount) > 0
    ? 'ARCHIVE'
    : 'PERMANENT';
}
