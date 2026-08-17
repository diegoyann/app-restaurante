import { maybeSingle, supabaseAdmin } from '../../shared/db.js';

export const DEFAULT_AI_BEHAVIOR_SETTINGS = {
  positiveTone: 'friendly',
  crisisStrategy: 'whatsapp',
  additionalInstructions: '',
  autoPublishPositive: true
};

export function mapAiBehaviorSettings(row) {
  if (!row) return { ...DEFAULT_AI_BEHAVIOR_SETTINGS };

  return {
    positiveTone: row.positive_tone || DEFAULT_AI_BEHAVIOR_SETTINGS.positiveTone,
    crisisStrategy: row.crisis_strategy || DEFAULT_AI_BEHAVIOR_SETTINGS.crisisStrategy,
    additionalInstructions: row.additional_instructions || DEFAULT_AI_BEHAVIOR_SETTINGS.additionalInstructions,
    autoPublishPositive: typeof row.auto_publish_positive === 'boolean'
      ? row.auto_publish_positive
      : DEFAULT_AI_BEHAVIOR_SETTINGS.autoPublishPositive
  };
}

export async function readSettingsProjection(tenant) {
  const [settingsResult, aiSettingsResult] = await Promise.all([
    supabaseAdmin.from('tenant_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(),
    supabaseAdmin.from('tenant_ai_settings').select('*').eq('tenant_id', tenant.id).maybeSingle()
  ]);
  const settings = maybeSingle(settingsResult, 'Falha ao carregar settings.');
  const aiSettings = maybeSingle(aiSettingsResult, 'Falha ao carregar IA.');

  return {
    settings: settings
      ? {
          ifoodTax: Number(settings.ifood_tax || 0),
          anotaaiTax: Number(settings.anotaai_tax || 0),
          businessName: settings.business_name || tenant.business_name,
          alertDaysBefore: settings.alert_days_before || 0
        }
      : null,
    aiBehaviorSettings: mapAiBehaviorSettings(aiSettings)
  };
}
