import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Eye,
  DollarSign,
  UserCheck,
  Video,
  Star,
  Gift,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/services/analyticsApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { getPathWithLocale } = useLocale();
  const [overview, setOverview] = useState<any>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null);
  const [topVideos, setTopVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { locale } = useLocale();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all analytics data in parallel
        const [overviewRes, subscriptionRes, topVideosRes] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getSubscriptionStats(),
          analyticsApi.getTopVideos({ limit: 10 }),
        ]);
        
        console.log('Overview Response:', overviewRes);
        console.log('Subscription Response:', subscriptionRes);
        console.log('Top Videos Response:', topVideosRes);
        
        setOverview(overviewRes.success ? overviewRes.data : null);
        setSubscriptionStats(subscriptionRes.success ? subscriptionRes.data : null);
        setTopVideos(topVideosRes.success ? (topVideosRes.data || []) : []);
        
      } catch (error: any) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [locale]); // Refetch when locale changes

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">{t('admin.loading_analytics')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!overview || !subscriptionStats) return null;

  const stats = [
    {
      title: t('admin.total_users'),
      value: formatNumber(overview.total_users || 0),
      change: overview.user_growth_percentage ? `${overview.user_growth_percentage > 0 ? '+' : ''}${overview.user_growth_percentage}%` : 'N/A',
      changeType: (overview.user_growth_percentage || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: Users,
      description: t('admin.from_last_month')
    },
    {
      title: t('admin.active_subscriptions'),
      value: formatNumber(overview.active_subscriptions || 0),
      change: 'N/A',
      changeType: 'positive' as const,
      icon: UserCheck,
      description: t('admin.currently_active')
    },
    {
      title: t('admin.total_revenue'),
      value: formatCurrency(overview.total_revenue || 0),
      change: overview.revenue_growth_percentage ? `${overview.revenue_growth_percentage > 0 ? '+' : ''}${overview.revenue_growth_percentage}%` : 'N/A',
      changeType: (overview.revenue_growth_percentage || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: DollarSign,
      description: t('admin.this_month')
    },
    {
      title: t('admin.video_views'),
      value: formatNumber(overview.total_views || 0),
      change: 'N/A',
      changeType: 'positive' as const,
      icon: Eye,
      description: t('admin.all_time')
    },
    {
      title: t('admin.total_videos'),
      value: formatNumber(overview.total_videos || 0),
      change: 'N/A',
      changeType: 'positive' as const,
      icon: Video,
      description: t('admin.content_library')
    },
    {
      title: t('admin.total_categories'),
      value: formatNumber(overview.total_categories || 0),
      change: 'N/A',
      changeType: 'positive' as const,
      icon: Star,
      description: t('admin.content_categories')
    }
  ];

  const recentActivities = [
    { type: 'user_registered', message: 'New user John Doe registered with Premium plan', time: '2 minutes ago' },
    { type: 'payment_received', message: 'Payment received from Jane Smith ($19.99)', time: '15 minutes ago' },
    { type: 'video_uploaded', message: 'New video "Advanced React Patterns" uploaded', time: '1 hour ago' },
    { type: 'support_ticket', message: 'New support ticket from Mike Johnson', time: '2 hours ago' },
    { type: 'subscription_cancelled', message: 'Subscription cancelled by Sarah Wilson', time: '3 hours ago' },
  ];

  // topVideos is already loaded from API

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">{t('admin.overview_performance')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">Export Report</Button>
          <Button>Generate Analytics</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  <Icon className="h-8 w-8 text-primary mb-2" />
                  <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Subscription Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Subscription Distribution</h3>
          </div>
          <div className="space-y-4">
            {subscriptionStats?.subscription_breakdown && (() => {
              const { freemium = 0, basic = 0, premium = 0 } = subscriptionStats.subscription_breakdown;
              const total = freemium + basic + premium;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">Freemium</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{freemium}</div>
                      <div className="text-xs text-muted-foreground">
                        {total > 0 ? ((freemium / total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Basic</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{basic}</div>
                      <div className="text-xs text-muted-foreground">
                        {total > 0 ? ((basic / total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-sm">Premium</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{premium}</div>
                      <div className="text-xs text-muted-foreground">
                        {total > 0 ? ((premium / total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">Total Subscriptions</span>
              </div>
              <Badge variant="secondary">{subscriptionStats?.total_subscriptions || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">Active Subs</span>
              </div>
              <Badge variant="secondary">{subscriptionStats?.active_subscriptions || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">MRR</span>
              </div>
              <Badge variant="secondary">{formatCurrency(subscriptionStats?.monthly_recurring_revenue || 0)}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-sm font-medium">{formatCurrency(overview?.total_revenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Revenue/User</span>
              <span className="text-sm font-medium">{formatCurrency(subscriptionStats?.average_revenue_per_user || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Video Views</span>
              <span className="text-sm font-medium">{formatNumber(overview?.total_views || 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="outline" size="sm">{t('admin.dashboard_view_all')}</Button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Videos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Performing Videos</h3>
            <Button variant="outline" size="sm">{t('admin.dashboard_view_all')}</Button>
          </div>
          <div className="space-y-4">
            {topVideos.length > 0 ? (
              topVideos.map((video, index) => (
                <div key={video.id || index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{video.title}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {formatNumber(video.views || 0)} views
                      </span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {(() => { const r = typeof video.rating === 'number' ? video.rating : parseFloat(video.rating || '0'); return isNaN(r) ? '0.0' : r.toFixed(1); })()}
                      </span>
                      <span className="text-xs">
                        {video.completion_rate || 0}% completion
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No videos found</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('admin.dashboard_quick_actions')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col" onClick={() => navigate(getPathWithLocale('/admin/users'))}>
            <Users className="h-6 w-6 mb-2" />
            <span className="text-sm">{t('admin.dashboard_add_user')}</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col" onClick={() => navigate(getPathWithLocale('/admin/content'))}>
            <Video className="h-6 w-6 mb-2" />
            <span className="text-sm">{t('admin.dashboard_upload_video')}</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col" onClick={() => navigate(getPathWithLocale('/admin/plans'))}>
            <CreditCard className="h-6 w-6 mb-2" />
            <span className="text-sm">{t('admin.dashboard_create_plan')}</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col" onClick={() => navigate(getPathWithLocale('/admin/coupons'))}>
            <Gift className="h-6 w-6 mb-2" />
            <span className="text-sm">{t('admin.dashboard_add_coupon')}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
