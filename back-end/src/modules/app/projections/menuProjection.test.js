import test from 'node:test';
import assert from 'node:assert/strict';
import { mapMenuItem } from '../../shared/mappers.js';
import { assembleMenuItemRows } from './menuProjection.js';

test('assembles combo groups and options from separate query rows', () => {
  const items = assembleMenuItemRows(
    [
      { id: 'item-1', category_id: 'category-1', name: 'Combo' },
      { id: 'item-2', category_id: null, name: 'Avulso' }
    ],
    [{ id: 'group-2', menu_item_id: 'item-1' }, { id: 'group-1', menu_item_id: 'item-1' }],
    [{ id: 'option-2', combo_group_id: 'group-1' }, { id: 'option-1', combo_group_id: 'group-1' }],
    [{ id: 'category-1', name: 'Combos' }]
  );

  assert.deepEqual(items, [
    {
      id: 'item-1',
      category_id: 'category-1',
      name: 'Combo',
      menu_categories: { name: 'Combos' },
      combo_groups: [
        { id: 'group-2', menu_item_id: 'item-1', combo_options: [] },
        {
          id: 'group-1',
          menu_item_id: 'item-1',
          combo_options: [
            { id: 'option-2', combo_group_id: 'group-1' },
            { id: 'option-1', combo_group_id: 'group-1' }
          ]
        }
      ]
    },
    {
      id: 'item-2',
      category_id: null,
      name: 'Avulso',
      menu_categories: null,
      combo_groups: []
    }
  ]);
});

test('mapMenuItem returns combo option category names and component refs', () => {
  const mapped = mapMenuItem({
    id: 'combo-1',
    menu_categories: { name: 'Combo' },
    description: 'Combo completo',
    status: 'active',
    sort_order: 0,
    sale_price: 0,
    base_price: 49.9,
    photo_preview: '',
    linked_component_ids: [],
    item_type: 'combo',
    name: 'Combo Familia',
    combo_groups: [{
      id: 'group-1',
      name: 'Sabores',
      min_select: 1,
      max_select: 2,
      sort_order: 0,
      combo_options: [{
        id: 'option-1',
        name: 'Carne',
        sort_order: 0,
        photo_preview: '',
        extra_price: 0,
        max_qty: 2,
        is_available: true,
        linked_category_name: 'Esfiha',
        linked_category_names: ['Esfiha', 'Bebida'],
        linked_component_ref: 'menu-item:123'
      }]
    }]
  });

  assert.deepEqual(mapped.comboGroups[0].options[0], {
    id: 'option-1',
    name: 'Carne',
    sortOrder: 0,
    photoPreview: '',
    extraPrice: '0',
    maxQty: '2',
    isAvailable: true,
    linkedCategoryName: 'Esfiha',
    linkedCategoryNames: ['Esfiha', 'Bebida'],
    linkedComponentRef: 'menu-item:123',
    linkedComponentRefs: ['menu-item:123']
  });
});
