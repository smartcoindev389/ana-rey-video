import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { useLocale } from '@/hooks/useLocale';
import { useTranslation } from 'react-i18next';
import { categoryApi, videoApi } from '@/services/videoApi';
import { userProgressApi } from '@/services/userProgressApi';
import { toast } from 'sonner';

const SeriesDetail = () => {
  const { id, locale } = useParams<{ id: string; locale?: string }>();
  const [category, setCategory] = useState<any | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<number, any>>({});
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { navigateWithLocale } = useLocale();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        // Fetch videos for this category
        const videosResponse = await videoApi.getPublic({ category_id: parseInt(id || '1'), per_page: 100 });
        const videosData = Array.isArray(videosResponse.data) 
          ? videosResponse.data 
          : videosResponse.data?.data || [];
        setVideos(videosData);
        
        // Derive category details from first video's embedded category
        if (videosData.length > 0 && videosData[0].category) {
          setCategory(videosData[0].category);
        } else {
          // Fallback: fetch public categories and find by id so the page works even with 0 videos
          try {
            const catsRes = await categoryApi.getPublic();
            const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
            const found = cats.find((c: any) => c.id === parseInt(id || '0')) || null;
            setCategory(found);
          } catch (e) {
            setCategory(null);
          }
        }

        // If asked to show only videos with progress, load series progress
        const params = new URLSearchParams(location.search);
        const filter = params.get('filter');
        if (filter === 'progress') {
          try {
            const progRes = await userProgressApi.getSeriesProgress(parseInt(id || '1'));
            const videoProgress = progRes?.data?.video_progress || {};
            // Normalize to a map of video_id -> progress
            const map: Record<number, any> = {};
            Object.values(videoProgress).forEach((p: any) => {
              if (p && typeof p.video_id === 'number') {
                map[p.video_id] = p;
              }
            });
            setProgressMap(map);
          } catch (e) {
            // ignore progress fetch errors
          }
        }
        
      } catch (error: any) {
        console.error('Error loading category data:', error);
        toast.error(t('seriesDetail.failed_load_category'));
        setCategory(null);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCategoryData();
    }
  }, [id, location.search]);

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
    if (videoVisibility === 'basic') return t('seriesDetail.upgrade_basic_premium');
    if (videoVisibility === 'premium') return t('seriesDetail.upgrade_premium');
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
        <h1 className="text-2xl font-bold mb-4">{t('seriesDetail.category_not_found')}</h1>
        <Button onClick={() => navigateWithLocale('/explore')}>
          {t('seriesDetail.browse_all_categories')}
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

  // Apply progress-only filter if requested
  const params = new URLSearchParams(location.search);
  const filter = params.get('filter');
  const videosToShow = filter === 'progress'
    ? videos.filter((v: any) => {
        const p = progressMap[v.id];
        if (!p) return false;
        const pct = p.progress_percentage ?? 0;
        return pct > 0 && pct < 100;
      })
    : videos;

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
              {t('seriesDetail.start_watching')}
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
                    <span className="font-semibold">{(() => {
                      const r = category?.rating;
                      const num = typeof r === 'number' ? r : parseFloat(r || '0');
                      return isNaN(num) ? '0.0' : num.toFixed(1);
                    })()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">({category.rating_count || 0} {t('seriesDetail.reviews')})</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Play className="h-4 w-4 mr-1" />
                {category.video_count || 0} {t('seriesDetail.episodes')}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatDuration(category.total_duration || 0)}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {category.total_views || 0} {t('seriesDetail.viewers')}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {t('seriesDetail.created')} {category.created_at ? new Date(category.created_at).toLocaleDateString() : t('seriesDetail.na')}
              </div>
            </div>
          </div>

          {/* Episodes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{t('seriesDetail.episodes')}</h2>
              <div className="text-sm text-muted-foreground">
                {videos.length} {t('seriesDetail.episodes_lower')} • {formatDuration(category.total_duration || 0)}
              </div>
            </div>

            <div className="space-y-3">
              {videosToShow.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  {t('seriesDetail.no_episodes')}
                </div>
              ) : (
              videosToShow.map((video, index) => {
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
                    onClick={() => hasAccess && navigateWithLocale(`/video/${video.id}`)}
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
                        {video.description || t('seriesDetail.episode_content')}
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
              })
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Series Actions */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{category.visibility === 'freemium' ? t('seriesDetail.free') : category.visibility === 'basic' ? t('seriesDetail.basic_plan') : t('seriesDetail.premium_plan')}</div>
                <div className="text-sm text-muted-foreground">
                  {category.visibility === 'freemium' ? t('seriesDetail.always_free') : t('seriesDetail.monthly_subscription')}
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  {user ? t('seriesDetail.continue_watching') : t('seriesDetail.start_watching')}
                </Button>
                {!user && (
                  <Button variant="outline" className="w-full">
                    {t('seriesDetail.sign_up_access')}
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-center">
                {t('seriesDetail.money_back_guarantee')}
              </div>
            </div>
          </Card>

          {/* Series Includes */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t('seriesDetail.series_includes')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {category.video_count || 0} {t('seriesDetail.episodes_lower')}
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {formatDuration(category.total_duration || 0)} {t('seriesDetail.of_content')}
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {t('seriesDetail.behind_scenes')}
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {t('seriesDetail.hd_quality')}
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {t('seriesDetail.lifetime_access')}
              </div>
            </div>
          </Card>

          {/* Artist */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t('seriesDetail.featured_artist')}</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium">Ana Rey</div>
                <div className="text-sm text-muted-foreground">{t('seriesDetail.master_sculptor')}</div>
                <div className="flex items-center mt-1">
                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                  <span className="text-sm">4.9 {t('seriesDetail.artist_rating')}</span>
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
