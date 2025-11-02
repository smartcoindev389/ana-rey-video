import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Search,
  User,
  LogOut,
  Globe,
  Menu,
  X,
  Play,
  BookOpen,
  CreditCard,
  MessageSquare,
  HelpCircle,
  Settings,
  ChevronDown,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';
import logoImage from '@/assets/logo-transparente.png';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocale } from '@/hooks/useLocale';

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { getPathWithLocale, pathname } = useLocale();

  const handleLogout = async () => {
    await logout();
    navigate(getPathWithLocale('/'));
  };

  const handleLanguageChange = async (langCode: string) => {
    const locale = langCode.toLowerCase();
    await changeLanguage(locale);
  };

  const menuItems = [
    { path: '/', icon: Home, label: t('common.home'), exact: true },
    { path: '/explore', icon: Search, label: t('common.browse') },
    { path: '/library', icon: Play, label: t('common.continue_watching') },
    { path: '/subscription', icon: CreditCard, label: t('common.plans') },
    { path: '/support', icon: HelpCircle, label: t('common.support') },
  ];

  const isActive = (path: string, exact = false) => {
    const currentPath = pathname;
    if (exact) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header - Streaming Platform Style */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
        <div className="container mx-auto px-4 lg:px-8 h-16 lg:h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to={getPathWithLocale("/")} className="flex items-center space-x-2 hover:opacity-80 transition-all duration-300 hover:scale-105">
            <img 
              src={logoImage} 
              alt="SACRART Logo" 
              className="h-10 lg:h-11 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Streaming Style - Only show for authenticated users */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={getPathWithLocale(item.path)}
                    className={`flex items-center space-x-2 text-sm font-medium transition-all duration-300 relative group ${
                      isActive(item.path, item.exact)
                        ? 'text-white font-semibold'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110`} />
                    <span>{item.label}</span>
                    {isActive(item.path, item.exact) && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 min-w-[60px] justify-center text-white/90 hover:text-white hover:bg-white/10">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm w-6 text-center">{currentLanguage.toUpperCase()}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/95 border-white/20 text-white">
                {[
                  { code: 'EN', name: 'English', flag: '🇺🇸' },
                  { code: 'ES', name: 'Español', flag: '🇪🇸' },
                  { code: 'PT', name: 'Português', flag: '🇵🇹' },
                ].map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="flex items-center space-x-2 hover:bg-white/10 focus:bg-white/10"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {currentLanguage.toUpperCase() === lang.code && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to={getPathWithLocale("/profile")}>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-white/90 hover:text-white hover:bg-white/10">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/90 hover:text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10">
                    {t('common.sign_in')}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                    {t('auth.sign_up')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button - Only show for authenticated users */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link to={getPathWithLocale("/")} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img 
              src={logoImage} 
              alt="SACRART Logo" 
              className="h-12 w-auto"
            />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {user && (
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                  <Link
                    key={item.path}
                    to={getPathWithLocale(item.path)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActive(item.path, item.exact)
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                  <Icon className={`mr-3 h-5 w-5 ${isActive(item.path, item.exact) ? 'text-primary-foreground' : ''}`} />
                  {item.label}
                  {isActive(item.path, item.exact) && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary-foreground rounded-full opacity-80"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {user && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('common.logout')}
            </Button>
          </div>
        )}
      </div>

      {/* Main content with padding for fixed header */}
      <main className="pt-16 lg:pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            {/* Call to Action Section */}
            <div className="py-12 md:py-16">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-montserrat">
                    {t('footer.ready_to_start')}
                  </h2>
                  <p className="text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto font-montserrat">
                    {t('footer.join_description')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={getPathWithLocale("/explore")}>
                      <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-8">
                        {t('footer.browse_all_videos')}
                      </Button>
                    </Link>
                    <Link to="/subscription">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white font-semibold px-8">
                        {t('footer.view_pricing_plans')}
                      </Button>
                    </Link>
                  </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex justify-center space-x-6 mb-6 pt-8 border-t border-white/10">
              <a 
                href="https://instagram.com/elartedeanarey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com/elartedeanarey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://youtube.com/@elartedeanarey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a 
                href="https://tiktok.com/@elartedeanarey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/34639374077" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500 pb-8 font-montserrat">
                <Trans
                  i18nKey="footer.copyright"
                  values={{ name: 'SACRART' }}
                  components={[<span key="sacrart" className="text-white font-semibold" />]}
                />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;
