import { useTranslation } from 'react-i18next';

// Centralized UI classes and helpers
export const CTA_BUTTON_CLASS = "bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-105";
export const CTA_SMALL_BUTTON_CLASS = "bg-white hover:bg-gray-100 text-purple-600 my-5 px-4 py-2 text-lg font-semibold rounded-full shadow-2xl transition-all duration-300 hover:scale-105";
export const HEADER_CTA_CLASS = "bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 hover:scale-105";

// Shared hook for translations across app
export function useAppTranslation(namespace = 'translation') {
  const { t: ti, i18n } = useTranslation(namespace);
  const lang = i18n?.language || 'en';
  const t = new Proxy({}, { get: (_, prop) => ti(String(prop)) });
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('planlyze-language', lng); } catch (e) {}
  };
  return { t, ti, i18n, lang, changeLanguage };
}

export default {
  CTA_BUTTON_CLASS,
  CTA_SMALL_BUTTON_CLASS,
  HEADER_CTA_CLASS,
  useAppTranslation,
};
