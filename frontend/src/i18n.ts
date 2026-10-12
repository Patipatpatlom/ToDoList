import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslation from './locales/en.json'
import thTranslation from './locales/th.json'

const savedLanguage = localStorage.getItem('app_language') || 'th'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
    },
    th: {
      translation: thTranslation,
    },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
})

// Listen for language changes and persist to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('app_language', lng)
  } catch (e) {
    console.error('Failed to save language to localStorage', e)
  }
})

export default i18n
