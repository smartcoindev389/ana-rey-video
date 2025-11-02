import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Clock, 
  BookOpen,
  Zap,
  Crown,
  Calendar,
  Users,
  TrendingUp,
  SlidersHorizontal,
  Play,
  Heart,
  Bookmark,
  Eye,
  Award,
  Target,
  Sparkles
} from 'lucide-react';
import { videoApi, Video } from '@/services/videoApi';
import { userProgressApi } from '@/services/userProgressApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { toast } from 'sonner';

const Explore = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { navigateWithLocale } = useLocale();

  useEffect(() => {
    // Fetch from backend API
    const fetchVideos = async () => {
      setLoading(true);
      try {
        // Fetch published videos from public endpoint (applies visibility filters)
        try {
          const response = await videoApi.getPublic({ 
            status: 'published',
            sort_by: 'created_at',
            sort_order: 'desc'
          });
          
          const videosData = response.data?.data || [];
          
          setVideos(videosData);
          setFilteredVideos(videosData);
        } catch (error) {
          console.error('Error fetching videos:', error);
          setVideos([]);
          setFilteredVideos([]);
        }

        // Load user favorites if authenticated
        if (user) {
          try {
            const favoritesResponse = await userProgressApi.getFavoritesList();
            if (favoritesResponse.success && favoritesResponse.data) {
              // Handle both array and paginated response
              const favoritesData = Array.isArray(favoritesResponse.data) 
                ? favoritesResponse.data 
                : favoritesResponse.data?.data || favoritesResponse.data || [];
              const favoriteVideoIds = new Set<number>(
                favoritesData.map((fav: any) => Number(fav.video_id))
              );
              setFavorites(favoriteVideoIds);
            }
          } catch (error) {
            console.error('Failed to load favorites:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        setVideos([]);
        setFilteredVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user]);

  useEffect(() => {
    let filtered = [...videos];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.short_description && item.short_description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      // Filter by category name if category object exists
      filtered = filtered.filter(item => {
        if (item.category) {
          return item.category.name === selectedCategory;
        }
        return true;
      });
    }

    // Visibility filter
    if (selectedVisibility !== 'all') {
      filtered = filtered.filter(item => item.visibility === selectedVisibility);
    }

    // Advanced filters - Skip difficulty, duration, and rating as they don't exist in Category
    // if (selectedDifficulty !== 'all') {
    //   filtered = filtered.filter(item => item.difficulty === selectedDifficulty);
    // }

    // if (selectedDuration !== 'all') {
    //   filtered = filtered.filter(item => {
    //     if (selectedDuration === 'short') return item.totalDuration.includes('min');
    //     if (selectedDuration === 'medium') return item.totalDuration.includes('h') && !item.totalDuration.includes('day');
    //     if (selectedDuration === 'long') return item.totalDuration.includes('day');
    //     return true;
    //   });
    // }

    // if (selectedRating !== 'all') {
    //   filtered = filtered.filter(item => {
    //     if (selectedRating === 'high') return item.rating >= 4.5;
    //     if (selectedRating === 'medium') return item.rating >= 3.5 && item.rating < 4.5;
    //     if (selectedRating === 'low') return item.rating < 3.5;
    //     return true;
    //   });
    // }

    // Sort
    switch (selectedSort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        filtered.sort((a, b) => {
          const ratingA = parseFloat(String(a.rating || '0'));
          const ratingB = parseFloat(String(b.rating || '0'));
          return ratingB - ratingA;
        });
        break;
      case 'duration':
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'popular':
      default:
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    setFilteredVideos(filtered);
  }, [videos, searchTerm, selectedCategory, selectedVisibility, selectedSort, selectedDifficulty, selectedDuration, selectedRating]);

  // Helper function to parse duration to minutes for sorting
  const parseDurationToMinutes = (duration: string): number => {
    if (duration.includes('day')) {
      const days = parseInt(duration.match(/(\d+)/)?.[1] || '0');
      return days * 24 * 60;
    } else if (duration.includes('h')) {
      const hours = parseInt(duration.match(/(\d+)/)?.[1] || '0');
      return hours * 60;
    } else {
      const minutes = parseInt(duration.match(/(\d+)/)?.[1] || '0');
      return minutes;
    }
  };

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

  const categories = ['all', 'sculpting', 'restoration', 'pottery', 'painting', 'carving'];
  const visibilities = ['all', 'freemium', 'basic', 'premium'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
  const durations = ['all', 'short', 'medium', 'long'];
  const ratings = ['all', 'high', 'medium', 'low'];
  const sortOptions = [
    { value: 'popular', label: t('explore.popular') },
    { value: 'newest', label: t('explore.newest') },
    { value: 'oldest', label: t('explore.oldest') },
    { value: 'title', label: t('explore.title_sort') },
    { value: 'rating', label: t('explore.rating') },
    { value: 'duration', label: t('explore.duration') }
  ];

  const GridCard = ({ item }: { item: Video }) => (
    <Card className="group cursor-pointer overflow-visible streaming-card border-0 bg-transparent transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:z-50" onClick={() => navigateWithLocale(`/video/${item.id}`)}>
      <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 relative rounded-md overflow-hidden">
        {/* Background with scale effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 transition-transform duration-500"></div>
        
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Play button - center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white/95 rounded-full flex items-center justify-center play-button-pulse shadow-2xl">
            <Play className="h-5 w-5 lg:h-6 lg:w-6 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
        
        {/* Badges - top corners */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {getVisibilityBadge(item.visibility)}
        </div>
        <div className="absolute top-2 left-2 z-10">
          {item.category && (
            <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0">
              {item.category.name}
            </Badge>
          )}
        </div>
        
        {/* Rating badge */}
        {item.rating && parseFloat(item.rating) > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs z-10">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{parseFloat(item.rating).toFixed(1)}</span>
          </div>
        )}
        
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 thumbnail-overlay"></div>
      </div>
      
      {/* Info section */}
      <div className="p-3 lg:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm lg:text-base line-clamp-2 flex-1">{item.title}</h3>
          <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className={`p-1 hover:bg-muted rounded-full transition-colors ${favorites.has(item.id) ? 'text-red-500' : ''}`}
              onClick={async (e) => { 
                e.stopPropagation();
                if (!user) {
                  toast.error(t('video.please_sign_in_favorites'));
                  return;
                }
                try {
                  const response = await userProgressApi.toggleFavorite(item.id);
                  if (response.success && response.data) {
                    const isFavoriteNow = response.data.is_favorite === true || response.data.is_favorite === 1;
                    const newFavorites = new Set(favorites);
                    if (isFavoriteNow) {
                      newFavorites.add(item.id);
                    } else {
                      newFavorites.delete(item.id);
                    }
                    setFavorites(newFavorites);
                    toast.success(isFavoriteNow ? t('video.added_to_favorites') : t('video.removed_from_favorites'));
                  }
                } catch (error: any) {
                  toast.error(error.message || t('video.failed_update_favorites'));
                }
              }}
            >
              <Heart className={`h-4 w-4 ${favorites.has(item.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.short_description || item.description || t('explore.no_description')}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{item.duration ? `${Math.floor(item.duration / 60)}m` : '0m'}</span>
          </div>
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            <span>{item.views || 0}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const ListCard = ({ item }: { item: Video }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateWithLocale(`/video/${item.id}`)}>
      <div className="flex">
        <div className="w-48 aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            {getVisibilityBadge(item.visibility)}
          </div>
          <p className="text-muted-foreground mb-4 line-clamp-2">{item.short_description || item.description || t('explore.no_description')}</p>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {item.duration ? `${Math.floor(item.duration / 60)}m` : '0m'}
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {item.views || 0} {t('explore.views')}
            </div>
            {item.rating && parseFloat(item.rating) > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1" />
                {parseFloat(item.rating).toFixed(1)} {t('explore.rating_label')}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('explore.title')}</h1>
        <p className="text-muted-foreground">{t('explore.subtitle')}</p>
      </div>

      {/* Quick Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {t('explore.all_videos')}
          </Button>
          <Button
            variant={selectedCategory === 'sculpting' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('sculpting')}
          >
            <Target className="h-4 w-4 mr-1" />
            {t('explore.sculpting')}
          </Button>
          <Button
            variant={selectedCategory === 'restoration' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('restoration')}
          >
            <Award className="h-4 w-4 mr-1" />
            {t('explore.restoration')}
          </Button>
          <Button
            variant={selectedVisibility === 'freemium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedVisibility('freemium')}
          >
            <Zap className="h-4 w-4 mr-1" />
            {t('explore.free_content')}
          </Button>
          <Button
            variant={selectedSort === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSort('popular')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            {t('explore.trending')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('explore.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('explore.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('explore.all_categories')}</SelectItem>
              {categories.slice(1).map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('explore.access_level')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('explore.all_access_levels')}</SelectItem>
              <SelectItem value="freemium">{t('library.free')}</SelectItem>
              <SelectItem value="basic">{t('library.basic')}</SelectItem>
              <SelectItem value="premium">{t('library.premium')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('explore.sort_by')} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t('explore.advanced')}
            </Button>
            <span className="text-sm text-muted-foreground">{t('explore.view')}</span>
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

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('explore.difficulty_level')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('explore.all_levels')}</SelectItem>
                <SelectItem value="beginner">{t('explore.beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('explore.intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('explore.advanced')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('explore.duration')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('explore.all_durations')}</SelectItem>
                <SelectItem value="short">{t('explore.short')}</SelectItem>
                <SelectItem value="medium">{t('explore.medium')}</SelectItem>
                <SelectItem value="long">{t('explore.long')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('explore.rating')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('explore.all_ratings')}</SelectItem>
                <SelectItem value="high">{t('explore.high')}</SelectItem>
                <SelectItem value="medium">{t('explore.medium_rating')}</SelectItem>
                <SelectItem value="low">{t('explore.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {t('explore.showing')} {filteredVideos.length} {t('explore.of')} {videos.length} {t('explore.videos')}
          </p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {selectedSort === 'popular' ? t('explore.sorted_by_popularity') : `${t('explore.sorted_by')} ${sortOptions.find(opt => opt.value === selectedSort)?.label.toLowerCase()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Videos Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
          {filteredVideos.map((item) => (
            <div key={item.id} className="hover:z-50">
              <GridCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((item) => (
            <ListCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('explore.no_videos')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('explore.try_different_filters')}
          </p>
          <Button onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setSelectedVisibility('all');
            setSelectedSort('popular');
          }}>
            {t('explore.clear_filters')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Explore;
