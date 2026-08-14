const isExplicitlyEnabled = (value) => String(value || '').trim().toLowerCase() === 'true';

// Recursos que dependem de integrações ainda não validadas ficam desligados até
// que a respectiva variável seja habilitada deliberadamente no ambiente.
export const featureFlags = Object.freeze({
  reviewManagement: isExplicitlyEnabled(import.meta.env.VITE_FEATURE_REVIEW_MANAGEMENT),
  aiBehaviorSettings: isExplicitlyEnabled(import.meta.env.VITE_FEATURE_AI_BEHAVIOR_SETTINGS),
  googleAuth: isExplicitlyEnabled(import.meta.env.VITE_FEATURE_GOOGLE_AUTH),
  orderOperations: isExplicitlyEnabled(import.meta.env.VITE_FEATURE_ORDER_OPERATIONS)
});

export const isAppTabEnabled = (tab) => {
  if (tab === 'orders') return featureFlags.orderOperations;
  if (tab === 'reviews') return featureFlags.reviewManagement;
  if (tab === 'ai-behavior') return featureFlags.aiBehaviorSettings;
  return true;
};
