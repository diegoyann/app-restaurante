const clone = (value) => JSON.parse(JSON.stringify(value));

const baseRevenueChart = [
  { day: '01', bruto: 4200, liquido: 3610, pedidos: 32 },
  { day: '02', bruto: 5100, liquido: 4380, pedidos: 39 },
  { day: '03', bruto: 3900, liquido: 3340, pedidos: 28 },
  { day: '04', bruto: 6800, liquido: 5860, pedidos: 47 },
  { day: '05', bruto: 7200, liquido: 6230, pedidos: 51 },
  { day: '06', bruto: 6100, liquido: 5270, pedidos: 43 },
  { day: '07', bruto: 4700, liquido: 4060, pedidos: 34 },
  { day: '08', bruto: 5300, liquido: 4580, pedidos: 38 },
  { day: '09', bruto: 4900, liquido: 4230, pedidos: 35 },
  { day: '10', bruto: 7600, liquido: 6570, pedidos: 55 },
  { day: '11', bruto: 8400, liquido: 7260, pedidos: 61 },
  { day: '12', bruto: 7900, liquido: 6820, pedidos: 58 },
  { day: '13', bruto: 5600, liquido: 4840, pedidos: 41 },
  { day: '14', bruto: 6000, liquido: 5180, pedidos: 44 },
  { day: '15', bruto: 8700, liquido: 7520, pedidos: 63 }
];

const baseReviews = [
  {
    id: 'g-001',
    source: 'google',
    sourceReviewId: 'google_9865241',
    companyKey: 'rei-centro',
    companyLabel: 'Rei das Esfihas',
    unitLabel: 'Unidade Centro',
    channelLabel: 'Google Business Profile',
    reviewerName: 'Carlos Almeida',
    reviewerInitials: 'C',
    reviewerLocation: 'Centro',
    rating: 2,
    sentiment: 'negative',
    status: 'pending',
    createdAtLabel: 'Há 2 horas',
    publishedReply: '',
    tags: ['Atraso', 'Comida fria'],
    comment: 'A pizza demorou mais de uma hora e chegou fria. Decepcionante.',
    aiSuggestion: 'Olá Carlos. Pedimos desculpas pela demora e pela temperatura do pedido. Isso ficou abaixo do nosso padrão. Se puder, fale com a nossa equipe no WhatsApp para resolvermos e compensarmos essa experiência.',
    integrationStatus: 'connected'
  },
  {
    id: 'if-002',
    source: 'ifood',
    sourceReviewId: 'ifood_223744',
    companyKey: 'rei-centro',
    companyLabel: 'Rei das Esfihas',
    unitLabel: 'Delivery Centro',
    channelLabel: 'iFood',
    reviewerName: 'Patrícia Lima',
    reviewerInitials: 'P',
    reviewerLocation: 'Jardins',
    rating: 5,
    sentiment: 'positive',
    status: 'pending',
    createdAtLabel: 'Há 38 minutos',
    publishedReply: '',
    tags: ['Entrega rápida', 'Muito sabor'],
    comment: 'Chegou super rápido e as esfihas vieram muito bem recheadas. Excelente.',
    aiSuggestion: 'Oi Patrícia. Obrigado por reconhecer a velocidade e o capricho do pedido. Ficamos felizes demais com a sua avaliação e vamos manter esse padrão nas próximas entregas.',
    integrationStatus: 'connected'
  },
  {
    id: 'g-003',
    source: 'google',
    sourceReviewId: 'google_9865242',
    companyKey: 'rei-norte',
    companyLabel: 'Rei das Esfihas',
    unitLabel: 'Unidade Zona Norte',
    channelLabel: 'Google Business Profile',
    reviewerName: 'Marina Souza',
    reviewerInitials: 'M',
    reviewerLocation: 'Zona Norte',
    rating: 3,
    sentiment: 'neutral',
    status: 'pending',
    createdAtLabel: 'Há 4 horas',
    publishedReply: '',
    tags: ['Atendimento', 'Salão cheio'],
    comment: 'O atendimento foi educado, mas o salão estava desorganizado e demorou para liberar mesa.',
    aiSuggestion: 'Olá Marina. Obrigado pelo feedback sincero. Vamos revisar o fluxo do salão para reduzir a espera e melhorar a organização nos horários de pico. Sua avaliação ajuda a ajustar a operação.',
    integrationStatus: 'connected'
  },
  {
    id: 'if-004',
    source: 'ifood',
    sourceReviewId: 'ifood_223745',
    companyKey: 'rei-centro',
    companyLabel: 'Rei das Esfihas',
    unitLabel: 'Delivery Centro',
    channelLabel: 'iFood',
    reviewerName: 'Rafael Gomes',
    reviewerInitials: 'R',
    reviewerLocation: 'Bela Vista',
    rating: 1,
    sentiment: 'negative',
    status: 'resolved',
    resolutionType: 'published',
    createdAtLabel: 'Ontem',
    publishedReply: 'Olá Rafael. Sentimos muito pela falha no envio do pedido. Já reforçamos a conferência antes da saída e nossa equipe entrou em contato para corrigir o problema.',
    tags: ['Pedido incompleto'],
    comment: 'Veio faltando item no pedido. Só percebi quando o entregador já tinha ido embora.',
    aiSuggestion: 'Olá Rafael. Pedimos desculpas pelo pedido ter saído incompleto. Isso é erro operacional nosso. Já reforçamos a conferência e queremos corrigir a situação com você.',
    integrationStatus: 'connected'
  }
];

