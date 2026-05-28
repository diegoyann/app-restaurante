import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { publicMenuApi } from '../services/api.js';
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

  const addItem = (item) => {
    const unitPrice = Number(item.salePrice || item.basePrice || 0);
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.menuItemId === item.id);

      if (existing) {
        return current.map((cartItem) => {
          if (cartItem.menuItemId !== item.id) return cartItem;
          const quantity = cartItem.quantity + 1;
          return { ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice };
        });
      }

      return [
        ...current,
        {
          id: item.id,
          menuItemId: item.id,
          name: item.name,
          category: item.category || '',
          section: classifySection(item.category, item.name),
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
          notes: ''
        }
      ];
    });
  };

  const decrementItem = (menuItemId) => {
    setCart((current) => current.flatMap((cartItem) => {
      if (cartItem.menuItemId !== menuItemId) return [cartItem];
      const quantity = cartItem.quantity - 1;
      return quantity > 0 ? [{ ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice }] : [];
    }));
  };

  const getCartQuantity = (menuItemId) => (
    cart.find((cartItem) => cartItem.menuItemId === menuItemId)?.quantity || 0
  );

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
                            {quantity > 0 ? (
                              <div className="inline-flex h-9 items-center overflow-hidden rounded-xl border border-[#D4A373] bg-[#fff8e4] text-[#3A281B]">
                                <button type="button" aria-label={`Remover ${item.name}`} onClick={() => decrementItem(item.id)} className="flex h-full w-9 items-center justify-center">
                                  <Minus size={13} />
                                </button>
                                <span className="min-w-8 text-center text-xs font-black">{quantity}</span>
                                <button type="button" aria-label={`Adicionar ${item.name}`} onClick={() => addItem(item)} className="flex h-full w-9 items-center justify-center">
                                  <Plus size={13} />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => addItem(item)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#D4A373] px-3 text-[10px] font-black uppercase text-[#3A281B]">
                                <Plus size={13} /> Adicionar
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
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FAF6EF] px-3 py-3">
                <div>
                  <p className="text-sm font-black text-[#2A1E15]">{item.name}</p>
                  <p className="text-xs font-bold text-[#696965]">{item.quantity} x {formatMoney(item.unitPrice)} = {formatMoney(item.totalPrice)}</p>
                </div>
                <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-white text-[#2A1E15]">
                  <button type="button" aria-label={`Diminuir ${item.name}`} onClick={() => decrementItem(item.menuItemId)} className="flex h-full w-8 items-center justify-center text-red-600">
                    <Minus size={13} />
                  </button>
                  <span className="min-w-7 text-center text-xs font-black">{item.quantity}</span>
                  <button type="button" aria-label={`Aumentar ${item.name}`} onClick={() => addItem(item)} className="flex h-full w-8 items-center justify-center">
                    <Plus size={13} />
                  </button>
                </div>
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
            <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]">
              <option value="">Pagamento a combinar</option>
              {(menu?.paymentMethods || []).map((method) => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
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
