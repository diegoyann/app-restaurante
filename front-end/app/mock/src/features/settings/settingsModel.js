export function createDefaultGeneralSettings() {
  return {
    ifoodTax: 23,
    anotaaiTax: 5,
    businessName: 'Rei das Esfihas',
    alertDaysBefore: 3,
    colorPalette: 'esfiha'
  };
}

export function createDefaultAiBehaviorSettings() {
  return {
    positiveTone: 'friendly',
    crisisStrategy: 'whatsapp',
    additionalInstructions: '',
    autoPublishPositive: true
  };
}

export function normalizeGeneralSettings(settings) {
  const defaults = createDefaultGeneralSettings();

  return {
    ifoodTax: Number.isFinite(Number(settings?.ifoodTax)) ? Number(settings.ifoodTax) : defaults.ifoodTax,
    anotaaiTax: Number.isFinite(Number(settings?.anotaaiTax)) ? Number(settings.anotaaiTax) : defaults.anotaaiTax,
    businessName: String(settings?.businessName || defaults.businessName),
    alertDaysBefore: Number.isInteger(Number(settings?.alertDaysBefore)) ? Number(settings.alertDaysBefore) : defaults.alertDaysBefore,
    colorPalette: String(settings?.colorPalette || defaults.colorPalette)
  };
}

export function normalizeAiBehaviorSettings(settings) {
  const defaults = createDefaultAiBehaviorSettings();

  return {
    positiveTone: String(settings?.positiveTone || defaults.positiveTone),
    crisisStrategy: String(settings?.crisisStrategy || defaults.crisisStrategy),
    additionalInstructions: String(settings?.additionalInstructions || defaults.additionalInstructions),
    autoPublishPositive: typeof settings?.autoPublishPositive === 'boolean'
      ? settings.autoPublishPositive
      : defaults.autoPublishPositive
  };
}
