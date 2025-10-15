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
import { generateAnalyticsData } from '@/services/mockData';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchAnalytics = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateAnalyticsData();
      setAnalyticsData(data);
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading analytics...</p>
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

  if (!analyticsData) return null;

  const { overview, subscriptionStats } = analyticsData;

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(overview.totalUsers),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'From last month'
    },
    {
      title: 'Active Subscriptions',
      value: formatNumber(overview.activeUsers),
      change: '+8%',
      changeType: 'positive' as const,
      icon: UserCheck,
      description: 'Currently active'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(overview.totalRevenue),
      change: '+23%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'This month'
    },
    {
      title: 'Video Views',
      value: formatNumber(overview.totalViews),
      change: '+15%',
      changeType: 'positive' as const,
      icon: Eye,
      description: 'This month'
    },
    {
      title: 'Avg. Session Time',
      value: overview.averageSessionTime,
      change: '+2.5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'User engagement'
    },
    {
      title: 'Conversion Rate',
      value: `${overview.conversionRate}%`,
      change: '+1.2%',
      changeType: 'positive' as const,
      icon: Star,
      description: 'User satisfaction'
    }
  ];

  const recentActivities = [
    { type: 'user_registered', message: 'New user John Doe registered with Premium plan', time: '2 minutes ago' },
    { type: 'payment_received', message: 'Payment received from Jane Smith ($19.99)', time: '15 minutes ago' },
    { type: 'video_uploaded', message: 'New video "Advanced React Patterns" uploaded', time: '1 hour ago' },
    { type: 'support_ticket', message: 'New support ticket from Mike Johnson', time: '2 hours ago' },
    { type: 'subscription_cancelled', message: 'Subscription cancelled by Sarah Wilson', time: '3 hours ago' },
  ];

  const topVideos = [
    { title: 'Introduction to React', views: 1234, rating: 4.9 },
    { title: 'Advanced JavaScript Concepts', views: 987, rating: 4.8 },
    { title: 'CSS Grid Mastery', views: 876, rating: 4.7 },
    { title: 'Node.js Fundamentals', views: 765, rating: 4.6 },
    { title: 'Database Design Principles', views: 654, rating: 4.5 },
  ];

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform performance</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm">Freemium</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{subscriptionStats.freemium.count}</div>
                <div className="text-xs text-muted-foreground">{subscriptionStats.freemium.percentage}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Basic</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{subscriptionStats.basic.count}</div>
                <div className="text-xs text-muted-foreground">{subscriptionStats.basic.percentage}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm">Premium</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{subscriptionStats.premium.count}</div>
                <div className="text-xs text-muted-foreground">{subscriptionStats.premium.percentage}%</div>
              </div>
            </div>
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
                <span className="text-sm">Conversion Rate</span>
              </div>
              <Badge variant="secondary">{overview.conversionRate}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">Churn Rate</span>
              </div>
              <Badge variant="secondary">{overview.churnRate}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">Avg. Session</span>
              </div>
              <Badge variant="secondary">{overview.averageSessionTime}</Badge>
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
              <span className="text-sm font-medium">{formatCurrency(overview.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="text-sm font-medium">{formatNumber(overview.activeUsers)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Video Views</span>
              <span className="text-sm font-medium">{formatNumber(overview.totalViews)}</span>
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
            <Button variant="outline" size="sm">View All</Button>
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
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {topVideos.map((video, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{video.title}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {video.views} views
                    </span>
                    <span className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {video.rating}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col">
            <Users className="h-6 w-6 mb-2" />
            <span className="text-sm">Add User</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <Video className="h-6 w-6 mb-2" />
            <span className="text-sm">Upload Video</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <CreditCard className="h-6 w-6 mb-2" />
            <span className="text-sm">Create Plan</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <Gift className="h-6 w-6 mb-2" />
            <span className="text-sm">Add Coupon</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
