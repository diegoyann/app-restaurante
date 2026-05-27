export const menuStatusOptions = [
  { value: 'active', label: 'Disponível' },
  { value: 'seasonal', label: 'Destaque da casa' },
  { value: 'draft', label: 'Em preparação' },
  { value: 'inactive', label: 'Oculto' }
];

export const createId = () => Date.now() + Math.random();

export const createInitialMenuCategories = () => ([
  { id: 1, name: 'Esfiha' },
  { id: 2, name: 'Pizza' },
  { id: 3, name: 'Lanche' },
  { id: 4, name: 'Combo' },
  { id: 5, name: 'Bebida' },
  { id: 6, name: 'Sobremesa' }
]);

export const createEmptyMenuItemForm = (categoryName = '') => ({
  name: '',
  category: categoryName,
  description: '',
  status: 'active',
  salePrice: '',
  photoPreview: '',
  linkedComponentIds: []
});

export const createEmptyComboOption = () => ({
  id: createId(),
  name: '',
  photoPreview: '',
  extraPrice: '0',
  maxQty: '1',
  isAvailable: true,
  linkedCategoryName: '',
  linkedComponentRef: ''
});

export const createEmptyComboGroup = (name = '') => ({
  id: createId(),
  name,
  minSelect: '1',
  maxSelect: '1',
  options: [createEmptyComboOption()]
});

export const createEmptyComboForm = (categoryName = 'Combo') => ({
  name: '',
  category: categoryName,
  description: '',
  status: 'active',
  basePrice: '',
  photoPreview: '',
  comboGroups: [
    createEmptyComboGroup('Sabores'),
    createEmptyComboGroup('Bebidas')
  ]
});

export const createEmptyCategoryForm = () => ({
  name: ''
});

export const getMenuStatusMeta = (status) => {
  const statusMap = {
    active: { label: 'Disponível', badgeClass: 'bg-green-50 text-green-700 border-green-100' },
    seasonal: { label: 'Destaque da casa', badgeClass: 'bg-amber-50 text-amber-700 border-amber-100' },
    draft: { label: 'Em preparação', badgeClass: 'bg-blue-50 text-blue-700 border-blue-100' },
    inactive: { label: 'Oculto', badgeClass: 'bg-gray-100 text-gray-600 border-gray-200' }
  };

  return statusMap[status] || statusMap.draft;
};

export const getComponentTagLabel = (type) => {
  if (type === 'product') return 'Produto final';
  return 'Relacionado';
};

export const summarizeComboGroups = (comboGroups = []) => {
  const groups = comboGroups.length;
  const requiredGroups = comboGroups.filter((group) => Number(group.minSelect) > 0).length;
  const options = comboGroups.reduce((acc, group) => acc + (group.options?.length || 0), 0);
  return `${groups} grupo(s) • ${requiredGroups} obrigatório(s) • ${options} opção(ões)`;
};

export const resolveLinkedComponentMeta = (componentRef, catalogMetrics, ingredients, formatMoney, menuItems = []) => {
  if (!componentRef) return null;

  const [componentType, rawId] = String(componentRef).split(':');
  const numericId = Number(rawId);
  const componentId = rawId && !Number.isNaN(numericId) ? numericId : rawId;
  if (!componentType || !componentId) return null;

  if (componentType === 'menu-item') {
    const menuItem = menuItems.find((item) => item.id === componentId);
    if (!menuItem) return null;

    const hasBasePrice = typeof menuItem.basePrice === 'number' && menuItem.basePrice > 0;
    const priceValue = hasBasePrice ? menuItem.basePrice : Number(menuItem.salePrice) || 0;
    const priceLabel = hasBasePrice ? 'Preço base' : 'Preço';

    return {
      name: menuItem.name,
      subtitle: `${menuItem.category} • ${priceLabel} ${formatMoney(priceValue)}`,
      tag: menuItem.itemType === 'combo' ? 'Combo cadastrado' : 'Item cadastrado'
    };
  }

  if (componentType === 'product') {
    const product = catalogMetrics.productSummaries.find((item) => item.id === componentId);
    return product ? {
      name: product.name,
      subtitle: `Preço base ${formatMoney(product.metrics.salePrice)}`,
      tag: getComponentTagLabel(componentType)
    } : null;
  }

  if (componentType === 'preparation') {
    const preparation = catalogMetrics.preparationSummaries.find((item) => item.id === componentId);
    return preparation ? {
      name: preparation.name,
      subtitle: `Rendimento ${preparation.yieldQuantity} ${preparation.yieldUnit}`,
      tag: getComponentTagLabel(componentType)
    } : null;
  }

  if (componentType === 'ingredient') {
    const ingredient = ingredients.find((item) => item.id === componentId);
    return ingredient ? {
      name: ingredient.name,
      subtitle: `Custo ${formatMoney(ingredient.unitCost || ingredient.packageCost || 0)}/${ingredient.unit}`,
      tag: getComponentTagLabel(componentType)
    } : null;
  }

  return null;
};
