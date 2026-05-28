import React, { useEffect, useMemo, useState } from 'react';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  Printer,
  Receipt,
  ShoppingBag,
  Volume2,
  X
} from 'lucide-react';
import { printOrder } from './orderPrintUtils.js';

const ORDER_STATUS = [
  { id: 'placed', label: 'Caixa', next: 'accepted', previous: null },
  { id: 'accepted', label: 'Aceito', next: 'preparing', previous: 'placed' },
  { id: 'preparing', label: 'Cozinha', next: 'ready', previous: 'accepted' },
  { id: 'ready', label: 'Pronto', next: null, previous: 'preparing' },
  { id: 'dispatched', label: 'Em rota', next: 'delivered', previous: 'ready' },
  { id: 'delivered', label: 'Entregue', next: null, previous: 'dispatched' }
];

const CurrencyInput = ({ value, onChange, placeholder, className, ...props }) => {
  const displayValue = useMemo(() => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(',', '.');
    const num = parseFloat(clean);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      onChange({ target: { value: '' } });
      return;
    }
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      onChange({ target: { value: '' } });
      return;
    }
    const floatValue = (parseInt(digits, 10) / 100).toFixed(2);
    onChange({ target: { value: floatValue } });
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      className={className}
    />
  );
};

const KANBAN_LANES = [
  {
    id: 'placed',
    title: 'Pedido realizado',
    description: 'Entrou no sistema',
    barClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700'
  },
  {
    id: 'accepted',
    title: 'Aceito',
    description: 'Pedido confirmado',
    barClass: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700'
  },
  {
    id: 'preparing',
    title: 'Em preparo',
    description: 'Cozinha e pronto',
    barClass: 'bg-[#2A1E15]',
    badgeClass: 'bg-[#2A1E15]/10 text-[#2A1E15]'
  },
  {
    id: 'route',
    title: 'Em rota',
    description: 'Saiu com motoboy',
    barClass: 'bg-purple-600',
    badgeClass: 'bg-purple-50 text-purple-700'
  },
  {
    id: 'delivered',
    title: 'Entregue',
    description: 'Finalizado',
    barClass: 'bg-green-700',
    badgeClass: 'bg-green-50 text-green-700'
  }
];

const BEVERAGE_MATCHER = /bebida|refrigerante|refri|suco|agua|água|cerveja|drink|lata|garrafa/i;

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function classifySection(category = '', name = '') {
  return BEVERAGE_MATCHER.test(`${category} ${name}`) ? 'beverage' : 'food';
}

function sectionLabel(section) {
  if (section === 'beverage') return 'Bebida';
  if (section === 'other') return 'Observação';
  return 'Comida';
}

function getOrderCustomer(order) {
  return order.customer?.name || order.customer?.fullName || 'Cliente sem nome';
}

function getOrderPayment(order, paymentMethods) {
  return order.paymentMethod?.name
    || paymentMethods.find((method) => method.id === order.paymentMethodId)?.name
    || 'Pagamento não informado';
}

function getKanbanLaneId(order) {
  if (order.status === 'delivered' || order.deliveryStatus === 'delivered') return 'delivered';
  if (order.status === 'dispatched' || order.deliveryStatus === 'out_for_delivery') return 'route';
  if (order.status === 'preparing' || order.status === 'ready') return 'preparing';
  if (order.status === 'accepted') return 'accepted';
  return 'placed';
}

function getKanbanStatusLabel(order) {
  if (order.status === 'ready') return 'Pronto para rota';
  if (order.status === 'preparing') return 'Em preparo';
  if (order.status === 'accepted') return 'Aceito';
  if (order.status === 'dispatched' || order.deliveryStatus === 'out_for_delivery') return 'Em rota';
  if (order.status === 'delivered' || order.deliveryStatus === 'delivered') return 'Entregue';
  return 'Pedido realizado';
}

