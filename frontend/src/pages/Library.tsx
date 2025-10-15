import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  TrendingUp,
  CheckCircle,
  Crown,
  Zap,
  Eye,
  Download
} from 'lucide-react';
import { generateMockSeries, generateMockVideos, MockSeries, MockVideo } from '@/services/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const [mySeries, setMySeries] = useState<MockSeries[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call
    const fetchLibraryData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSeries = generateMockSeries();
      const mockVideos = generateMockVideos();
      
      // Mock user's enrolled series (based on subscription)
      const enrolledSeries = mockSeries.slice(0, 6);
      setMySeries(enrolledSeries);
      
      // Mock continue watching data
      const continueData = [
        {
          id: 1,
          title: 'Clay Preparation Techniques',
          series: 'Sculpting Mastery',
          thumbnail: '/api/placeholder/300/200',
          progress: 65,
          duration: '15:30',
          watchedTime: '10:12',
          lastWatched: '2 hours ago'
        },
        {
          id: 2,
          title: 'Advanced Carving Methods',
          series: 'Stone Carving Fundamentals',
          thumbnail: '/api/placeholder/300/200',
          progress: 30,
          duration: '22:45',
          watchedTime: '6:45',
          lastWatched: '1 day ago'
        },
        {
          id: 3,
          title: 'Restoration Best Practices',
          series: 'Art Restoration Process',
          thumbnail: '/api/placeholder/300/200',
          progress: 80,
          duration: '18:20',
          watchedTime: '14:36',
          lastWatched: '3 days ago'
        }
      ];
      setContinueWatching(continueData);
      
      // Mock watch history
      const historyData = [
        {
          id: 4,
          title: 'Bronze Casting Techniques',
          series: 'Metal Sculpting Series',
          duration: '25:10',
          completedAt: '1 week ago',
          completed: true
        },
        {
          id: 5,
          title: 'Ancient Sculpture Analysis',
          series: 'Art History & Techniques',
          duration: '32:45',
          completedAt: '2 weeks ago',
          completed: true
        }
      ];
      setWatchHistory(historyData);
      
      setLoading(false);
    };

    fetchLibraryData();
  }, []);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'premium':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'basic':
        return <Star className="h-4 w-4 text-blue-500" />;
      case 'freemium':
        return <Zap className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const colors = {
      premium: 'bg-yellow-100 text-yellow-800',
      basic: 'bg-blue-100 text-blue-800',
      freemium: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[visibility as keyof typeof colors]}`}>
        {getVisibilityIcon(visibility)}
        <span className="ml-1 capitalize">{visibility}</span>
      </span>
    );
  };

  const filteredSeries = mySeries.filter(series => {
    const matchesSearch = series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         series.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || series.visibility === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const SeriesCard = ({ series }: { series: MockSeries }) => (
    <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300" onClick={() => navigate(`/series/${series.id}`)}>
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-primary-foreground ml-1" />
          </div>
        </div>
        <div className="absolute top-2 right-2">
          {getVisibilityBadge(series.visibility)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{series.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{series.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Play className="h-3 w-3 mr-1" />
            {series.videoCount} episodes
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {series.totalDuration}
          </div>
        </div>
      </div>
    </Card>
  );

  const ContinueWatchingCard = ({ item }: { item: any }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/video/${item.id}`)}>
      <div className="flex">
        <div className="w-32 aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/90 rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
            <Progress value={item.progress} className="h-1" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <h3 className="font-medium text-sm mb-1">{item.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{item.series}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.watchedTime} / {item.duration}</span>
            <span>{item.lastWatched}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-48 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign in to continue watching</h1>
        <p className="text-muted-foreground mb-6">Access your series, continue watching, and track your progress.</p>
        <Button onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Continue Watching</h1>
        <p className="text-muted-foreground">Pick up where you left off</p>
      </div>

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Continue Watching</h2>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueWatching.map((item) => (
              <ContinueWatchingCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* My Series Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">My Series</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Button>
            <Button
              variant={selectedFilter === 'freemium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('freemium')}
            >
              <Zap className="h-3 w-3 mr-1" />
              Free
            </Button>
            <Button
              variant={selectedFilter === 'basic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('basic')}
            >
              <Star className="h-3 w-3 mr-1" />
              Basic
            </Button>
            <Button
              variant={selectedFilter === 'premium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('premium')}
            >
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Button>
          </div>
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredSeries.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>

        {filteredSeries.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No series found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Start exploring series to build your collection'}
            </p>
            <Button onClick={() => navigate('/explore')}>
              Browse Series
            </Button>
          </div>
        )}
      </section>

      {/* Watch History Section */}
      {watchHistory.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Watch History</h2>
            </div>
            <Button variant="ghost" size="sm">
              Clear History
            </Button>
          </div>
          <div className="space-y-3">
            {watchHistory.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.series}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{item.duration}</div>
                    <div className="text-xs text-muted-foreground">{item.completedAt}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Series</p>
              <p className="text-2xl font-bold">{mySeries.length}</p>
            </div>
            <Play className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{continueWatching.length}</p>
            </div>
            <Play className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{watchHistory.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">24.5</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Library;
