import { Routes, Route } from 'react-router-dom';
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
import Settings from './Settings';
import AnalyticsReports from './AnalyticsReports';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="content" element={<ContentManagement />} />
        <Route path="plans" element={<SubscriptionPlans />} />
        <Route path="payments" element={<PaymentsTransactions />} />
        <Route path="coupons" element={<CouponsDiscounts />} />
        <Route path="multilingual" element={<MultilingualSettings />} />
        <Route path="support" element={<SupportTickets />} />
        <Route path="feedback" element={<FeedbackSuggestions />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<AnalyticsReports />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
