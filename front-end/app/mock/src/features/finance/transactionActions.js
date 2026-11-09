export async function deletePersistedTransaction({
  tenantSlug,
  transactionId,
  deleteTransaction,
  updateTransactions,
}) {
  await deleteTransaction(tenantSlug, transactionId);
  updateTransactions((current) =>
    current.filter((transaction) => transaction.id !== transactionId),
  );
}
