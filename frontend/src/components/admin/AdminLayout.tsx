import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  CreditCard, 
  Gift, 
  Globe, 
  MessageSquare, 
  ThumbsUp, 
  Settings, 
  BarChart3,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/logo-transparente.png';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'Users Management' },
    { path: '/admin/content', icon: Video, label: 'Content Management' },
    { path: '/admin/plans', icon: CreditCard, label: 'Subscription Plans' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments & Transactions' },
    { path: '/admin/coupons', icon: Gift, label: 'Coupons & Discounts' },
    { path: '/admin/multilingual', icon: Globe, label: 'Multilingual Settings' },
    { path: '/admin/support', icon: MessageSquare, label: 'Support / Tickets' },
    { path: '/admin/feedback', icon: ThumbsUp, label: 'Feedback & Suggestions' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics / Reports' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
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
            <Link to="/admin" className="hover:opacity-80 transition-opacity">
              <img 
                src={logoImage} 
                alt="SACRART Logo" 
                className="h-10 w-auto"
              />
            </Link>
            <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
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

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
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
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Top bar */}
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
            {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Admin Panel'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