const baseBootstrap = {
  settings: {
    ifoodTax: 23,
    anotaaiTax: 5,
    businessName: 'Rei das Esfihas',
    alertDaysBefore: 3
  },
  aiBehaviorSettings: {
    positiveTone: 'friendly',
    crisisStrategy: 'whatsapp',
    additionalInstructions: '',
    autoPublishPositive: true
  },
  payrollConfig: {
    salaryPercentage: 60,
    salaryBusinessDayOrdinal: 5,
    advancePercentage: 40,
    advanceFixedDay: 20,
    advanceBusinessDayPolicy: 'next',
    holidayDates: []
  },
  employeeRoles: [
    { id: 1, name: 'Esfiharia' },
    { id: 2, name: 'Atendimento' },
    { id: 3, name: 'Pizzaiolo' },
    { id: 4, name: 'Gerência' }
  ],
  discountCategories: [
    { id: 1, name: 'Falta' },
    { id: 2, name: 'Atraso' },
    { id: 3, name: 'Adiantamento' },
    { id: 4, name: 'Outros' }
  ],
  employees: [
    {
      id: 1,
      name: 'João da Massa',
      phone: '',
      email: '',
      address: '',
      maritalStatus: '',
      role: 'Esfiharia',
      notes: '',
      employmentType: 'fixed',
      status: 'active',
      salary: 2200,
      admissionDate: '',
      discounts: [{ id: 1, category: 'Falta', amount: 0 }]
    },
    {
      id: 2,
      name: 'Maria do Balcão',
      phone: '',
      email: '',
      address: '',
      maritalStatus: '',
      role: 'Atendimento',
      notes: '',
      employmentType: 'fixed',
      status: 'active',
      salary: 1800,
      admissionDate: '',
      discounts: [{ id: 1, category: 'Outros', amount: 0 }]
    },
    {
      id: 3,
      name: 'Carlos da Fornalha',
      phone: '',
      email: '',
      address: '',
      maritalStatus: '',
      role: 'Pizzaiolo',
      notes: 'Prestador semanal',
      employmentType: 'external',
      status: 'active',
      paymentMode: 'weekly',
      baseAmount: 450,
      weekday: '5',
      specificDate: '',
      startDate: ''
    }
  ],
  ingredients: [
    { id: 1, name: 'Farinha', unit: 'g', packageQuantity: 1000, packageCost: 4.4, unitCost: 0.0044 },
    { id: 2, name: 'Carne Moída', unit: 'g', packageQuantity: 1000, packageCost: 32, unitCost: 0.032 },
    { id: 3, name: 'Queijo Mussarela', unit: 'g', packageQuantity: 1000, packageCost: 28, unitCost: 0.028 },
    { id: 4, name: 'Molho de Tomate', unit: 'g', packageQuantity: 1000, packageCost: 9, unitCost: 0.009 },
    { id: 5, name: 'Embalagem', unit: 'un', packageQuantity: 1, packageCost: 0.35, unitCost: 0.35 }
  ],
  ingredientUnits: [
    { id: 1, label: 'g' },
    { id: 2, label: 'ml' },
    { id: 3, label: 'un' },
    { id: 4, label: 'kg' }
  ],
  preparations: [
    {
      id: 1,
      name: 'Carne Moída Temperada',
      yieldQuantity: 1,
      yieldUnit: 'kg',
      recipe: [
        { componentType: 'ingredient', componentId: 2, quantity: 0.85, quantityUnit: 'kg' },
        { componentType: 'ingredient', componentId: 4, quantity: 120, quantityUnit: 'g' }
      ]
    }
  ],
  products: [
    {
      id: 1,
      name: 'Esfiha de Carne',
      salePrice: 8,
      yieldQuantity: 1,
      targetCmvPercent: 30,
      recipe: [
        { componentType: 'ingredient', componentId: 1, quantity: 90, quantityUnit: 'g' },
        { componentType: 'preparation', componentId: 1, quantity: 70, quantityUnit: 'g' },
        { componentType: 'ingredient', componentId: 5, quantity: 1, quantityUnit: 'un' }
      ]
    },
    {
      id: 2,
      name: 'Pizza Brotinho',
      salePrice: 24,
      yieldQuantity: 1,
      targetCmvPercent: 32,
      recipe: [
        { componentType: 'ingredient', componentId: 1, quantity: 220, quantityUnit: 'g' },
        { componentType: 'ingredient', componentId: 3, quantity: 140, quantityUnit: 'g' },
        { componentType: 'ingredient', componentId: 4, quantity: 90, quantityUnit: 'g' },
        { componentType: 'ingredient', componentId: 5, quantity: 1, quantityUnit: 'un' }
      ]
    }
  ],
  menuCategories: [
    { id: 1, name: 'Esfiha' },
    { id: 2, name: 'Pizza' },
    { id: 3, name: 'Lanche' },
    { id: 4, name: 'Combo' },
    { id: 5, name: 'Bebida' },
    { id: 6, name: 'Sobremesa' }
  ],
  menuItems: [
    {
      id: 1,
      itemType: 'regular',
      name: 'Esfiha Premium de Carne',
      category: 'Esfiha',
      description: 'Massa leve com recheio bem temperado, toque de limão e apresentação individual.',
      status: 'active',
      salePrice: 11.9,
      photoPreview: '',
      linkedComponents: [
        { type: 'product', id: 1 },
        { type: 'ingredient', id: 5 }
      ],
      comboGroups: [],
      basePrice: null,
      createdAt: '2026-04-01T12:00:00.000Z'
    },
    {
      id: 2,
      itemType: 'regular',
      name: 'Pizza Brotinho Casa',
      category: 'Pizza',
      description: 'Massa artesanal, molho da casa, queijo derretido e sabor clássico para compartilhar.',
      status: 'seasonal',
      salePrice: 29.9,
      photoPreview: '',
      linkedComponents: [
        { type: 'product', id: 2 },
        { type: 'preparation', id: 1 }
      ],
      comboGroups: [],
      basePrice: null,
      createdAt: '2026-04-05T18:30:00.000Z'
    },
    {
      id: 3,
      itemType: 'combo',
      name: 'Banquete Real',
      category: 'Combo',
      description: 'Combo grande com sabores clássicos e uma bebida obrigatória, inspirado no fluxo operacional de marketplaces.',
      status: 'active',
      salePrice: null,
      basePrice: 80,
      photoPreview: '',
      linkedComponents: [],
      comboGroups: [
        {
          id: 'combo-group-1',
          name: 'Clássicas',
          minSelect: 15,
          maxSelect: 15,
          options: [
            { id: 'combo-option-1', name: 'Carne', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: true, linkedComponentRef: 'product:1' },
            { id: 'combo-option-2', name: 'Calabresa', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: true, linkedComponentRef: '' },
            { id: 'combo-option-3', name: 'Queijo', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: true, linkedComponentRef: '' },
            { id: 'combo-option-4', name: 'Frango', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: false, linkedComponentRef: '' }
          ]
        },
        {
          id: 'combo-group-2',
          name: 'Bebidas',
          minSelect: 1,
          maxSelect: 1,
          options: [
            { id: 'combo-option-5', name: 'Kuat 2L', photoPreview: '', extraPrice: 0, maxQty: 1, isAvailable: true, linkedComponentRef: '' },
            { id: 'combo-option-6', name: 'Fanta Laranja 2L', photoPreview: '', extraPrice: 0, maxQty: 1, isAvailable: true, linkedComponentRef: '' },
            { id: 'combo-option-7', name: 'Coca-Cola Original 2L', photoPreview: '', extraPrice: 6, maxQty: 1, isAvailable: false, linkedComponentRef: '' }
          ]
        }
      ],
      createdAt: '2026-04-05T18:30:00.000Z'
    }
  ],
  recurringCosts: [
    { id: 1, desc: 'Aluguel', amount: 3000, dueDay: 10, lastPaidMonth: '' },
    { id: 2, desc: 'Energia Elétrica', amount: 850, dueDay: 15, lastPaidMonth: '' }
  ],
  salesChannels: [
    { id: 1, name: 'ifood' },
    { id: 2, name: 'anotaai' }
  ],
  financeExpenseCategories: [
    { id: 1, name: 'Compra de Insumos' },
    { id: 2, name: 'Fornecedor' },
    { id: 3, name: 'Manutenção' },
    { id: 4, name: 'Marketing' },
    { id: 5, name: 'Imposto' },
    { id: 6, name: 'Retirada' },
    { id: 7, name: 'Outras Saídas' }
  ],
  transactions: [
    { id: 1, date: '2024-04-09', platform: 'ifood', payment: 'online', amount: 1200, tax: 23, net: 924, type: 'receita', category: 'ifood', note: 'Pedidos iFood' },
    { id: 2, date: '2024-04-09', platform: 'anotaai', payment: 'pix', amount: 650, tax: 5, net: 617.5, type: 'receita', category: 'anotaai', note: 'Pedidos Anota AI' },
    { id: 3, date: '2024-04-09', platform: 'despesa', payment: 'pix', amount: 180, tax: 0, net: -180, type: 'despesa', category: 'Compra de Insumos', note: 'Reposição de hortifruti' }
  ],
  customers: [],
  paymentMethods: [
    { id: 'pay_cash', name: 'Dinheiro', kind: 'cash', requiresChange: true, status: 'active' },
    { id: 'pay_pix', name: 'Pix', kind: 'pix', requiresChange: false, status: 'active' },
    { id: 'pay_credit', name: 'Cartão de crédito', kind: 'credit_card', requiresChange: false, status: 'active' },
    { id: 'pay_debit', name: 'Cartão de débito', kind: 'debit_card', requiresChange: false, status: 'active' }
  ],
  orders: [],
  deliveryDrivers: [
    { id: 'driver_1', name: 'João Entregas', phone: '11988887777', vehicle: 'moto', dailyRate: 80, perDeliveryRate: 7, status: 'active', notes: '' },
    { id: 'driver_2', name: 'Marcos Delivery', phone: '11977776666', vehicle: 'moto', dailyRate: 70, perDeliveryRate: 8, status: 'active', notes: '' }
  ],
  financialClosings: [],
  reviews: baseReviews
};

