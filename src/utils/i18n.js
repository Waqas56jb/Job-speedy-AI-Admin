import enTranslations from '../locales/en.json';
import deTranslations from '../locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

export const t = (language, key) => {
  const keys = key.split('.');
  let value = translations[language] || translations.en;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English if translation not found
      value = translations.en;
      for (const fallbackKey of keys) {
        value = value?.[fallbackKey];
      }
      break;
    }
  }
  
  return value || key;
};

