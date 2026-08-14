function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getInvalidComboGroup(comboGroups = []) {
  return comboGroups.find((group) => {
    const minSelect = numberOrZero(group?.minSelect ?? group?.min_select);
    const maxSelect = numberOrZero(group?.maxSelect ?? group?.max_select);
    const availableCapacity = (group?.options || [])
      .filter((option) => option?.isAvailable !== false && option?.is_available !== false)
      .reduce((total, option) => total + Math.max(numberOrZero(option?.maxQty ?? option?.max_qty), 0), 0);

    return !String(group?.name || '').trim()
      || maxSelect < 1
      || minSelect < 0
      || minSelect > maxSelect
      || availableCapacity < minSelect;
  }) || null;
}

export function isPurchasableCombo(item) {
  if (item?.itemType !== 'combo') return true;
  const groups = Array.isArray(item.comboGroups) ? item.comboGroups : [];
  return groups.length > 0 && !getInvalidComboGroup(groups);
}
