export const SOURCE_META = {
  google: {
    label: 'Google',
    actionLabel: 'Aprovar e publicar no Google',
    className: 'review-chip--google'
  },
  ifood: {
    label: 'iFood',
    actionLabel: 'Aprovar e publicar no iFood',
    className: 'review-chip--ifood'
  }
};

export const SENTIMENT_META = {
  negative: { label: 'Negativo', className: 'review-chip--negative' },
  neutral: { label: 'Neutro', className: 'review-chip--neutral' },
  positive: { label: 'Positivo', className: 'review-chip--positive' }
};

export const MOOD_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'negative', label: 'Irritado' },
  { id: 'neutral', label: 'Neutro' },
  { id: 'positive', label: 'Feliz' }
];

export const normalizeIncomingReview = (review) => ({
  id: review.id ?? review.sourceReviewId ?? `review-${Math.random().toString(36).slice(2, 9)}`,
  source: review.source ?? 'google',
  sourceReviewId: review.sourceReviewId ?? '',
  companyKey: review.companyKey ?? '',
  companyLabel: review.companyLabel ?? 'Empresa',
  unitLabel: review.unitLabel ?? 'Unidade principal',
  channelLabel: review.channelLabel ?? SOURCE_META[review.source]?.label ?? 'Canal',
  reviewerName: review.reviewerName ?? 'Cliente',
  reviewerInitials: review.reviewerInitials ?? (review.reviewerName || 'C').slice(0, 1).toUpperCase(),
  reviewerLocation: review.reviewerLocation ?? 'Sem localização',
  rating: Math.max(1, Math.min(5, Number(review.rating ?? 5))),
  sentiment: review.sentiment ?? 'neutral',
  status: review.status ?? 'pending',
  resolutionType: review.resolutionType ?? null,
  createdAtLabel: review.createdAtLabel ?? 'Agora',
  publishedReply: review.publishedReply ?? '',
  tags: Array.isArray(review.tags) ? review.tags : [],
  comment: review.comment ?? '',
  aiSuggestion: review.aiSuggestion ?? '',
  integrationStatus: review.integrationStatus ?? 'draft'
});

export const buildAiReply = (review) => {
  if (review.sentiment === 'negative') {
    return `Olá ${review.reviewerName.split(' ')[0]}. Sentimos muito pela experiência abaixo do esperado. Já vamos revisar o ponto sobre ${review.tags[0]?.toLowerCase() || 'o atendimento'} com a operação. Se puder, nos chame no WhatsApp para resolver isso de forma direta.`;
  }

  if (review.sentiment === 'positive') {
    return `Oi ${review.reviewerName.split(' ')[0]}. Obrigado pela avaliação e pelo reconhecimento. Feedback assim mostra que a equipe acertou na execução. Esperamos te atender de novo muito em breve.`;
  }

  return `Olá ${review.reviewerName.split(' ')[0]}. Obrigado pelo comentário. Entendemos o ponto sobre ${review.tags[0]?.toLowerCase() || 'a experiência'} e vamos usar isso para ajustar a operação. Sua avaliação ajuda a melhorar o serviço.`;
};

export const SEED_REVIEWS = [
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
