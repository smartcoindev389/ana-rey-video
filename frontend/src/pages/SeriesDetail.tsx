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
import { generateMockSeries, generateMockVideos, MockSeries, MockVideo } from '@/services/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<MockSeries | null>(null);
  const [videos, setVideos] = useState<MockVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call
    const fetchSeriesData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSeries = generateMockSeries();
      const mockVideos = generateMockVideos();
      
      const foundSeries = mockSeries.find(s => s.id === parseInt(id || '1'));
      const seriesVideos = mockVideos.filter(v => v.series.toLowerCase().includes(foundSeries?.title.toLowerCase() || ''));
      
      setSeries(foundSeries || mockSeries[0]);
      setVideos(seriesVideos.slice(0, 8)); // Limit to 8 videos for demo
      setLoading(false);
    };

    fetchSeriesData();
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

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Series not found</h1>
        <Button onClick={() => navigate('/explore')}>
          Browse All Series
        </Button>
      </div>
    );
  }

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
          {getVisibilityBadge(series.visibility)}
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
                <h1 className="text-3xl font-bold mb-2">{series.title}</h1>
                <p className="text-muted-foreground text-lg">{series.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-semibold">4.8</span>
                  </div>
                  <div className="text-sm text-muted-foreground">(1,234 reviews)</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Play className="h-4 w-4 mr-1" />
                {series.videoCount} Episodes
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {series.totalDuration}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                1,234 Viewers
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {new Date(series.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Progress */}
            {user && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Your Progress</span>
                  <span>3 of {series.videoCount} episodes watched</span>
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
                {videos.length} episodes • {series.totalDuration}
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
                          {getVisibilityBadge(video.visibility)}
                          <span className="text-sm text-muted-foreground">{video.duration}</span>
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
                <div className="text-2xl font-bold mb-1">{series.visibility === 'freemium' ? 'Free' : series.visibility === 'basic' ? 'Basic Plan' : 'Premium Plan'}</div>
                <div className="text-sm text-muted-foreground">
                  {series.visibility === 'freemium' ? 'Always free' : 'Monthly subscription'}
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
                {series.videoCount} episodes
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {series.totalDuration} of content
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
