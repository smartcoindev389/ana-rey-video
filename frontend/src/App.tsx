import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserLayout from "./components/UserLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subscription from "./pages/Subscription";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import SeriesDetail from "./pages/SeriesDetail";
import VideoPlayer from "./pages/VideoPlayer";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import AdminRoutes from "./pages/admin/AdminRoutes";
import NotFound from "./pages/NotFound";

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
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UserLayout />}>
                <Route index element={<Home />} />
                <Route path="explore" element={<Explore />} />
                <Route path="series/:id" element={<SeriesDetail />} />
                <Route path="video/:id" element={<VideoPlayer />} />
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
                <Route path="support" element={<Support />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/subscription" element={<Subscription />} />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminProtectedRoute>
                    <AdminRoutes />
                  </AdminProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
