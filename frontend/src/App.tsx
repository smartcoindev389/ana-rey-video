import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserLayout from "./components/UserLayout";
import LocaleRedirect from "./components/LocaleRedirect";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subscription from "./pages/Subscription";
import SignupSubscription from "./pages/SignupSubscription";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import SeriesDetail from "./pages/SeriesDetail";
import VideoPlayer from "./pages/VideoPlayer";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import AdminRoutes from "./pages/admin/AdminRoutes";
import NotFound from "./pages/NotFound";
import { SupportTicketsProvider } from "./contexts/SupportTicketsContext";

const RedirectWithParams = () => {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const routeType = segments[0]; // 'series', 'category', or 'video'
    const id = segments[1];
    return <Navigate to={`/en/${routeType}/${id}${location.search}`} replace />;
  }
  return <Navigate to="/en" replace />;
};

const AdminRedirectToLocale = () => {
  const location = useLocation();
  const locale = localStorage.getItem('i18nextLng') || 'en';
  // Remove /admin from path and add locale prefix
  const adminPath = location.pathname.replace('/admin', '');
  return <Navigate to={`/${locale}/admin${adminPath}${location.search}`} replace />;
};


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SupportTicketsProvider>
          <BrowserRouter>
            <Routes>
              {/* Root redirect to default locale */}
              <Route path="/" element={<LocaleRedirect />} />

              {/* Auth Routes (no locale prefix) */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Signup Subscription Route (no locale prefix, unprotected) */}
              <Route path="/signup-subscription" element={<SignupSubscription />} />

              {/* Locale-prefixed routes */}
              <Route path="/:locale" element={<UserLayout />}>
                <Route index element={<Home />} />
                {/* Signup Subscription Route (with locale prefix, unprotected) */}
                <Route path="signup-subscription" element={<SignupSubscription />} />
                <Route path="explore" element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                } />
                <Route path="series/:id" element={
                  <ProtectedRoute>
                    <SeriesDetail />
                  </ProtectedRoute>
                } />
                <Route path="category/:id" element={
                  <ProtectedRoute>
                    <SeriesDetail />
                  </ProtectedRoute>
                } />
                <Route path="video/:id" element={
                  <ProtectedRoute>
                    <VideoPlayer />
                  </ProtectedRoute>
                } />
                <Route path="library" element={
                  <ProtectedRoute>
                    <Library />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="support" element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                } />
                <Route path="subscription" element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Admin Routes (with locale prefix, but outside UserLayout to avoid header) */}
              <Route path="/:locale/admin/*" element={
                <AdminProtectedRoute>
                  <AdminRoutes />
                </AdminProtectedRoute>
              } />

              {/* Redirect old admin routes without locale to default locale */}
              <Route path="/admin/*" element={<AdminRedirectToLocale />} />

              {/* Redirect old routes without locale to default locale */}
              <Route path="/explore" element={<Navigate to="/en/explore" replace />} />
              <Route path="/series/:id" element={<RedirectWithParams />} />
              <Route path="/category/:id" element={<RedirectWithParams />} />
              <Route path="/video/:id" element={<RedirectWithParams />} />
              <Route path="/library" element={<Navigate to="/en/library" replace />} />
              <Route path="/profile" element={<Navigate to="/en/profile" replace />} />
              <Route path="/support" element={<Navigate to="/en/support" replace />} />
              <Route path="/subscription" element={<Navigate to="/en/subscription" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </SupportTicketsProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