export default function OrderOperationsPage({
  tenantSlug,
  menuItems,
  menuCategories = [],
  orders,
  customers,
  paymentMethods,
  deliveryDrivers,
  autoAcceptOrders,
  onCreateCustomer,
  onCreateOrder,
  onUpdateOrder,
  onCreatePaymentMethod,
  onToggleAutoAcceptOrders
}) {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedNote, setSelectedNote] = useState('');
  const [comboSelections, setComboSelections] = useState({});
  const [cart, setCart] = useState([]);
  const [customerForm, setCustomerForm] = useState({
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
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dispatchDrafts, setDispatchDrafts] = useState({});
  const [deliveryError, setDeliveryError] = useState('');

  const publicMenuUrl = `${window.location.origin}/cardapio/${tenantSlug}`;
  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => item.status === 'active' || item.status === 'seasonal'),
    [menuItems]
  );
  const selectedMenuItem = useMemo(
    () => visibleMenuItems.find((item) => String(item.id) === String(selectedItemId)) || null,
    [selectedItemId, visibleMenuItems]
  );
  const selectedComboGroups = selectedMenuItem?.itemType === 'combo' ? selectedMenuItem.comboGroups || [] : [];
  const visibleMenuItemOptions = useMemo(() => {
    const categoryNames = menuCategories.map((category) => category.name);
    const groups = categoryNames
      .map((categoryName) => {
        const items = visibleMenuItems
          .filter((item) => item.category === categoryName)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return {
          label: categoryName,
          options: items.map((item) => ({
            value: item.id,
            label: `${item.name} - ${formatMoney(item.salePrice || item.basePrice)}`
          }))
        };
      })
      .filter((group) => group.options.length > 0);
    const uncategorized = visibleMenuItems
      .filter((item) => !categoryNames.includes(item.category))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (uncategorized.length > 0) {
      groups.push({
        label: 'Sem categoria',
        options: uncategorized.map((item) => ({
          value: item.id,
          label: `${item.name} - ${formatMoney(item.salePrice || item.basePrice)}`
        }))
      });
    }

    return groups;
  }, [menuCategories, visibleMenuItems]);
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const cartTotal = cartSubtotal + Number(deliveryFee || 0);
  const kanbanColumns = KANBAN_LANES.map((lane) => ({
    ...lane,
    orders: orders
      .filter((order) => order.status !== 'cancelled' && getKanbanLaneId(order) === lane.id)
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
  }));

  useEffect(() => {
    setComboSelections({});
  }, [selectedItemId]);

  const getComboGroupQuantity = (groupId) => (
    Object.values(comboSelections[groupId] || {}).reduce((sum, qty) => sum + Number(qty || 0), 0)
  );

  const getComboOptionQuantity = (groupId, optionId) => Number(comboSelections[groupId]?.[optionId] || 0);

  const updateComboOptionQuantity = (group, option, delta) => {
    if (!option.isAvailable && delta > 0) return;

    setComboSelections((current) => {
      const groupSelections = current[group.id] || {};
      const currentQty = Number(groupSelections[option.id] || 0);
      const groupQty = Object.values(groupSelections).reduce((sum, qty) => sum + Number(qty || 0), 0);
      const maxGroupQty = Number(group.maxSelect) || 0;
      const maxOptionQty = Number(option.maxQty) || 1;
      const nextQty = Math.max(0, Math.min(currentQty + delta, maxOptionQty));

      if (delta > 0 && maxGroupQty > 0 && groupQty >= maxGroupQty) return current;

      const nextGroupSelections = { ...groupSelections };
      if (nextQty > 0) {
        nextGroupSelections[option.id] = nextQty;
      } else {
        delete nextGroupSelections[option.id];
      }

      return {
        ...current,
        [group.id]: nextGroupSelections
      };
    });
  };

  const getSelectedComboDetails = () => selectedComboGroups.map((group) => {
    const selectedOptions = (group.options || [])
      .map((option) => ({
        ...option,
        quantity: getComboOptionQuantity(group.id, option.id)
      }))
      .filter((option) => option.quantity > 0);

    return {
      id: group.id,
      name: group.name,
      minSelect: Number(group.minSelect) || 0,
      maxSelect: Number(group.maxSelect) || 0,
      options: selectedOptions
    };
  });

  const validateComboSelection = () => {
    for (const group of selectedComboGroups) {
      const selectedQty = getComboGroupQuantity(group.id);
      const minSelect = Number(group.minSelect) || 0;
      const maxSelect = Number(group.maxSelect) || 0;

      if (selectedQty < minSelect) {
        return `Selecione pelo menos ${minSelect} opção(ões) em ${group.name}.`;
      }

      if (maxSelect > 0 && selectedQty > maxSelect) {
        return `Selecione no máximo ${maxSelect} opção(ões) em ${group.name}.`;
      }
    }

    return '';
  };

  const selectedComboExtraTotal = selectedComboGroups.reduce((sum, group) => (
    sum + (group.options || []).reduce((optionSum, option) => (
      optionSum + getComboOptionQuantity(group.id, option.id) * Number(option.extraPrice || 0)
    ), 0)
  ), 0);

  const addSelectedItem = () => {
    const menuItem = selectedMenuItem;
    const quantity = Number(selectedQuantity) || 1;
    if (!menuItem || quantity <= 0) return;

    if (menuItem.itemType === 'combo') {
      const comboError = validateComboSelection();
      if (comboError) {
        setOrderError(comboError);
        return;
      }
    }

    const comboDetails = menuItem.itemType === 'combo' ? getSelectedComboDetails() : [];
    const unitPrice = Number(menuItem.salePrice || menuItem.basePrice || 0) + (menuItem.itemType === 'combo' ? selectedComboExtraTotal : 0);
    const item = {
      id: `${menuItem.id}-${Date.now()}`,
      menuItemId: menuItem.id,
      name: menuItem.name,
      category: menuItem.category || '',
      section: classifySection(menuItem.category, menuItem.name),
      itemType: menuItem.itemType || 'regular',
      comboSelections: comboDetails,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      notes: selectedNote.trim()
    };

    setCart((current) => [...current, item]);
    setSelectedItemId('');
    setSelectedQuantity(1);
    setSelectedNote('');
    setComboSelections({});
    setOrderError('');
  };

  const updateCustomerField = (field, value) => {
    setCustomerForm((current) => ({ ...current, [field]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setOrderError('');
    setOrderSuccess('');

    if (cart.length === 0) {
      setOrderError('Pedido sem item não é pedido. Cadastre pelo menos um item.');
      return;
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      setOrderError('Nome e telefone do cliente são obrigatórios.');
      return;
    }

    setSubmitting(true);

    try {
      const customer = await onCreateCustomer(customerForm);
      const order = await onCreateOrder({
        customerId: customer.id,
        paymentMethodId: paymentMethodId || null,
        orderNumber: `PDV-${Date.now().toString().slice(-6)}`,
        channel: 'proprio',
        orderType: 'delivery',
        status: 'placed',
        deliveryFee: Number(deliveryFee) || 0,
        items: cart.map((cartItem) => {
          const item = { ...cartItem };
          delete item.id;
          return item;
        }),
        notes: orderNotes
      });

      if (!autoAcceptOrders) {
        printOrder(order, paymentMethods);
      }
      setCart([]);
      setOrderNotes('');
      setCustomerForm({
        name: '',
        phone: '',
        addressLine: '',
        addressNumber: '',
        district: '',
        city: '',
        state: 'SP',
        addressComplement: ''
      });
      setOrderSuccess(`Pedido ${order.orderNumber || ''} criado e enviado para cozinha.`);
      setIsOrderModalOpen(false);
    } catch (error) {
      setOrderError(error.message || 'Não foi possível criar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const moveOrderToStatus = async (order, targetStatus) => {
    if (!targetStatus) return;

    const payload = { ...order, status: targetStatus };
    if (targetStatus === 'ready') {
      payload.deliveryStatus = '';
      payload.deliveryDriverId = null;
      payload.deliveryDriver = null;
      payload.dispatchedAt = null;
      payload.deliveredAt = null;
    }
    if (targetStatus === 'dispatched') {
      payload.deliveryStatus = 'out_for_delivery';
      payload.dispatchedAt = order.dispatchedAt || new Date().toISOString();
      payload.deliveredAt = null;
    }
    if (targetStatus === 'delivered') {
      payload.deliveryStatus = 'delivered';
      payload.deliveredAt = new Date().toISOString();
    }
    if (['placed', 'accepted', 'preparing'].includes(targetStatus)) {
      payload.deliveryStatus = '';
      payload.deliveryDriverId = null;
      payload.deliveryDriver = null;
      payload.dispatchedAt = null;
      payload.deliveredAt = null;
    }

    const updated = await onUpdateOrder(payload);
    if (targetStatus === 'accepted') {
      printOrder(updated, paymentMethods);
    }
  };

  const moveOrderByDirection = async (order, direction) => {
    const statusMeta = ORDER_STATUS.find((status) => status.id === order.status);
    const targetStatus = direction === 'next' ? statusMeta?.next : statusMeta?.previous;

    if (direction === 'next' && order.status === 'ready') {
      await dispatchOrder(order);
      return;
    }

    await moveOrderToStatus(order, targetStatus);
  };

  const quickCreateDefaultPayments = async () => {
    const defaults = [
      { name: 'Dinheiro', kind: 'cash', requiresChange: true },
      { name: 'Pix', kind: 'pix', requiresChange: false },
      { name: 'Cartão de crédito', kind: 'credit_card', requiresChange: false },
      { name: 'Cartão de débito', kind: 'debit_card', requiresChange: false }
    ];

    for (const method of defaults) {
      if (!paymentMethods.some((current) => current.name.toLowerCase() === method.name.toLowerCase())) {
        await onCreatePaymentMethod(method);
      }
    }
  };

  const updateDispatchDraft = (orderId, field, value) => {
    setDispatchDrafts((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {}),
        [field]: value
      }
    }));
  };

  const dispatchOrder = async (order) => {
    const draft = dispatchDrafts[order.id] || {};
    const driver = deliveryDrivers.find((item) => item.id === draft.deliveryDriverId);
    if (!driver) {
      setDeliveryError('Escolha um motoboy antes de despachar.');
      return;
    }

    const now = new Date().toISOString();
    const driverDeliveryAmount = Number(draft.driverDeliveryAmount || driver.perDeliveryRate || 0);
    const driverDailyAmount = Number(draft.driverDailyAmount || driver.dailyRate || 0);
    const deliveryCost = driverDeliveryAmount;
    const updated = await onUpdateOrder({
      ...order,
      status: 'dispatched',
      deliveryStatus: 'out_for_delivery',
      deliveryDriverId: driver.id,
      deliveryDriver: driver,
      dispatchedAt: now,
      deliveryCost,
      driverDeliveryAmount,
      driverDailyAmount,
      cashChangeRequired: Number(draft.cashChangeRequired || 0),
      cardMachineCode: draft.cardMachineCode || ''
    });

    setDispatchDrafts((current) => {
      const next = { ...current };
      delete next[order.id];
      return next;
    });
    printOrder(updated, paymentMethods);
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <section className="bg-[#2A1E15] text-white rounded-[1.5rem] p-5 sm:p-7 xl:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-[10px] font-black text-[#F3E8DA] uppercase tracking-[0.25em]">Canal próprio</p>
            <h3 className="mt-2 text-2xl xl:text-3xl font-black uppercase tracking-tight">Pedidos nascem aqui</h3>
            <p className="mt-2 max-w-3xl text-sm font-bold text-white/75">
              Link público, caixa, cozinha, status e impressão no mesmo fluxo. Isso é o mínimo para começar a desligar Anota Aí.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={publicMenuUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4A373] px-4 py-3 text-xs font-black uppercase text-[#3A281B]"
            >
              <ExternalLink size={15} /> Abrir link
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(publicMenuUrl)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-black uppercase text-white ring-1 ring-white/20"
            >
              <Copy size={15} /> Copiar link
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Itens vendáveis</p>
          <strong className="block mt-2 text-2xl font-black text-[#2A1E15]">{visibleMenuItems.length}</strong>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Pedidos abertos</p>
          <strong className="block mt-2 text-2xl font-black text-[#2A1E15]">{orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length}</strong>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Clientes</p>
          <strong className="block mt-2 text-2xl font-black text-[#2A1E15]">{customers.length}</strong>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Pagamentos</p>
          <strong className="block mt-2 text-2xl font-black text-[#2A1E15]">{paymentMethods.length}</strong>
        </div>
      </div>

      <section className="bg-white rounded-[1.5rem] border border-gray-100 p-5 sm:p-7 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4A373]">Esteira operacional</p>
            <h4 className="text-lg font-black uppercase tracking-tight text-[#2A1E15]">Kanban de pedidos</h4>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-xs font-bold text-[#696965]">
              O pedido entra em tempo real no primeiro bloco. Se ficar parado aqui, a operação está parada de verdade.
            </p>
            <button
              type="button"
              onClick={onToggleAutoAcceptOrders}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase ring-1 ${
                autoAcceptOrders
                  ? 'bg-green-700 text-white ring-green-700'
                  : 'bg-[#FAF6EF] text-[#2A1E15] ring-gray-100'
              }`}
            >
              <Volume2 size={15} /> {autoAcceptOrders ? 'Aceite auto ligado' : 'Aceite auto desligado'}
            </button>
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase text-white"
            >
              <Plus size={15} /> Novo pedido
            </button>
          </div>
        </div>

        {deliveryError && <p className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-700">{deliveryError}</p>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {kanbanColumns.map((lane) => (
            <div key={lane.id} className="min-h-[300px] rounded-2xl border border-gray-100 bg-[#F3E8DA] p-3">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <div className={`mb-2 h-1.5 w-12 rounded-full ${lane.barClass}`} />
                  <h5 className="text-xs font-black uppercase tracking-tight text-[#2A1E15]">{lane.title}</h5>
                  <p className="mt-1 text-[10px] font-bold uppercase text-[#696965]">{lane.description}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${lane.badgeClass}`}>{lane.orders.length}</span>
              </div>

              <div className="space-y-3">
                {lane.orders.map((order) => {
                  const foodCount = (order.items || []).filter((item) => item.section !== 'beverage').length;
                  const beverageCount = (order.items || []).filter((item) => item.section === 'beverage').length;
                  const statusMeta = ORDER_STATUS.find((status) => status.id === order.status);
                  const draft = dispatchDrafts[order.id] || {};
                  const selectedDriver = deliveryDrivers.find((driver) => driver.id === draft.deliveryDriverId);

                  return (
                    <article key={order.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black uppercase text-[#2A1E15]">{order.orderNumber || 'Pedido'}</p>
                          <p className="mt-1 truncate text-[10px] font-bold text-[#696965]">{getOrderCustomer(order)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#FAF6EF] px-2 py-1 text-[9px] font-black uppercase text-[#2A1E15]">
                          {getKanbanStatusLabel(order)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl bg-[#FAF6EF] p-2">
                          <p className="text-[9px] font-black uppercase text-[#696965]">Total</p>
                          <p className="text-xs font-black text-[#2A1E15]">{formatMoney(order.total)}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAF6EF] p-2">
                          <p className="text-[9px] font-black uppercase text-[#696965]">Itens</p>
                          <p className="text-xs font-black text-[#2A1E15]">{foodCount + beverageCount}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] font-bold uppercase text-[#696965]">
                        {getOrderPayment(order, paymentMethods)}
                      </p>

                      {order.notes && (
                        <p className="mt-2 line-clamp-2 rounded-xl bg-[#fffaf0] p-2 text-[10px] font-bold text-[#2A1E15]">
                          {order.notes}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => printOrder(order, paymentMethods)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF6EF] px-2.5 py-2 text-[9px] font-black uppercase text-[#2A1E15]">
                          <Printer size={12} /> Imprimir
                        </button>
                        {statusMeta?.previous && (
                          <button
                            type="button"
                            onClick={() => moveOrderByDirection(order, 'previous')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF6EF] text-[#2A1E15]"
                            aria-label="Voltar status do pedido"
                            title="Voltar"
                          >
                            <ChevronLeft size={15} />
                          </button>
                        )}
                        {(statusMeta?.next || order.status === 'ready') && order.status !== 'ready' && (
                          <button
                            type="button"
                            onClick={() => moveOrderByDirection(order, 'next')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#2A1E15] text-white"
                            aria-label="Avançar status do pedido"
                            title="Avançar"
                          >
                            <ChevronRight size={15} />
                          </button>
                        )}
                      </div>

                      {order.status === 'ready' && (
                        <div className="mt-3 space-y-2 rounded-2xl bg-[#FAF6EF] p-3">
                          <SearchableSelect
                            value={draft.deliveryDriverId || ''}
                            onChange={(value) => updateDispatchDraft(order.id, 'deliveryDriverId', value)}
                            className="searchable-select--compact"
                            placeholder="Motoboy"
                            options={deliveryDrivers.filter((driver) => driver.status === 'active').map((driver) => ({
                              value: driver.id,
                              label: driver.name
                            }))}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <CurrencyInput
                              value={draft.driverDeliveryAmount ?? selectedDriver?.perDeliveryRate ?? ''}
                              onChange={(event) => updateDispatchDraft(order.id, 'driverDeliveryAmount', event.target.value)}
                              placeholder="Entrega"
                              className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#D4A373]"
                            />
                            <CurrencyInput
                              value={draft.cashChangeRequired || ''}
                              onChange={(event) => updateDispatchDraft(order.id, 'cashChangeRequired', event.target.value)}
                              placeholder="Troco"
                              className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#D4A373]"
                            />
                          </div>
                          <input
                            value={draft.cardMachineCode || ''}
                            onChange={(event) => updateDispatchDraft(order.id, 'cardMachineCode', event.target.value)}
                            placeholder="Máquina/cartão"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#D4A373]"
                          />
                          <button
                            type="button"
                            onClick={() => moveOrderByDirection(order, 'next')}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-[#2A1E15] px-3 py-2.5 text-white"
                            aria-label="Enviar pedido para rota"
                            title="Enviar para rota"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}

                {lane.orders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-4 text-center text-[10px] font-black uppercase tracking-widest text-[#696965]">
                    Sem pedidos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-2xl sm:p-7">
        <form onSubmit={submitOrder} className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4A373]">Tela do caixa</p>
              <h4 className="text-lg font-black uppercase tracking-tight text-[#2A1E15]">Novo pedido</h4>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="text-[#D4A373]" size={22} />
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="rounded-xl bg-[#FAF6EF] p-2 text-[#2A1E15]"
                aria-label="Fechar novo pedido"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {orderError && <p className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-700">{orderError}</p>}
          {orderSuccess && <p className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs font-bold text-green-700">{orderSuccess}</p>}

          {paymentMethods.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#D4A373]/50 bg-[#fffaf0] p-4">
              <p className="text-xs font-black uppercase text-[#2A1E15]">Sem formas de pagamento</p>
              <button type="button" onClick={quickCreateDefaultPayments} className="mt-3 rounded-xl bg-[#2A1E15] px-4 py-2 text-[10px] font-black uppercase text-white">
                Criar padrão
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Cliente</span>
              <input value={customerForm.name} onChange={(event) => updateCustomerField('name', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Telefone</span>
              <input value={customerForm.phone} onChange={(event) => updateCustomerField('phone', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-[#696965]">Endereço</span>
              <input value={customerForm.addressLine} onChange={(event) => updateCustomerField('addressLine', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Número</span>
              <input value={customerForm.addressNumber} onChange={(event) => updateCustomerField('addressNumber', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Bairro</span>
              <input value={customerForm.district} onChange={(event) => updateCustomerField('district', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Cidade</span>
              <input value={customerForm.city} onChange={(event) => updateCustomerField('city', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Complemento</span>
              <input value={customerForm.addressComplement} onChange={(event) => updateCustomerField('addressComplement', event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Item</span>
              <SearchableSelect
                value={selectedItemId}
                onChange={(value) => setSelectedItemId(value)}
                placeholder="Selecione"
                options={visibleMenuItemOptions}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Qtd</span>
              <input type="number" min="1" value={selectedQuantity} onChange={(event) => setSelectedQuantity(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
          </div>

          {selectedComboGroups.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-[#D4A373]/30 bg-[#fffaf0] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A5A2B]">Opções do combo</p>
                  <p className="text-xs font-bold text-[#696965]">Respeite os mínimos e máximos definidos no cadastro.</p>
                </div>
                <strong className="text-sm font-black text-[#2A1E15]">
                  {formatMoney(Number(selectedMenuItem?.basePrice || 0) + selectedComboExtraTotal)}
                </strong>
              </div>

              {selectedComboGroups.map((group) => {
                const selectedQty = getComboGroupQuantity(group.id);
                const minSelect = Number(group.minSelect) || 0;
                const maxSelect = Number(group.maxSelect) || 0;

                return (
                  <div key={group.id} className="rounded-xl border border-gray-100 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase text-[#2A1E15]">{group.name}</p>
                        <p className="text-[10px] font-bold uppercase text-[#696965]">Selecionado {selectedQty} de {minSelect} a {maxSelect}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(group.options || []).map((option) => {
                        const optionQty = getComboOptionQuantity(group.id, option.id);
                        const optionMax = Number(option.maxQty) || 1;
                        const cannotAdd = !option.isAvailable || optionQty >= optionMax || (maxSelect > 0 && selectedQty >= maxSelect);

                        return (
                          <div key={option.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${option.isAvailable ? 'border-gray-100 bg-[#FAF6EF]' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black uppercase text-[#2A1E15]">{option.name}</p>
                              <p className="text-[10px] font-bold uppercase text-[#696965]">
                                {Number(option.extraPrice || 0) > 0 ? `+ ${formatMoney(option.extraPrice)}` : 'Sem adicional'} · Máx. {optionMax}
                              </p>
                            </div>
                            <div className="inline-flex h-8 items-center overflow-hidden rounded-lg bg-white text-[#2A1E15] ring-1 ring-gray-100">
                              <button type="button" onClick={() => updateComboOptionQuantity(group, option, -1)} disabled={optionQty === 0} className="flex h-full w-8 items-center justify-center text-red-600 disabled:opacity-30">
                                <Minus size={13} />
                              </button>
                              <span className="min-w-7 text-center text-xs font-black">{optionQty}</span>
                              <button type="button" onClick={() => updateComboOptionQuantity(group, option, 1)} disabled={cannotAdd} className="flex h-full w-8 items-center justify-center disabled:opacity-30">
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
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input value={selectedNote} onChange={(event) => setSelectedNote(event.target.value)} placeholder="Observação do item" className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            <button type="button" onClick={addSelectedItem} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4A373] px-4 py-3 text-xs font-black uppercase text-[#3A281B]">
              <Plus size={15} /> Adicionar
            </button>
          </div>

          <div className="space-y-2">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs font-bold text-[#696965]">Carrinho vazio.</div>
            ) : cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF6EF] px-3 py-3">
                <div>
                  <p className="text-sm font-black text-[#2A1E15]">{item.quantity}x {item.name}</p>
                  <p className="text-[10px] font-bold uppercase text-[#696965]">{sectionLabel(item.section)} {item.notes ? `- ${item.notes}` : ''}</p>
                  {item.comboSelections?.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.comboSelections.map((group) => (
                        <p key={group.id} className="text-[10px] font-bold text-[#696965]">
                          {group.name}: {group.options.map((option) => `${option.quantity}x ${option.name}`).join(', ')}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-black text-[#2A1E15]">{formatMoney(item.totalPrice)}</strong>
                  <button type="button" onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))} className="rounded-lg bg-white p-2 text-red-600">
                    <Minus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-[#696965]">Pagamento</span>
              <SearchableSelect
                value={paymentMethodId}
                onChange={(value) => setPaymentMethodId(value)}
                placeholder="A combinar"
                options={paymentMethods.map((method) => ({
                  value: method.id,
                  label: method.name
                }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#696965]">Entrega</span>
              <CurrencyInput value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />
            </label>
          </div>

          <textarea value={orderNotes} onChange={(event) => setOrderNotes(event.target.value)} placeholder="Observações gerais do pedido" className="min-h-[90px] w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#D4A373]" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-[#2A1E15]/5 p-4">
            <div>
              <p className="text-[10px] font-black uppercase text-[#696965]">Total</p>
              <strong className="text-2xl font-black text-[#2A1E15]">{formatMoney(cartTotal)}</strong>
            </div>
            <button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1E15] px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-60">
              <ShoppingBag size={16} /> Criar e imprimir
            </button>
          </div>
        </form>
          </div>
        </div>
      )}

    </div>
  );
}
