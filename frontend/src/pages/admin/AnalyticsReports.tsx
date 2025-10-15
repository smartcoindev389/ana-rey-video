import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Eye,
  DollarSign,
  Video,
  Clock,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

const AnalyticsReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Mock analytics data - replace with real API calls
  const analytics = {
    overview: {
      totalUsers: 1234,
      activeUsers: 892,
      totalRevenue: 18450,
      totalViews: 45678,
      averageSessionTime: '24:15',
      conversionRate: 12.5,
      churnRate: 3.2
    },
    userGrowth: [
      { month: 'Jan', users: 800, newUsers: 120, churnedUsers: 25 },
      { month: 'Feb', users: 920, newUsers: 150, churnedUsers: 30 },
      { month: 'Mar', users: 1050, newUsers: 180, churnedUsers: 50 },
      { month: 'Apr', users: 1180, newUsers: 200, churnedUsers: 70 },
      { month: 'May', users: 1234, newUsers: 220, churnedUsers: 66 }
    ],
    revenue: [
      { month: 'Jan', revenue: 12500, subscriptions: 45 },
      { month: 'Feb', revenue: 14200, subscriptions: 52 },
      { month: 'Mar', revenue: 16800, subscriptions: 65 },
      { month: 'Apr', revenue: 17500, subscriptions: 68 },
      { month: 'May', revenue: 18450, subscriptions: 72 }
    ],
    topVideos: [
      { title: 'Introduction to React', views: 1234, completionRate: 85, rating: 4.9 },
      { title: 'Advanced JavaScript Concepts', views: 987, completionRate: 78, rating: 4.8 },
      { title: 'CSS Grid Mastery', views: 876, completionRate: 82, rating: 4.7 },
      { title: 'Node.js Fundamentals', views: 765, completionRate: 75, rating: 4.6 },
      { title: 'Database Design Principles', views: 654, completionRate: 88, rating: 4.5 }
    ],
    subscriptionStats: {
      freemium: { count: 450, percentage: 36.5 },
      basic: { count: 520, percentage: 42.1 },
      premium: { count: 264, percentage: 21.4 }
    },
    deviceStats: {
      desktop: { count: 680, percentage: 55.0 },
      mobile: { count: 420, percentage: 34.0 },
      tablet: { count: 134, percentage: 11.0 }
    },
    geographicStats: [
      { country: 'United States', users: 456, percentage: 37.0 },
      { country: 'United Kingdom', users: 234, percentage: 19.0 },
      { country: 'Canada', users: 178, percentage: 14.4 },
      { country: 'Australia', users: 123, percentage: 10.0 },
      { country: 'Germany', users: 98, percentage: 7.9 },
      { country: 'Others', users: 145, percentage: 11.7 }
    ]
  };

  const getGrowthIndicator = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return {
      value: growth,
      isPositive: growth >= 0,
      icon: growth >= 0 ? TrendingUp : TrendingDown
    };
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics / Reports</h1>
          <p className="text-muted-foreground">Platform performance and user analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Metrics</option>
              <option value="users">Users</option>
              <option value="revenue">Revenue</option>
              <option value="content">Content</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalUsers)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{formatNumber(analytics.overview.activeUsers)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% from last month
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalViews)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +22% from last month
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Session Time</p>
              <p className="text-xl font-bold">{analytics.overview.averageSessionTime}</p>
            </div>
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-xl font-bold">{analytics.overview.conversionRate}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Churn Rate</p>
              <p className="text-xl font-bold">{analytics.overview.churnRate}%</p>
            </div>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">User Growth</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {analytics.userGrowth.map((data, index) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(data.users / 1300) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{formatNumber(data.users)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Monthly Revenue</h3>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {analytics.revenue.map((data) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(data.revenue / 20000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{formatCurrency(data.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Videos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top Performing Videos</h3>
          <Video className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          {analytics.topVideos.map((video, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium">{video.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {formatNumber(video.views)} views
                    </span>
                    <span>{video.completionRate}% completion</span>
                    <span>⭐ {video.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.subscriptionStats).map(([plan, stats]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{plan}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        plan === 'premium' ? 'bg-yellow-500' : 
                        plan === 'basic' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{stats.count}</span>
                  <span className="text-xs text-muted-foreground w-8">{stats.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Device Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.deviceStats).map(([device, stats]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{device}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        device === 'desktop' ? 'bg-blue-500' : 
                        device === 'mobile' ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{stats.count}</span>
                  <span className="text-xs text-muted-foreground w-8">{stats.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
        <div className="space-y-3">
          {analytics.geographicStats.map((data, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{data.country}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{data.users}</span>
                <span className="text-xs text-muted-foreground w-8">{data.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsReports;
