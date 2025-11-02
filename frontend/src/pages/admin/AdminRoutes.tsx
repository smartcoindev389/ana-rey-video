import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from './AdminDashboard';
import UsersManagement from './UsersManagement';
import ContentManagement from './ContentManagement';
import SubscriptionPlans from './SubscriptionPlans';
import PaymentsTransactions from './PaymentsTransactions';
import CouponsDiscounts from './CouponsDiscounts';
import MultilingualSettings from './MultilingualSettings';
import SupportTickets from './SupportTickets';
import FeedbackSuggestions from './FeedbackSuggestions';
import FaqManagement from './FaqManagement';
import Settings from './Settings';
import AnalyticsReports from './AnalyticsReports';

const AdminRoutes = () => {
  const { locale } = useParams<{ locale: string }>();
  const location = useLocation();
  
  // Get the path segment after /locale/admin
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const adminPath = pathSegments.length > 2 && pathSegments[1] === 'admin' 
    ? pathSegments.slice(2).join('/') || ''
    : '';
  
  return (
    <AdminLayout>
      {!adminPath && <AdminDashboard />}
      {adminPath === 'users' && <UsersManagement />}
      {adminPath === 'content' && <ContentManagement />}
      {adminPath === 'plans' && <SubscriptionPlans />}
      {adminPath === 'payments' && <PaymentsTransactions />}
      {adminPath === 'coupons' && <CouponsDiscounts />}
      {adminPath === 'multilingual' && <MultilingualSettings />}
      {adminPath === 'support' && <SupportTickets />}
      {adminPath === 'feedback' && <FeedbackSuggestions />}
      {adminPath === 'faqs' && <FaqManagement />}
      {adminPath === 'settings' && <Settings />}
      {adminPath === 'analytics' && <AnalyticsReports />}
      {adminPath && !['users', 'content', 'plans', 'payments', 'coupons', 'multilingual', 'support', 'feedback', 'faqs', 'settings', 'analytics'].includes(adminPath) && (
        <Navigate to={`/${locale}/admin`} replace />
      )}
    </AdminLayout>
  );
};

export default AdminRoutes;
