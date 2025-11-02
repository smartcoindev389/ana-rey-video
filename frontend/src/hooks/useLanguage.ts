import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from './useLocale';
import { languageApi } from '@/services/languageApi';
import { loadAndSetTranslations } from '@/i18n/config';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { locale, changeLocale } = useLocale();
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await languageApi.getLanguages();
        if (response.success) {
          setLanguages(response.data);
        }
      } catch (error) {
        console.error('Error loading languages:', error);
        // Fallback languages
        setLanguages([
          { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
          { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
          { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, []);

  // Sync i18n with URL locale (only update when locale actually changes)
  useEffect(() => {
    if (locale && locale !== i18n.language) {
      // Only sync if locale is different, and prevent infinite loops
      const syncLocale = async () => {
        try {
          await loadAndSetTranslations(locale, false);
          localStorage.setItem('i18nextLng', locale);
        } catch (error) {
          console.error('Error syncing locale:', error);
        }
      };
      syncLocale();
    } else if (locale) {
      // Just update localStorage if locale matches
      localStorage.setItem('i18nextLng', locale);
    }
  }, [locale]); // Remove i18n from dependencies to prevent loops

  const changeLanguage = async (lang: string) => {
    if (locale !== lang) {
      try {
        // Update i18next
        await loadAndSetTranslations(lang);
        
        // Save to backend
        await languageApi.setLocale(lang);
        
        // Update URL with new locale (this will trigger navigation)
        changeLocale(lang as any);
        
        // Save to localStorage
        localStorage.setItem('i18nextLng', lang);
      } catch (error) {
        console.error('Error changing language:', error);
        // Still update URL even if backend call fails
        changeLocale(lang as any);
      }
    }
  };

  return {
    currentLanguage: locale,
    languages,
    changeLanguage,
    loading,
  };
};

