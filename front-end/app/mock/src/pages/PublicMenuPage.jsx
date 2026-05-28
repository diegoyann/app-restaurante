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
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [customerLookup, setCustomerLookup] = useState({ phone: '', status: 'idle', message: '' });
  const [expandedMenuItems, setExpandedMenuItems] = useState(() => ({}));
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [comboSelections, setComboSelections] = useState({});

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
    
    if (selections && item.comboGroups) {
       const descParts = [];
       item.comboGroups.forEach(g => {
          const groupSelections = selections[g.id] || {};
          const groupParts = [];
          g.options.forEach(opt => {
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
    const selectionKey = selections ? JSON.stringify(selections) : 'none';

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
          selections
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

  const getCartQuantity = (menuItemId) => {
    return cart.filter((cartItem) => cartItem.menuItemId === menuItemId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCatalogAdd = (item) => {
    if (item.itemType === 'combo' || (item.comboGroups && item.comboGroups.length > 0)) {
      setSelectedCombo(item);
      const initialSelections = {};
      item.comboGroups?.forEach(g => {
        initialSelections[g.id] = {};
        g.options?.forEach(opt => {
          initialSelections[g.id][opt.id] = 0;
        });
      });
      setComboSelections(initialSelections);
    } else {
      addItem(item);
    }
  };

  const closeComboModal = () => {
    setSelectedCombo(null);
    setComboSelections({});
  };

  const updateComboSelection = (groupId, optionId, delta, maxGroupQty, maxOptionQty) => {
    setComboSelections(current => {
      const groupSelections = current[groupId] || {};
      const currentOptionQty = groupSelections[optionId] || 0;
      const currentGroupTotal = Object.values(groupSelections).reduce((a, b) => a + b, 0);

      const newOptionQty = currentOptionQty + delta;
      
      if (newOptionQty < 0) return current;
      if (maxOptionQty !== undefined && maxOptionQty !== null && newOptionQty > maxOptionQty) return current;
      if (delta > 0 && maxGroupQty !== undefined && maxGroupQty !== null && currentGroupTotal >= maxGroupQty) return current;

      return {
        ...current,
        [groupId]: {
          ...groupSelections,
          [optionId]: newOptionQty
        }
      };
    });
  };

  const isComboValid = useMemo(() => {
    if (!selectedCombo) return false;
    for (const group of selectedCombo.comboGroups || []) {
       const groupSelections = comboSelections[group.id] || {};
       const currentGroupTotal = Object.values(groupSelections).reduce((a, b) => a + b, 0);
       if (group.minQty && currentGroupTotal < group.minQty) {
          return false;
       }
    }
    return true;
  }, [selectedCombo, comboSelections]);

  const handleConfirmCombo = () => {
    if (!selectedCombo) return;
    addItem(selectedCombo, comboSelections);
    closeComboModal();
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
                          <div className="public-menu-item-actions">
                            <strong className="text-base font-black text-[#241312]">{formatMoney(item.salePrice || item.basePrice)}</strong>
                            {quantity > 0 && item.itemType !== 'combo' && !(item.comboGroups?.length > 0) ? (
                              <div className="inline-flex h-9 items-center overflow-hidden rounded-xl border border-[#D4A373] bg-[#fff8e4] text-[#3A281B]">
                                <button type="button" aria-label={`Remover ${item.name}`} onClick={() => decrementCatalogItem(item.id)} className="flex h-full w-9 items-center justify-center">
                                  <Minus size={13} />
                                </button>
                                <span className="min-w-8 text-center text-xs font-black">{quantity}</span>
                                <button type="button" aria-label={`Adicionar ${item.name}`} onClick={() => handleCatalogAdd(item)} className="flex h-full w-9 items-center justify-center">
                                  <Plus size={13} />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => handleCatalogAdd(item)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#D4A373] px-3 text-[10px] font-black uppercase text-[#3A281B]">
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
                    <button type="button" aria-label={`Aumentar ${item.name}`} onClick={() => addItem(item, item.selections)} className="flex h-full w-8 items-center justify-center">
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
            <SearchableSelect
              value={paymentMethodId}
              onChange={(value) => setPaymentMethodId(value)}
              placeholder="Pagamento a combinar"
              options={(menu?.paymentMethods || []).map((method) => ({
                value: method.id,
                label: method.name
              }))}
            />
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

      {selectedCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h2 className="text-lg font-black uppercase text-[#2A1E15]">{selectedCombo.name}</h2>
              <button onClick={closeComboModal} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-6">
              {selectedCombo.comboGroups?.map(group => {
                const groupSelections = comboSelections[group.id] || {};
                const currentGroupTotal = Object.values(groupSelections).reduce((a, b) => a + b, 0);
                
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-black text-[#2A1E15]">{group.name}</h3>
                      <span className="text-xs font-bold text-gray-500">
                        {group.minQty > 0 ? `Mín: ${group.minQty} ` : ''} 
                        {group.maxQty ? `Máx: ${group.maxQty}` : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {group.options?.filter(opt => opt.isAvailable !== false).map(opt => {
                        const qty = groupSelections[opt.id] || 0;
                        return (
                          <div key={opt.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                            <div>
                              <p className="text-sm font-bold text-[#2A1E15]">{opt.name}</p>
                              {opt.extraPrice > 0 && <p className="text-xs text-[#D4A373] font-bold">+ {formatMoney(opt.extraPrice)}</p>}
                            </div>
                            
                            <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-gray-50 text-[#2A1E15]">
                              <button 
                                type="button" 
                                onClick={() => updateComboSelection(group.id, opt.id, -1, group.maxQty, opt.maxQty)}
                                disabled={qty === 0}
                                className="flex h-full w-8 items-center justify-center text-red-600 disabled:opacity-30"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="min-w-7 text-center text-xs font-black">{qty}</span>
                              <button 
                                type="button" 
                                onClick={() => updateComboSelection(group.id, opt.id, 1, group.maxQty, opt.maxQty)}
                                disabled={(group.maxQty && currentGroupTotal >= group.maxQty) || (opt.maxQty && qty >= opt.maxQty)}
                                className="flex h-full w-8 items-center justify-center disabled:opacity-30"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <button 
                type="button"
                onClick={handleConfirmCombo}
                disabled={!isComboValid}
                className="w-full rounded-xl bg-[#D4A373] px-4 py-3 text-sm font-black uppercase text-[#3A281B] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
