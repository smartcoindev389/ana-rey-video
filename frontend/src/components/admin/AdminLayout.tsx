import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  CreditCard, 
  Gift, 
  Globe, 
  MessageSquare, 
  ThumbsUp, 
  HelpCircle,
  Settings, 
  BarChart3,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import logoImage from '@/assets/logo-transparente.png';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { locale, getPathWithLocale, pathname } = useLocale();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate(`/${locale}`);
  };


  const handleLanguageChange = async (language: string) => {
    const newLocale = language.toLowerCase();
    await changeLanguage(newLocale);
    // Navigate to the same admin page with new locale
    const currentPath = location.pathname.replace(`/${locale}/admin`, '');
    navigate(`/${newLocale}/admin${currentPath}`);
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('admin.dashboard'), exact: true },
    { path: '/admin/users', icon: Users, label: t('admin.users_management') },
    { path: '/admin/content', icon: Video, label: t('admin.content_management') },
    { path: '/admin/plans', icon: CreditCard, label: t('admin.subscription_plans') },
    { path: '/admin/payments', icon: CreditCard, label: t('admin.payments_transactions') },
    { path: '/admin/coupons', icon: Gift, label: t('admin.coupons_discounts') },
    { path: '/admin/multilingual', icon: Globe, label: t('admin.multilingual_settings') },
    { path: '/admin/support', icon: MessageSquare, label: t('admin.support_tickets') },
    { path: '/admin/feedback', icon: ThumbsUp, label: t('admin.feedback_suggestions') },
    { path: '/admin/settings', icon: Settings, label: t('admin.settings') },
    { path: '/admin/analytics', icon: BarChart3, label: t('admin.analytics_reports') },
  ];

  const isActive = (path: string, exact = false) => {
    const pathWithLocale = getPathWithLocale(path);
    if (exact) {
      return location.pathname === pathWithLocale || location.pathname === path;
    }
    return location.pathname.startsWith(pathWithLocale) || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-3">
            <Link to={`/${locale}/admin`} className="hover:opacity-80 transition-opacity">
              <img 
                src={logoImage} 
                alt="SACRART Logo" 
                className="h-10 w-auto"
              />
            </Link>
            <h1 className="text-xl font-bold text-primary">{t('admin.panel')}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={getPathWithLocale(item.path)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative whitespace-nowrap overflow-hidden text-ellipsis ${
                  isActive(item.path, item.exact)
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.path, item.exact) ? 'text-primary-foreground' : ''}`} />
                {item.label}
                {isActive(item.path, item.exact) && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary-foreground rounded-full opacity-80"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('admin.logout')}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Admin Panel Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background border-b">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {menuItems.find(item => isActive(item.path, item.exact))?.label || t('admin.panel')}
          </h2>
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={currentLanguage.toUpperCase()} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="EN" className="focus:bg-accent">EN</SelectItem>
                <SelectItem value="ES" className="focus:bg-accent">ES</SelectItem>
                <SelectItem value="PT" className="focus:bg-accent">PT</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {t('admin.dashboard_welcome')} {user?.name || ''}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
