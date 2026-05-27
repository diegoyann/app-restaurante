export function createDefaultGeneralSettings() {
  return {
    ifoodTax: 23,
    anotaaiTax: 5,
    businessName: 'Rei das Esfihas',
    alertDaysBefore: 3,
    colorPalette: 'esfiha'
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
