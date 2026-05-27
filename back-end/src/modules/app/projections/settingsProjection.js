import { maybeSingle, supabaseAdmin } from '../../shared/db.js';

export async function readSettingsProjection(tenant) {
  const [settings, aiSettings] = await Promise.all([
    maybeSingle(await supabaseAdmin.from('tenant_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar settings.'),
    maybeSingle(await supabaseAdmin.from('tenant_ai_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar IA.')
  ]);

  return {
    settings: settings
      ? {
          ifoodTax: Number(settings.ifood_tax || 0),
          anotaaiTax: Number(settings.anotaai_tax || 0),
          businessName: settings.business_name || tenant.business_name,
          alertDaysBefore: settings.alert_days_before || 0
        }
      : null,
    aiBehaviorSettings: aiSettings
      ? {
          positiveTone: aiSettings.positive_tone,
          crisisStrategy: aiSettings.crisis_strategy,
          additionalInstructions: aiSettings.additional_instructions,
          autoPublishPositive: aiSettings.auto_publish_positive
        }
      : null
  };
}
