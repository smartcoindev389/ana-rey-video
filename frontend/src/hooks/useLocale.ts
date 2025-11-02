import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const SUPPORTED_LOCALES = ['en', 'es', 'pt'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Hook to get and manage locale from URL
 */
export const useLocale = () => {
  const params = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get locale from params (URL should be the source of truth)
  // Priority: URL params > URL path > localStorage (but don't auto-navigate)
  const localeFromParams = params?.locale;
  const localeFromPath = location.pathname.split('/').filter(Boolean)[0];
  
  // Only use localStorage if we're not in a locale-prefixed route
  const localeFromStorage = !localeFromParams && !SUPPORTED_LOCALES.includes(localeFromPath as SupportedLocale)
    ? localStorage.getItem('i18nextLng')
    : null;
  
  let detectedLocale: string | undefined = 
    localeFromParams || 
    (localeFromPath && SUPPORTED_LOCALES.includes(localeFromPath as SupportedLocale) ? localeFromPath : undefined) ||
    (localeFromStorage && SUPPORTED_LOCALES.includes(localeFromStorage as SupportedLocale) ? localeFromStorage : undefined);

  // Validate and normalize locale
  const currentLocale: SupportedLocale = 
    detectedLocale && SUPPORTED_LOCALES.includes(detectedLocale as SupportedLocale)
      ? (detectedLocale as SupportedLocale)
      : DEFAULT_LOCALE;

  /**
   * Get pathname without locale prefix
   */
  const getPathWithoutLocale = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale)) {
      return '/' + segments.slice(1).join('/');
    }
    return path;
  };

  /**
   * Get pathname with locale prefix
   */
  const getPathWithLocale = (path: string, targetLocale?: SupportedLocale): string => {
    const target = targetLocale || currentLocale;
    const cleanPath = getPathWithoutLocale(path);
    
    // Don't add locale to paths that already have it or are special routes (except admin now uses locale)
    if (path.startsWith(`/${target}/`) || path.startsWith('/auth')) {
      return path;
    }

    // Handle root path
    if (cleanPath === '/' || cleanPath === '') {
      return `/${target}`;
    }

    return `/${target}${cleanPath}`;
  };

  /**
   * Navigate to a path with current locale
   */
  const navigateWithLocale = (path: string, options?: { replace?: boolean }) => {
    const pathWithLocale = getPathWithLocale(path);
    navigate(pathWithLocale, options);
  };

  /**
   * Change locale and keep current path
   */
  const changeLocale = (newLocale: SupportedLocale) => {
    const currentPath = getPathWithoutLocale(location.pathname);
    navigate(`/${newLocale}${currentPath}${location.search}`);
  };

  /**
   * Get current path without locale for internal routing
   */
  const pathname = getPathWithoutLocale(location.pathname);

  return {
    locale: currentLocale,
    pathname,
    getPathWithLocale,
    navigateWithLocale,
    changeLocale,
  };
};

/**
 * Hook to get locale from URL params (for use in routed components)
 */
export const useLocaleFromParams = (): SupportedLocale => {
  const { locale } = useParams<{ locale: string }>();
  return (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale))
    ? (locale as SupportedLocale)
    : DEFAULT_LOCALE;
};

