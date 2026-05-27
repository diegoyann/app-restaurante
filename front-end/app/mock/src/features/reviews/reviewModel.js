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
