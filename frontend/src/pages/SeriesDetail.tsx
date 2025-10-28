import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Star, 
  Clock, 
  Users, 
  BookOpen,
  Download,
  Lock,
  CheckCircle,
  Crown,
  Zap,
  Calendar,
  Award,
  MessageSquare,
  Share2,
  Heart,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { categoryApi, videoApi } from '@/services/videoApi';
import { toast } from 'sonner';

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<any | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        // Fetch category details
        const categoryResponse = await categoryApi.get(parseInt(id || '1'));
        const categoryData = categoryResponse.success ? categoryResponse.data : null;
        setCategory(categoryData);
        
        // Fetch videos for this category
        const videosResponse = await videoApi.getAll({ category_id: parseInt(id || '1'), per_page: 100 });
        const videosData = Array.isArray(videosResponse.data) 
          ? videosResponse.data 
          : videosResponse.data?.data || [];
        setVideos(videosData);
        
      } catch (error: any) {
        console.error('Error loading category data:', error);
        toast.error('Failed to load category details');
        setCategory(null);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCategoryData();
    }
  }, [id]);

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[visibility as keyof typeof colors]}`}>
        {getVisibilityIcon(visibility)}
        <span className="ml-1 capitalize">{visibility}</span>
      </span>
    );
  };

  const canAccessVideo = (videoVisibility: string) => {
    // Admin can access all content
    if (user && (user.role === 'admin' || user.subscription_type === 'admin' || user.is_admin)) {
      return true;
    }
    if (!user) return videoVisibility === 'freemium';
    if (videoVisibility === 'freemium') return true;
    if (videoVisibility === 'basic') return ['basic', 'premium'].includes(user.subscription_type);
    if (videoVisibility === 'premium') return user.subscription_type === 'premium';
    return false;
  };

  const getUpgradeMessage = (videoVisibility: string) => {
    if (videoVisibility === 'basic') return 'Upgrade to Basic or Premium';
    if (videoVisibility === 'premium') return 'Upgrade to Premium';
    return '';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-muted rounded-lg mb-8"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <Button onClick={() => navigate('/explore')}>
          Browse All Categories
        </Button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl mb-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-primary/90 rounded-full flex items-center justify-center mx-auto">
              <Play className="h-8 w-8 text-primary-foreground ml-1" />
            </div>
            <Button size="lg" className="flex items-center">
              <Play className="h-4 w-4 mr-2" />
              Start Watching
            </Button>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          {category.visibility && getVisibilityBadge(category.visibility)}
        </div>
        <div className="absolute top-4 left-4 flex space-x-2">
          <Button variant="secondary" size="sm">
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          </Button>
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Series Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                <p className="text-muted-foreground text-lg">{category.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-semibold">{category.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">({category.rating_count || 0} reviews)</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Play className="h-4 w-4 mr-1" />
                {category.video_count || 0} Episodes
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatDuration(category.total_duration || 0)}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {category.total_views || 0} Viewers
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            {/* Progress */}
            {user && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Your Progress</span>
                  <span>0 of {category.video_count || 0} episodes watched</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            )}
          </div>

          {/* Episodes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Episodes</h2>
              <div className="text-sm text-muted-foreground">
                {videos.length} episodes • {formatDuration(category.total_duration || 0)}
              </div>
            </div>

            <div className="space-y-3">
              {videos.map((video, index) => {
                const hasAccess = canAccessVideo(video.visibility);
                const isCompleted = index < 3; // Mock completed videos

                return (
                  <div
                    key={video.id}
                    className={`flex items-center p-4 rounded-lg border transition-colors ${
                      hasAccess 
                        ? 'hover:bg-muted cursor-pointer' 
                        : 'bg-muted/50 cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => hasAccess && navigate(`/video/${video.id}`)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted mr-4">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : !hasAccess ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Play className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{video.title}</h3>
                        <div className="flex items-center space-x-2">
                          {video.visibility && getVisibilityBadge(video.visibility)}
                          <span className="text-sm text-muted-foreground">{formatDuration(video.duration || 0)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {video.description || 'Episode content'}
                      </p>
                    </div>

                    {!hasAccess && (
                      <div className="ml-4 text-right">
                        <Button variant="outline" size="sm">
                          {getUpgradeMessage(video.visibility)}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Series Actions */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{category.visibility === 'freemium' ? 'Free' : category.visibility === 'basic' ? 'Basic Plan' : 'Premium Plan'}</div>
                <div className="text-sm text-muted-foreground">
                  {category.visibility === 'freemium' ? 'Always free' : 'Monthly subscription'}
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  {user ? 'Continue Watching' : 'Start Watching'}
                </Button>
                {!user && (
                  <Button variant="outline" className="w-full">
                    Sign Up to Access
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-center">
                30-day money-back guarantee
              </div>
            </div>
          </Card>

          {/* Series Includes */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">This series includes:</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {category.video_count || 0} episodes
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {formatDuration(category.total_duration || 0)} of content
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Behind-the-scenes content
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                HD streaming quality
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Lifetime access
              </div>
            </div>
          </Card>

          {/* Artist */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Featured Artist</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium">Ana Rey</div>
                <div className="text-sm text-muted-foreground">Master Sculptor & Artist</div>
                <div className="flex items-center mt-1">
                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                  <span className="text-sm">4.9 artist rating</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;
