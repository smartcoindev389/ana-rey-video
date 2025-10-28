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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userProgressApi, UserProgress } from '@/services/userProgressApi';
import { categoryApi } from '@/services/videoApi';
import { toast } from 'sonner';

const Library = () => {
  const [myCategories, setMyCategories] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<UserProgress[]>([]);
  const [watchHistory, setWatchHistory] = useState<UserProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories (user's enrolled categories)
        const categoriesResponse = await categoryApi.getAll();
        const categoriesData = Array.isArray(categoriesResponse.data) 
          ? categoriesResponse.data 
          : categoriesResponse.data?.data || [];
        setMyCategories(categoriesData);
        
        // Fetch continue watching
        const continueResponse = await userProgressApi.continueWatching(10);
        const continueData = continueResponse.success && continueResponse.data 
          ? continueResponse.data 
          : [];
        setContinueWatching(continueData);
        
        // Fetch watch history (completed videos)
        const historyResponse = await userProgressApi.getCompleted(20);
        const historyData = historyResponse.success && historyResponse.data 
          ? (Array.isArray(historyResponse.data) ? historyResponse.data : historyResponse.data?.data || [])
          : [];
        setWatchHistory(historyData);
        
      } catch (error: any) {
        console.error('Error loading library data:', error);
        toast.error('Failed to load library data');
        setMyCategories([]);
        setContinueWatching([]);
        setWatchHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLibraryData();
    }
  }, [user]);

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

  const filteredCategories = myCategories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || category.visibility === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const CategoryCard = ({ category }: { category: any }) => {
    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m`;
    };

    return (
      <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300" onClick={() => navigate(`/category/${category.id}`)}>
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {category.cover_image ? (
            <img src={category.cover_image} alt={category.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-primary-foreground ml-1" />
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2">
            {category.visibility && getVisibilityBadge(category.visibility)}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{category.name}</h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Play className="h-3 w-3 mr-1" />
              {category.video_count || 0} episodes
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(category.total_duration || 0)}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const ContinueWatchingCard = ({ item }: { item: UserProgress }) => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${diffDays} days ago`;
    };

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/video/${item.video_id}`)}>
        <div className="flex">
          <div className="w-32 aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
            {item.video?.intro_image ? (
              <img src={item.video.intro_image} alt={item.video?.title} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary/90 rounded-full flex items-center justify-center">
                  <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
              <Progress value={item.progress_percentage} className="h-1" />
            </div>
          </div>
          <div className="flex-1 p-4">
            <h3 className="font-medium text-sm mb-1">{item.video?.title || 'Untitled Video'}</h3>
            <p className="text-xs text-muted-foreground mb-2">{item.category?.name || item.video?.category?.name || 'Category'}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(item.time_watched)} / {formatTime(item.video?.duration || 0)}</span>
              <span>{getTimeAgo(item.last_watched_at)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

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

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        {filteredCategories.length === 0 && (
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
            {watchHistory.map((item: UserProgress) => (
              <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/video/${item.video_id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.video?.title || 'Untitled Video'}</h3>
                      <p className="text-sm text-muted-foreground">{item.category?.name || item.video?.category?.name || 'Category'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{Math.floor((item.video?.duration || 0) / 60)}m</div>
                    <div className="text-xs text-muted-foreground">
                      {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Recently'}
                    </div>
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
              <p className="text-2xl font-bold">{myCategories.length}</p>
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
