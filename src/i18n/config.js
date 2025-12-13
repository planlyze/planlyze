import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ar from '../locales/ar.json';
import landingEn from '../locales/landing.en.json';
import landingAr from '../locales/landing.ar.json';

const resources = {
  en: { translation: en, landing: landingEn },
  ar: { translation: ar, landing: landingAr }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Default to Arabic; LanguageDetector may override if a saved preference exists
    lng: 'ar',
    fallbackLng: 'ar',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
