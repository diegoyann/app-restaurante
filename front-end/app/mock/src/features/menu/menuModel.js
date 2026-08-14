export const menuStatusOptions = [
  { value: 'active', label: 'Disponível' },
  { value: 'seasonal', label: 'Destaque da casa' },
  { value: 'draft', label: 'Em preparação' },
  { value: 'inactive', label: 'Oculto' }
];

export const createId = () => Date.now() + Math.random();

export const formatComboboxLabel = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  let formatted = `${text.charAt(0).toLocaleUpperCase('pt-BR')}${text.slice(1).toLocaleLowerCase('pt-BR')}`;
  formatted = formatted.replace(/r\s*\$/gi, 'R$');
  return formatted;
};

export const createInitialMenuCategories = () => ([
  { id: 1, name: 'Esfiha', sortOrder: 0 },
  { id: 2, name: 'Pizza', sortOrder: 1 },
  { id: 3, name: 'Lanche', sortOrder: 2 },
  { id: 4, name: 'Combo', sortOrder: 3 },
  { id: 5, name: 'Bebida', sortOrder: 4 },
  { id: 6, name: 'Sobremesa', sortOrder: 5 }
]);

export const createEmptyMenuItemForm = (categoryName = '') => ({
  name: '',
  category: categoryName,
  description: '',
  status: 'active',
  salePrice: '',
  priceEditable: false,
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
  linkedCategoryNames: [],
  linkedComponentRef: '',
  linkedComponentRefs: []
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

export const normalizeComboCategoryNames = (option = {}) => {
  const values = Array.isArray(option.linkedCategoryNames)
    ? option.linkedCategoryNames
    : [];
  const fallback = option.linkedCategoryName ? [option.linkedCategoryName] : [];

  return [...values, ...fallback].reduce((acc, categoryName) => {
    const normalized = String(categoryName || '').trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
};

export const normalizeComboComponentRefs = (option = {}) => {
  const values = Array.isArray(option.linkedComponentRefs)
    ? option.linkedComponentRefs
    : [];
  const fallback = option.linkedComponentRef ? [option.linkedComponentRef] : [];

  return [...values, ...fallback].reduce((acc, componentRef) => {
    const normalized = String(componentRef || '').trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
};

export const normalizeComboOptionLinking = (option = {}) => {
  const linkedCategoryNames = normalizeComboCategoryNames(option);
  const linkedComponentRefs = normalizeComboComponentRefs(option);

  return {
    ...option,
    linkedCategoryName: linkedCategoryNames[0] || '',
    linkedCategoryNames,
    linkedComponentRef: linkedComponentRefs[0] || '',
    linkedComponentRefs
  };
};

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
  const componentId = rawId || '';
  if (!componentType || !componentId) return null;
  const hasId = (item) => String(item.id) === String(componentId);

  if (componentType === 'menu-item') {
    const menuItem = menuItems.find(hasId);
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
    const product = catalogMetrics.productSummaries.find(hasId);
    return product ? {
      name: product.name,
      subtitle: `Preço base ${formatMoney(product.metrics.salePrice)}`,
      tag: getComponentTagLabel(componentType)
    } : null;
  }

  if (componentType === 'preparation') {
    const preparation = catalogMetrics.preparationSummaries.find(hasId);
    return preparation ? {
      name: preparation.name,
      subtitle: `Rendimento ${preparation.yieldQuantity} ${preparation.yieldUnit}`,
      tag: getComponentTagLabel(componentType)
    } : null;
  }

  if (componentType === 'ingredient') {
    const ingredient = ingredients.find(hasId);
    return ingredient ? {
      name: ingredient.name,
      subtitle: `Custo ${formatMoney(ingredient.unitCost || ingredient.packageCost || 0)}/${ingredient.unit}`,
      tag: getComponentTagLabel(componentType)
    } : null;
  }

  return null;
};