function createTenantRecord({ id, slug, name, businessName = name, bootstrap = {}, revenueChart = baseRevenueChart }) {
  const normalizedBootstrap = clone({
    ...baseBootstrap,
    ...bootstrap,
    settings: {
      ...baseBootstrap.settings,
      ...bootstrap.settings,
      businessName
    }
  });

  if (Array.isArray(bootstrap.reviews)) {
    normalizedBootstrap.reviews = clone(bootstrap.reviews);
  }

  return {
    id,
    slug,
    name,
    businessName,
    bootstrap: normalizedBootstrap,
    revenueChart: clone(revenueChart)
  };
}

export const MOCK_TENANT_RECORDS = [
  createTenantRecord({
    id: 'ten_reidasesfihas',
    slug: 'reidasesfihas',
    name: 'Rei das Esfihas'
  }),
  createTenantRecord({
    id: 'ten_demo',
    slug: 'demo',
    name: 'Demo Restaurante'
  }),
  createTenantRecord({
    id: 'ten_esfiharia_express',
    slug: 'esfiharia-express',
    name: 'Esfiharia Express'
  })
];

export const MOCK_USERS = [
  {
    id: 'usr_super_admin',
    email: 'admin@gestaofood.com.br',
    fullName: 'Administrador Global',
    role: 'super_admin',
    tenantSlug: null
  },
  {
    id: 'usr_rei',
    email: 'rei@reidasesfihas.com',
    fullName: 'Rei das Esfihas',
    role: 'tenant_admin',
    tenantSlug: 'reidasesfihas'
  },
  {
    id: 'usr_demo',
    email: 'demo@gestaofood.com.br',
    fullName: 'Demo Restaurante',
    role: 'tenant_admin',
    tenantSlug: 'demo'
  },
  {
    id: 'usr_express',
    email: 'admin@express.com',
    fullName: 'Esfiharia Express',
    role: 'tenant_admin',
    tenantSlug: 'esfiharia-express'
  }
];

export const MOCK_REVIEW_FEED = clone(baseReviews);

export const createMockDataset = () => ({
  users: clone(MOCK_USERS),
  tenants: clone(MOCK_TENANT_RECORDS)
});
