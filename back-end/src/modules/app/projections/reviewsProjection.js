import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import { mapReview } from '../../shared/mappers.js';

export async function readReviewsProjection(tenant) {
  const reviews = ensureOk(
    await supabaseAdmin.from('reviews').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
    'Falha ao carregar avaliações.'
  );

  return {
    reviews: reviews.map(mapReview)
  };
}
