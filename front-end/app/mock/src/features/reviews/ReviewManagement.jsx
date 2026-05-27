import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock3,
  Edit3,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  Wand2,
  X
} from 'lucide-react';
import './ReviewManagement.css';
import {
  buildAiReply,
  MOOD_FILTERS,
  normalizeIncomingReview,
  SENTIMENT_META,
  SOURCE_META
} from './reviewModel.js';

const renderStars = (rating) => (
  <div className="review-card__rating" aria-label={`${rating} de 5 estrelas`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <span
        key={`star-${rating}-${index}`}
        className={`review-card__star ${index < rating ? 'review-card__star--filled' : ''}`}
      >
        ★
      </span>
    ))}
  </div>
);

export function ReviewManagementPage({ initialReviews = [] }) {
  const [queue, setQueue] = useState('pending');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedInitialReviews = useMemo(
    () => initialReviews.map(normalizeIncomingReview),
    [initialReviews]
  );
  const [reviews, setReviews] = useState(normalizedInitialReviews);
  const [draftReplies, setDraftReplies] = useState(() =>
    Object.fromEntries(normalizedInitialReviews.map((review) => [review.id, review.aiSuggestion]))
  );

  const summary = useMemo(() => {
    const pending = reviews.filter((review) => review.status === 'pending').length;
    const resolved = reviews.filter((review) => review.status === 'resolved').length;
    const critical = reviews.filter((review) => review.status === 'pending' && review.sentiment === 'negative').length;
    const avgRating = reviews.length
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    return { pending, resolved, critical, avgRating };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reviews.filter((review) => {
      if (queue === 'pending' && review.status !== 'pending') return false;
      if (queue === 'resolved' && review.status !== 'resolved') return false;
      if (sentimentFilter !== 'all' && review.sentiment !== sentimentFilter) return false;
      if (sourceFilter !== 'all' && review.source !== sourceFilter) return false;
      if (!normalizedSearch) return true;

      return [
        review.reviewerName,
        review.comment,
        review.companyLabel,
        review.unitLabel,
        review.tags.join(' ')
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [queue, reviews, searchTerm, sentimentFilter, sourceFilter]);

  const handleDraftChange = (reviewId, value) => {
    setDraftReplies((prev) => ({ ...prev, [reviewId]: value }));
  };

  const handleRegenerate = (reviewId) => {
    const target = reviews.find((review) => review.id === reviewId);
    if (!target) return;

    setDraftReplies((prev) => ({
      ...prev,
      [reviewId]: buildAiReply(target)
    }));
  };

  const handlePublish = (reviewId) => {
    setReviews((prev) => prev.map((review) => (
      review.id === reviewId
        ? {
            ...review,
            status: 'resolved',
            resolutionType: 'published',
            publishedReply: draftReplies[reviewId] || review.aiSuggestion
          }
        : review
    )));
    setQueue('pending');
  };

  const handleIgnore = (reviewId) => {
    setReviews((prev) => prev.map((review) => (
      review.id === reviewId
        ? {
            ...review,
            status: 'resolved',
            resolutionType: 'ignored',
            publishedReply: ''
          }
        : review
    )));
  };

  return (
    <div className="review-hub">
      <section className="review-hub__hero">
        <div className="review-hub__hero-grid">
          <div>
            <p className="review-hub__eyebrow">Gestão de avaliações</p>
            <h2 className="review-hub__title">Triagem e resposta com IA, sem perder o controle</h2>
            <p className="review-hub__lead">
              Tela pronta para receber avaliações do Google Business Profile e iFood, classificar sentimento,
              sugerir resposta e deixar alguém aprovar, editar ou ignorar antes de publicar.
            </p>
          </div>

          <div className="review-hub__connector-panel">
            <div className="review-hub__connector-row">
              <div className="review-hub__connector-meta">
                <span className="review-hub__connector-title">Google Business Profile</span>
                <span className="review-hub__connector-copy">Preparado para ingestão por API, com publicação da resposta no mesmo fluxo.</span>
              </div>
              <span className="review-hub__connector-chip review-hub__connector-chip--live">
                <Store size={12} /> pronto para integrar
              </span>
            </div>

            <div className="review-hub__connector-row">
              <div className="review-hub__connector-meta">
                <span className="review-hub__connector-title">iFood</span>
                <span className="review-hub__connector-copy">Mesmo modelo de fila, resposta assistida e histórico resolvido por canal.</span>
              </div>
              <span className="review-hub__connector-chip review-hub__connector-chip--draft">
                <Wand2 size={12} /> mock operacional
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="review-hub__stats">
        <article className="review-hub__stat">
          <p className="review-hub__stat-label">Pendentes</p>
          <p className="review-hub__stat-value">{summary.pending}</p>
        </article>
        <article className="review-hub__stat">
          <p className="review-hub__stat-label">Críticas</p>
          <p className="review-hub__stat-value">{summary.critical}</p>
        </article>
        <article className="review-hub__stat">
          <p className="review-hub__stat-label">Nota média</p>
          <p className="review-hub__stat-value">{summary.avgRating}</p>
        </article>
        <article className="review-hub__stat">
          <p className="review-hub__stat-label">Resolvidas</p>
          <p className="review-hub__stat-value">{summary.resolved}</p>
        </article>
      </section>

      <section className="review-hub__panel">
        <header className="review-hub__panel-head">
          <div>
            <p className="review-hub__eyebrow">Fila operacional</p>
            <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">Gestão de Avaliações</h3>
          </div>

          <div className="review-hub__queue-tabs">
            <button
              type="button"
              onClick={() => setQueue('pending')}
              className={`review-hub__queue-tab ${queue === 'pending' ? 'review-hub__queue-tab--active' : ''}`}
            >
              Pendentes ({summary.pending})
            </button>
            <button
              type="button"
              onClick={() => setQueue('resolved')}
              className={`review-hub__queue-tab ${queue === 'resolved' ? 'review-hub__queue-tab--active' : ''}`}
            >
              Histórico Resolvido
            </button>
          </div>
        </header>

        <div className="review-hub__filters">
          <div className="review-hub__search">
            <Search size={16} className="review-hub__search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="review-hub__search-input"
              placeholder="Buscar nome, comentário, unidade ou tag"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="review-hub__select"
          >
            <option value="all">Todos os canais</option>
            <option value="google">Google</option>
            <option value="ifood">iFood</option>
          </select>

          <div className="review-hub__connector-chip review-hub__connector-chip--draft">
            <Filter size={12} /> filtros ativos
          </div>
        </div>

        <div className="review-hub__moods">
          {MOOD_FILTERS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => setSentimentFilter(mood.id)}
              className={`review-hub__mood ${sentimentFilter === mood.id ? 'review-hub__mood--active' : ''}`}
            >
              {mood.label}
            </button>
          ))}
        </div>

        <div className="review-hub__list">
          {filteredReviews.length === 0 && (
            <div className="review-empty">
              Nenhuma avaliação bate com esse filtro. Isso aqui precisa filtrar de verdade, não fingir que organiza.
            </div>
          )}

          {filteredReviews.map((review) => {
            const sourceMeta = SOURCE_META[review.source];
            const sentimentMeta = SENTIMENT_META[review.sentiment];
            const draftReply = draftReplies[review.id] ?? review.aiSuggestion;

            return (
              <article key={review.id} className="review-card">
                <div className="review-card__header">
                  <div className="review-card__identity">
                    <div className="review-card__avatar">{review.reviewerInitials}</div>

                    <div className="review-card__meta">
                      <h4 className="review-card__name">{review.reviewerName}</h4>
                      <p className="review-card__store">{review.companyLabel} · {review.unitLabel}</p>
                      <div className="review-card__details">
                        <span className={`review-chip ${sourceMeta.className}`}>
                          <Store size={12} /> {sourceMeta.label}
                        </span>
                        <span className={`review-chip ${sentimentMeta.className}`}>{sentimentMeta.label}</span>
                        <span className="review-chip review-chip--draft">
                          <Clock3 size={12} /> {review.createdAtLabel}
                        </span>
                        {queue === 'resolved' && (
                          <span className="review-chip review-chip--resolved">
                            {review.resolutionType === 'published' ? 'respondida' : 'ignorada'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {renderStars(review.rating)}
                    <span className="review-chip review-chip--draft">
                      <MapPin size={12} /> {review.reviewerLocation}
                    </span>
                  </div>
                </div>

                <div className="review-card__content">
                  <p className="review-card__quote">“{review.comment}”</p>

                  <div className="review-card__tags">
                    {review.tags.map((tag) => (
                      <span key={`${review.id}-${tag}`} className="review-card__tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="review-card__ai">
                  <div className="review-card__ai-icon">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <div className="review-card__ai-head">
                      <div className="review-card__ai-title">
                        Sugestão da IA
                        <span className="review-chip review-chip--draft">Rascunho</span>
                      </div>
                    </div>

                    {queue === 'pending' ? (
                      <>
                        <textarea
                          value={draftReply}
                          onChange={(event) => handleDraftChange(review.id, event.target.value)}
                          className="review-hub__textarea"
                        />

                        <div className="review-card__actions">
                          <div className="review-card__actions-left">
                            <button type="button" className="review-btn review-btn--ghost" onClick={() => handleIgnore(review.id)}>
                              <X size={14} /> Ignorar
                            </button>
                            <button type="button" className="review-btn review-btn--soft" onClick={() => handleRegenerate(review.id)}>
                              <RefreshCw size={14} /> Refazer texto
                            </button>
                            <button type="button" className="review-btn review-btn--soft">
                              <Edit3 size={14} /> Editar manualmente
                            </button>
                          </div>

                          <div className="review-card__actions-right">
                            <button type="button" className="review-btn review-btn--primary" onClick={() => handlePublish(review.id)}>
                              <Check size={14} /> {sourceMeta.actionLabel}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <textarea
                          value={review.publishedReply || 'Avaliação encerrada sem resposta publicada.'}
                          readOnly
                          className="review-hub__textarea"
                        />

                        <div className="review-card__actions">
                          <div className="review-card__actions-left">
                            <span className="review-chip review-chip--resolved">
                              {review.resolutionType === 'published' ? 'Resposta registrada' : 'Sem resposta publicada'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ReviewManagementPage;
