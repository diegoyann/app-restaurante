import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { publicMenuApi } from '../services/api.js';
import SearchableSelect from '../components/SearchableSelect.jsx';
import '../App.css';

const BEVERAGE_MATCHER = /bebida|refrigerante|refri|suco|agua|água|cerveja|drink|lata|garrafa/i;
const DESCRIPTION_PREVIEW_LIMIT = 70;

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function classifySection(category = '', name = '') {
  return BEVERAGE_MATCHER.test(`${category} ${name}`) ? 'beverage' : 'food';
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)})${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value) {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

function toNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getComboGroupMin(group) {
  return toNonNegativeNumber(group?.minSelect ?? group?.minQty, 0);
}

function getComboGroupMax(group) {
  return toNonNegativeNumber(group?.maxSelect ?? group?.maxQty, 0);
}

function getComboOptionMax(option) {
  return toNonNegativeNumber(option?.maxQty, 1);
}

function sumSelectionQuantities(selections = {}) {
  return Object.values(selections).reduce((sum, qty) => sum + toNonNegativeNumber(qty, 0), 0);
}

function normalizeComboSelections(item, selections = {}) {
  return (item.comboGroups || []).reduce((acc, group) => {
    const groupSelections = selections[group.id] || {};
    const normalizedOptions = (group.options || []).reduce((optionAcc, option) => {
      const qty = toNonNegativeNumber(groupSelections[option.id], 0);
      if (qty > 0) optionAcc[option.id] = qty;
      return optionAcc;
    }, {});

    if (Object.keys(normalizedOptions).length > 0) {
      acc[group.id] = normalizedOptions;
    }

    return acc;
  }, {});
}

function getComboSelectionKey(selections) {
  return Object.entries(selections || {})
    .map(([groupId, options]) => {
      const optionKey = Object.entries(options || {})
        .filter(([, qty]) => Number(qty) > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([optionId, qty]) => `${optionId}:${qty}`)
        .join(',');
      return optionKey ? `${groupId}[${optionKey}]` : '';
    })
    .filter(Boolean)
    .sort()
    .join('|') || 'none';
}

export default function PublicMenuPage() {
  const { tenant } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    id: '',
    name: '',
    phone: '',
    addressLine: '',
    addressNumber: '',
    district: '',
    city: '',
    state: 'SP',
    addressComplement: ''
  });
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [acceptPaymentArrangement, setAcceptPaymentArrangement] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [customerLookup, setCustomerLookup] = useState({ phone: '', status: 'idle', message: '' });
  const [expandedMenuItems, setExpandedMenuItems] = useState(() => ({}));
  const [expandedComboItems, setExpandedComboItems] = useState(() => ({}));
  const [inlineComboSelections, setInlineComboSelections] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setLoading(true);
      setError('');
      try {
        const payload = await publicMenuApi.getMenu(tenant);
        if (!cancelled) setMenu(payload);
      } catch (apiError) {
        if (!cancelled) setError(apiError.message || 'Não foi possível carregar o cardápio.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMenu();
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  useEffect(() => {
    const phone = onlyDigits(customer.phone);

    if (!isValidPhone(phone)) {
      setCustomerLookup({ phone, status: 'idle', message: '' });
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCustomerLookup({ phone, status: 'loading', message: 'Buscando cliente...' });
      try {
        const response = await publicMenuApi.getCustomerByPhone(tenant, phone);
        if (cancelled) return;

        if (response.customer) {
          setCustomer((current) => ({
            ...current,
            ...response.customer,
            phone: formatPhone(response.customer.phone || phone),
            state: response.customer.state || current.state || 'SP'
          }));
          setCustomerLookup({ phone, status: 'found', message: 'Cliente encontrado. Dados preenchidos.' });
        } else {
          setCustomer((current) => ({ ...current, id: '' }));
          setCustomerLookup({ phone, status: 'not_found', message: 'Cliente novo. Cadastro será criado ao enviar.' });
        }
      } catch (apiError) {
        if (!cancelled) {
          setCustomerLookup({ phone, status: 'error', message: apiError.message || 'Não foi possível consultar o telefone.' });
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customer.phone, tenant]);

  const groupedItems = useMemo(() => {
    const categories = menu?.categories || [];
    const items = menu?.items || [];
    return categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.category === category.name)
    })).filter((category) => category.items.length > 0);
  }, [menu]);

  const total = cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const addItem = (item, selections = null) => {
    const unitPrice = Number(item.salePrice || item.basePrice || item.unitPrice || 0);
    let extraPrice = 0;
    let comboDescription = '';
    let comboSelections = null;
    
    if (selections && item.comboGroups) {
       comboSelections = normalizeComboSelections(item, selections);
       const descParts = [];
       item.comboGroups.forEach(g => {
          const groupSelections = comboSelections[g.id] || {};
          const groupParts = [];
          (g.options || []).forEach(opt => {
             const qty = groupSelections[opt.id] || 0;
             if (qty > 0) {
                extraPrice += (Number(opt.extraPrice) || 0) * qty;
                groupParts.push(`${qty}x ${opt.name}`);
             }
          });
          if (groupParts.length > 0) descParts.push(groupParts.join(', '));
       });
       comboDescription = descParts.join(' | ');
    }

    const finalUnitPrice = unitPrice + extraPrice;
    const selectionKey = comboSelections ? getComboSelectionKey(comboSelections) : 'none';

    setCart((current) => {
      const existing = current.find(
        (cartItem) => cartItem.menuItemId === (item.menuItemId || item.id) && cartItem.selectionKey === selectionKey
      );

      if (existing) {
        return current.map((cartItem) => {
          if (cartItem.cartId !== existing.cartId) return cartItem;
          const quantity = cartItem.quantity + 1;
          return { ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice };
        });
      }

      return [
        ...current,
        {
          cartId: Math.random().toString(36).substr(2, 9),
          id: item.id,
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          category: item.category || '',
          section: classifySection(item.category, item.name),
          quantity: 1,
          unitPrice: finalUnitPrice,
          totalPrice: finalUnitPrice,
          notes: comboDescription,
          selectionKey,
          selections: comboSelections,
          comboSelections
        }
      ];
    });
  };

  const decrementCatalogItem = (menuItemId) => {
    setCart((current) => {
      const idx = current.findIndex(c => c.menuItemId === menuItemId);
      if (idx === -1) return current;
      const newCart = [...current];
      const cartItem = newCart[idx];
      const quantity = cartItem.quantity - 1;
      if (quantity > 0) {
        newCart[idx] = { ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice };
      } else {
        newCart.splice(idx, 1);
      }
      return newCart;
    });
  };

  const decrementItem = (cartId) => {
    setCart((current) => current.flatMap((cartItem) => {
      if (cartItem.cartId !== cartId) return [cartItem];
      const quantity = cartItem.quantity - 1;
      return quantity > 0 ? [{ ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice }] : [];
    }));
  };

  const incrementCartItem = (cartId) => {
    setCart((current) => current.map((cartItem) => {
      if (cartItem.cartId !== cartId) return cartItem;
      const quantity = cartItem.quantity + 1;
      return { ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice };
    }));
  };

  const getCartQuantity = (menuItemId) => {
    return cart.filter((cartItem) => cartItem.menuItemId === menuItemId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getGroupSelections = (itemId, groupId) => {
    return (inlineComboSelections[itemId] && inlineComboSelections[itemId][groupId]) || {};
  };

  const updateInlineComboSelection = (itemId, groupId, optionId, delta, maxGroupQty, maxOptionQty) => {
    setInlineComboSelections(current => {
      const itemSelections = current[itemId] || {};
      const groupSelections = itemSelections[groupId] || {};
      const currentOptionQty = toNonNegativeNumber(groupSelections[optionId], 0);
      const currentGroupTotal = sumSelectionQuantities(groupSelections);
      const groupLimit = toNonNegativeNumber(maxGroupQty, 0);
      const optionLimit = toNonNegativeNumber(maxOptionQty, 0);

      const newOptionQty = currentOptionQty + delta;
      if (newOptionQty < 0) return current;
      if (optionLimit > 0 && newOptionQty > optionLimit) return current;
      if (delta > 0 && groupLimit > 0 && currentGroupTotal >= groupLimit) return current;

      const nextGroupSelections = { ...groupSelections };
      if (newOptionQty > 0) {
        nextGroupSelections[optionId] = newOptionQty;
      } else {
        delete nextGroupSelections[optionId];
      }

      return {
        ...current,
        [itemId]: {
          ...itemSelections,
          [groupId]: nextGroupSelections
        }
      };
    });
  };

  const validateInlineCombo = (item) => {
    const itemSelections = inlineComboSelections[item.id] || {};
    for (const group of item.comboGroups || []) {
       const groupSelections = itemSelections[group.id] || {};
       const currentGroupTotal = sumSelectionQuantities(groupSelections);
       const minSelect = getComboGroupMin(group);
       const maxSelect = getComboGroupMax(group);
       if (currentGroupTotal < minSelect) {
          return false;
       }
       if (maxSelect > 0 && currentGroupTotal > maxSelect) {
          return false;
       }
    }
    return true;
  };

  const openComboBuilder = (itemId) => {
    setExpandedComboItems((current) => ({
      ...current,
      [itemId]: true
    }));
  };

  const closeComboBuilder = (itemId) => {
    setExpandedComboItems((current) => ({
      ...current,
      [itemId]: false
    }));
  };

  const addComboToCart = (item) => {
    if (!validateInlineCombo(item)) return;

    addItem(item, inlineComboSelections[item.id] || {});
    setInlineComboSelections((current) => ({ ...current, [item.id]: {} }));
    closeComboBuilder(item.id);
  };

  const toggleMenuItemDescription = (menuItemId) => {
    setExpandedMenuItems((current) => ({
      ...current,
      [menuItemId]: !current[menuItemId]
    }));
  };

  const handlePhoneChange = (value) => {
    setCustomer((current) => ({
      ...current,
      id: '',
      phone: formatPhone(value)
    }));
  };

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (cart.length === 0) {
      setError('Escolha pelo menos um item.');
      return;
    }

    if (!isValidPhone(customer.phone)) {
      setError('Informe telefone com DDD e número.');
      return;
    }
    const hasPaymentMethods = (menu?.paymentMethods || []).length > 0;
    if (hasPaymentMethods && !paymentMethodId) {
      setError('Selecione uma forma de pagamento.');
      return;
    }
    if (!hasPaymentMethods && !acceptPaymentArrangement) {
      setError('Confirme que o pagamento será combinado com a loja.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await publicMenuApi.createOrder(tenant, {
        customer: {
          ...customer,
          phone: onlyDigits(customer.phone)
        },
        paymentMethodId,
        orderType: 'delivery',
        items: cart,
        notes
      });
      setSuccess(`Pedido ${response.order.orderNumber} enviado.`);
      setCart([]);
      setNotes('');
      setAcceptPaymentArrangement(false);
    } catch (apiError) {
      setError(apiError.message || 'Não foi possível enviar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#FFFFFF] p-6 text-[#2A1E15] font-black">Carregando cardápio...</div>;
  }

  if (error && !menu) {
    return <div className="min-h-screen bg-[#FFFFFF] p-6 text-red-700 font-black">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#241312]">
      <section className="bg-[#2A1E15] text-white px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F3E8DA]">Cardápio digital</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight">{menu?.tenant?.businessName || menu?.tenant?.name || 'Cardápio'}</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold text-white/75">Monte seu pedido direto pelo canal próprio.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px] sm:px-8">
        <div className="space-y-6">
          {groupedItems.map((category) => (
            <section key={category.id} className="space-y-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#2A1E15]">{category.name}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {category.items.map((item) => {
                  const quantity = getCartQuantity(item.id);
                  const description = String(item.description || '').trim();
                  const hasLongDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;
                  const isDescriptionExpanded = Boolean(expandedMenuItems[item.id]);
                  const descriptionId = `public-menu-item-description-${item.id}`;

                  const isCombo = item.itemType === 'combo' || (item.comboGroups && item.comboGroups.length > 0);
                  const isComboBuilderOpen = Boolean(expandedComboItems[item.id]);
                  const isComboSelectionValid = isCombo ? validateInlineCombo(item) : false;

                  return (
                    <article key={item.id} className="public-menu-item-card rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="public-menu-item-layout">
                        {item.photoPreview ? <img src={item.photoPreview} alt="" className="public-menu-item-image" /> : null}
                        <div className="public-menu-item-content">
                          <h3 className="text-sm font-black uppercase text-[#2A1E15]">{item.name}</h3>
                          {description ? (
                            <div className="public-menu-item-description-block">
                              <p id={descriptionId} className={`public-menu-item-description ${isDescriptionExpanded ? 'public-menu-item-description--expanded' : ''}`}>
                                {description}
                              </p>
                              {hasLongDescription ? (
                                <button
                                  type="button"
                                  aria-controls={descriptionId}
                                  aria-expanded={isDescriptionExpanded}
                                  onClick={() => toggleMenuItemDescription(item.id)}
                                  className="public-menu-description-toggle"
                                >
                                  {isDescriptionExpanded ? 'Ver menos' : 'Ver mais'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          
                          {isCombo && isComboBuilderOpen && (
                            <div className="mt-4 mb-4 space-y-4 border-t border-gray-100 pt-4">
                              {item.comboGroups?.map(group => {
                                const groupSelections = getGroupSelections(item.id, group.id);
                                const currentGroupTotal = sumSelectionQuantities(groupSelections);
                                const minSelect = getComboGroupMin(group);
                                const maxSelect = getComboGroupMax(group);
                                const availableOptions = (group.options || []).filter(opt => opt.isAvailable !== false);
                                
                                return (
                                  <div key={group.id} className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                      <h4 className="text-xs font-black text-[#2A1E15] uppercase">{group.name}</h4>
                                      <span className="text-[10px] font-bold text-gray-500">
                                        {minSelect > 0 ? `Mín: ${minSelect} ` : ''}
                                        {maxSelect > 0 ? `Máx: ${maxSelect}` : ''}
                                      </span>
                                    </div>
                                    <p className={`text-[10px] font-black ${currentGroupTotal < minSelect ? 'text-red-600' : 'text-[#696965]'}`}>
                                      Selecionado: {currentGroupTotal}{maxSelect > 0 ? `/${maxSelect}` : ''}
                                    </p>
                                    
                                    <div className="space-y-1">
                                      {availableOptions.length === 0 ? (
                                        <p className="rounded-lg border border-dashed border-gray-200 p-2 text-[11px] font-bold text-[#696965]">
                                          Nenhuma opção disponível neste grupo.
                                        </p>
                                      ) : availableOptions.map(opt => {
                                        const qty = toNonNegativeNumber(groupSelections[opt.id], 0);
                                        const optionMax = getComboOptionMax(opt);
                                        return (
                                          <div key={opt.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                                            <div>
                                              <p className="text-xs font-bold text-[#2A1E15]">{opt.name}</p>
                                              <p className="text-[10px] text-[#696965] font-bold">Até {optionMax}</p>
                                              {Number(opt.extraPrice) > 0 && <p className="text-[10px] text-[#D4A373] font-bold">+ {formatMoney(opt.extraPrice)}</p>}
                                            </div>
                                            
                                            <div className="inline-flex h-7 items-center overflow-hidden rounded bg-white text-[#2A1E15] border border-gray-200">
                                              <button 
                                                type="button" 
                                                onClick={() => updateInlineComboSelection(item.id, group.id, opt.id, -1, maxSelect, optionMax)}
                                                disabled={qty === 0}
                                                className="flex h-full w-7 items-center justify-center text-red-600 disabled:opacity-30"
                                              >
                                                <Minus size={11} />
                                              </button>
                                              <span className="min-w-6 text-center text-[10px] font-black">{qty}</span>
                                              <button 
                                                type="button" 
                                                onClick={() => updateInlineComboSelection(item.id, group.id, opt.id, 1, maxSelect, optionMax)}
                                                disabled={(maxSelect > 0 && currentGroupTotal >= maxSelect) || (optionMax > 0 && qty >= optionMax)}
                                                className="flex h-full w-7 items-center justify-center disabled:opacity-30"
                                              >
                                                <Plus size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => closeComboBuilder(item.id)}
                                  className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 px-3 text-[10px] font-black uppercase text-[#696965]"
                                >
                                  Fechar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addComboToCart(item)}
                                  disabled={!isComboSelectionValid}
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#D4A373] px-3 text-[10px] font-black uppercase text-[#3A281B] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {quantity > 0 ? <span className="mr-1 rounded-full bg-[#3A281B] px-1.5 py-0.5 text-[#fff8e4]">{quantity}</span> : <Plus size={13} />} Adicionar ao pedido
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="public-menu-item-actions">
                            <strong className="text-base font-black text-[#241312]">{formatMoney(item.salePrice || item.basePrice)}</strong>
                            {quantity > 0 && !isCombo ? (
                              <div className="inline-flex h-9 items-center overflow-hidden rounded-xl border border-[#D4A373] bg-[#fff8e4] text-[#3A281B]">
                                <button type="button" aria-label={`Remover ${item.name}`} onClick={() => decrementCatalogItem(item.id)} className="flex h-full w-9 items-center justify-center">
                                  <Minus size={13} />
                                </button>
                                <span className="min-w-8 text-center text-xs font-black">{quantity}</span>
                                <button type="button" aria-label={`Adicionar ${item.name}`} onClick={() => addItem(item)} className="flex h-full w-9 items-center justify-center">
                                  <Plus size={13} />
                                </button>
                              </div>
                            ) : isCombo ? (
                              <button 
                                type="button" 
                                onClick={() => openComboBuilder(item.id)}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#D4A373] px-3 text-[10px] font-black uppercase text-[#3A281B]"
                              >
                                {quantity > 0 ? <span className="mr-1 rounded-full bg-[#3A281B] px-1.5 py-0.5 text-[#fff8e4]">{quantity}</span> : <Plus size={13} />}
                                {isComboBuilderOpen ? 'Editando' : 'Adicionar'}
                              </button>
                            ) : (
                              <button type="button" onClick={() => addItem(item)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#D4A373] px-3 text-[10px] font-black uppercase text-[#3A281B]">
                                {quantity > 0 ? <span className="mr-1 rounded-full bg-[#3A281B] px-1.5 py-0.5 text-[#fff8e4]">{quantity}</span> : <Plus size={13} />} Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <form onSubmit={submitOrder} className="h-fit rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase text-[#2A1E15]">Seu pedido</h2>
            <ShoppingBag className="text-[#D4A373]" size={22} />
          </div>

          <div className="space-y-2">
            {cart.length === 0 ? <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm font-bold text-[#696965]">Carrinho vazio.</p> : cart.map((item) => (
              <div key={item.cartId} className="flex flex-col gap-2 rounded-xl bg-[#FAF6EF] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-[#2A1E15]">{item.name}</p>
                    <p className="text-xs font-bold text-[#696965]">{item.quantity} x {formatMoney(item.unitPrice)} = {formatMoney(item.totalPrice)}</p>
                  </div>
                  <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-white text-[#2A1E15]">
                    <button type="button" aria-label={`Diminuir ${item.name}`} onClick={() => decrementItem(item.cartId)} className="flex h-full w-8 items-center justify-center text-red-600">
                      <Minus size={13} />
                    </button>
                    <span className="min-w-7 text-center text-xs font-black">{item.quantity}</span>
                    <button type="button" aria-label={`Aumentar ${item.name}`} onClick={() => incrementCartItem(item.cartId)} className="flex h-full w-8 items-center justify-center">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                {item.notes && <p className="text-[11px] font-bold text-[#D4A373]">{item.notes}</p>}
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <div>
              <input required inputMode="tel" autoComplete="tel" placeholder="Telefone" value={customer.phone} onChange={(event) => handlePhoneChange(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
              {customerLookup.message ? (
                <p className={`mt-1 text-[11px] font-bold ${customerLookup.status === 'error' ? 'text-red-700' : 'text-[#696965]'}`}>
                  {customerLookup.message}
                </p>
              ) : null}
            </div>
            <input required placeholder="Nome" value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            <input required placeholder="Rua" value={customer.addressLine} onChange={(event) => updateCustomer('addressLine', event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Número" value={customer.addressNumber} onChange={(event) => updateCustomer('addressNumber', event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
              <input required placeholder="Bairro" value={customer.district} onChange={(event) => updateCustomer('district', event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </div>
            <input required placeholder="Cidade" value={customer.city} onChange={(event) => updateCustomer('city', event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            <input placeholder="Complemento" value={customer.addressComplement} onChange={(event) => updateCustomer('addressComplement', event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            {(menu?.paymentMethods || []).length > 0 ? <SearchableSelect
              value={paymentMethodId}
              onChange={(value) => setPaymentMethodId(value)}
              placeholder="Selecione o pagamento"
              options={(menu?.paymentMethods || []).map((method) => ({
                value: method.id,
                label: method.name
              }))}
            /> : <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900"><input type="checkbox" checked={acceptPaymentArrangement} onChange={(event) => setAcceptPaymentArrangement(event.target.checked)} className="mt-0.5 size-4" /><span>Esta loja ainda não cadastrou formas de pagamento. Concordo em combinar o pagamento diretamente com a loja.</span></label>}
            <textarea placeholder="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-[80px] rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
          </div>

          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
          {success && <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">{success}</p>}

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#2A1E15]/5 p-4">
            <div>
              <p className="text-[10px] font-black uppercase text-[#696965]">Total</p>
              <strong className="text-2xl font-black text-[#2A1E15]">{formatMoney(total)}</strong>
            </div>
            <button disabled={submitting} className="rounded-xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-60">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
