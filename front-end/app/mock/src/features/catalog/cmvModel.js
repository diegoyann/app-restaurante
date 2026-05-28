export const UNIT_DEFINITIONS = {
  g: { group: 'weight', factor: 1 },
  kg: { group: 'weight', factor: 1000 },
  ml: { group: 'volume', factor: 1 },
  l: { group: 'volume', factor: 1000 },
  un: { group: 'count', factor: 1 }
};

export const normalizeUnitKey = (unit) => String(unit || '').trim().toLowerCase();

export const getUnitDefinition = (unit) => UNIT_DEFINITIONS[normalizeUnitKey(unit)] || null;

export const findMatchingUnitLabel = (units, unitLabel) => {
  const normalizedLabel = normalizeUnitKey(unitLabel);
  if (!normalizedLabel) return '';

  return units.find((unit) => normalizeUnitKey(unit.label) === normalizedLabel)?.label || '';
};

export const resolveSelectableUnitLabel = (units, unitLabel) => (
  findMatchingUnitLabel(units, unitLabel) || ''
);

export const convertQuantityBetweenUnits = (quantity, fromUnit, toUnit) => {
  const numericQuantity = Number(quantity) || 0;

  if (!fromUnit || !toUnit || normalizeUnitKey(fromUnit) === normalizeUnitKey(toUnit)) {
    return numericQuantity;
  }

  const fromDefinition = getUnitDefinition(fromUnit);
  const toDefinition = getUnitDefinition(toUnit);

  if (!fromDefinition || !toDefinition) return numericQuantity;
  if (fromDefinition.group !== toDefinition.group) return numericQuantity;

  return (numericQuantity * fromDefinition.factor) / toDefinition.factor;
};

export const getIngredientCostReferenceUnit = (unit) => unit || 'UN';

export const getIngredientCostReferenceFactor = () => 1;

export const calculateIngredientUnitCost = (ingredient) => {
  const unitCost = Number(ingredient?.unitCost);
  if (unitCost > 0) return unitCost;

  const packageQuantity = Number(ingredient?.packageQuantity) || 0;
  const packageCost = Number(ingredient?.packageCost) || 0;

  if (packageQuantity <= 0) return packageCost;

  return packageCost / packageQuantity;
};

export const getIngredientCostReferenceValue = (ingredient) => (
  calculateIngredientUnitCost(ingredient) * getIngredientCostReferenceFactor(ingredient?.unit)
);

export const getCompatibleUnits = (sourceUnit, ingredientUnits) => {
  if (!sourceUnit) return ingredientUnits;

  const sourceDefinition = getUnitDefinition(sourceUnit);

  if (!sourceDefinition) {
    return ingredientUnits.filter((unit) => normalizeUnitKey(unit.label) === normalizeUnitKey(sourceUnit));
  }

  return ingredientUnits.filter((unit) => {
    const currentDefinition = getUnitDefinition(unit.label);
    return currentDefinition?.group === sourceDefinition.group;
  });
};

export const getDefaultCompatibleUnit = (sourceUnit, ingredientUnits) => {
  const compatibleUnits = getCompatibleUnits(sourceUnit, ingredientUnits);
  return resolveSelectableUnitLabel(compatibleUnits, sourceUnit);
};

export const calculateComponentLineCost = ({
  quantity,
  quantityUnit,
  componentSourceUnit,
  componentUnitCost
}) => {
  const normalizedQuantity = convertQuantityBetweenUnits(
    quantity,
    quantityUnit || componentSourceUnit,
    componentSourceUnit
  );

  return {
    normalizedQuantity,
    lineCost: (Number(componentUnitCost) || 0) * normalizedQuantity
  };
};

export const calculateRecipeCost = (recipe = [], resolveComponent) => (
  recipe.reduce((total, item) => {
    const component = resolveComponent(item);
    const { lineCost } = calculateComponentLineCost({
      quantity: item.quantity,
      quantityUnit: item.quantityUnit,
      componentSourceUnit: component?.sourceUnit,
      componentUnitCost: component?.unitCost
    });

    return total + lineCost;
  }, 0)
);
