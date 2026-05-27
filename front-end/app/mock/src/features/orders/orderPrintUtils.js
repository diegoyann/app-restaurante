function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function getOrderCustomer(order) {
  return order.customer?.name || order.customer?.fullName || 'Cliente sem nome';
}

function getOrderPayment(order, paymentMethods) {
  return order.paymentMethod?.name
    || paymentMethods.find((method) => method.id === order.paymentMethodId)?.name
    || 'Pagamento não informado';
}

export function buildReceiptText(order, paymentMethods) {
  const customer = order.customer || {};
  const lines = [
    `Pedido ${order.orderNumber || order.id}`,
    `Cliente: ${getOrderCustomer(order)}`,
    `Telefone: ${customer.phone || '-'}`,
    `Endereco: ${[customer.addressLine, customer.addressNumber, customer.district, customer.city].filter(Boolean).join(', ') || '-'}`,
    `Pagamento: ${getOrderPayment(order, paymentMethods)}`,
    '',
    'Itens:'
  ];

  (order.items || []).forEach((item) => {
    lines.push(`${Number(item.quantity || 0)}x ${item.name} - ${formatMoney(item.totalPrice)}`);
    if (item.notes) lines.push(`  Obs: ${item.notes}`);
  });

  lines.push('');
  lines.push(`Entrega: ${formatMoney(order.deliveryFee)}`);
  lines.push(`Total: ${formatMoney(order.total)}`);
  if (order.notes) lines.push(`Obs geral: ${order.notes}`);

  return lines.join('\n');
}

export function printOrder(order, paymentMethods) {
  const receipt = buildReceiptText(order, paymentMethods);
  const popup = window.open('', '_blank', 'width=420,height=640');
  if (!popup) return;

  popup.document.write(`
    <html>
      <head>
        <title>Pedido ${order.orderNumber || ''}</title>
        <style>
          body { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; padding: 16px; white-space: pre-wrap; font-size: 13px; }
        </style>
      </head>
      <body>${receipt.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function playNewOrderSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.16);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.38);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.42);
  window.setTimeout(() => audioContext.close(), 600);
}
