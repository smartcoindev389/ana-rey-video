import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import ptTranslations from './locales/pt.json';
import { languageApi } from '../services/languageApi';

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
  pt: {
    translation: ptTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'], // Only use localStorage, don't auto-detect from navigator
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // Disable automatic detection
      checkWhitelist: true,
    },
    // Disable automatic language change
    load: 'languageOnly',
  });

// Track if we're currently loading translations to prevent loops
let isLoadingTranslations = false;

// Load backend translations from database
const loadBackendTranslations = async (language: string) => {
  try {
    const response = await languageApi.getTranslations(language);
    console.log(`Raw API response for ${language}:`, response);
    
    // The API returns { success: true, locale: 'en', data: {...} }
    // languageApi.getTranslations already extracts result.data, so response should be the nested object
    // Example: { common: { home: "Home" }, auth: { welcome_back: "Welcome Back" }, ... }
    if (response && typeof response === 'object') {
      // Check if it's already the nested structure we need
      if (response.success === undefined && response.locale === undefined) {
        // It's already the data object
        console.log(`Using direct response object for ${language}, keys:`, Object.keys(response));
        return response;
      }
      // Extract data if wrapped
      const data = response.data || response.translations || response;
      console.log(`Extracted data for ${language}, keys:`, Object.keys(data));
      return data || {};
    }
    
    console.warn(`Unexpected response format for ${language}:`, typeof response);
    return {};
  } catch (error) {
    console.error(`Failed to load backend translations for ${language}:`, error);
    return {};
  }
};

// Function to load and add translations dynamically from database
export const loadAndSetTranslations = async (locale: string, skipI18nChange = false) => {
  if (isLoadingTranslations) {
    return; // Prevent multiple simultaneous loads
  }
  
  isLoadingTranslations = true;
  try {
    const backendTranslations = await loadBackendTranslations(locale);
    const keysCount = backendTranslations ? Object.keys(backendTranslations).length : 0;
    console.log(`Backend translations loaded for ${locale}:`, keysCount, 'top-level keys');
    
    if (backendTranslations && keysCount > 0) {
      // Merge backend translations with existing resources (overwrite file-based with database)
      // The third parameter (true) means deep merge, fourth parameter (true) means overwrite existing
      i18n.addResourceBundle(locale, 'translation', backendTranslations, true, true);
      console.log(`Added resource bundle for ${locale} with`, keysCount, 'top-level keys');
      
      // Verify by checking if translations are accessible
      const testKey = Object.keys(backendTranslations)[0];
      if (testKey) {
        const nested = backendTranslations[testKey];
        if (nested && typeof nested === 'object') {
          const nestedKey = Object.keys(nested)[0];
          if (nestedKey) {
            const fullKey = `${testKey}.${nestedKey}`;
            const value = i18n.t(fullKey, { lng: locale });
            console.log(`Test translation ${fullKey} =`, value);
          }
        }
      }
    } else {
      console.warn(`No backend translations found for ${locale}, using file-based translations only`);
    }
    
    // Only change i18n language if explicitly requested (not during automatic syncing)
    if (!skipI18nChange && i18n.language !== locale) {
      await i18n.changeLanguage(locale);
      console.log(`Changed i18n language to ${locale}`);
    }
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    // Don't fail completely, just use file-based translations
  } finally {
    isLoadingTranslations = false;
  }
};

// Initial load for the detected language (only on startup)
const initialLocale = localStorage.getItem('i18nextLng') || 'en';
loadAndSetTranslations(initialLocale, false);

export default i18n;

