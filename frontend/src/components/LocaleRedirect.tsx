import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEFAULT_LOCALE, SupportedLocale } from '@/hooks/useLocale';

/**
 * Component to redirect root path to default locale
 */
const LocaleRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get stored locale preference first (user's choice)
    const storedLocale = localStorage.getItem('i18nextLng');
    
    // Only use browser locale if no stored preference
    const locale: SupportedLocale = 
      (storedLocale && ['en', 'es', 'pt'].includes(storedLocale) 
        ? storedLocale 
        : (() => {
            const browserLocale = navigator.language.split('-')[0].toLowerCase();
            return ['en', 'es', 'pt'].includes(browserLocale) ? browserLocale : DEFAULT_LOCALE;
          })()) as SupportedLocale;

    // Redirect to locale-prefixed path (only if we're at root)
    if (location.pathname === '/' || location.pathname === '') {
      navigate(`/${locale}${location.search}`, { replace: true });
    }
  }, [navigate, location.pathname, location.search]); // Only depend on pathname and search, not entire location object

  return null;
};

export default LocaleRedirect;

