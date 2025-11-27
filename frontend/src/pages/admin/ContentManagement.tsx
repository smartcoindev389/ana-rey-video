import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  MoreVertical, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Folder,
  Video as VideoIcon,
  Link,
  Crown,
  Star,
  Zap,
  Calendar,
  Clock,
  TrendingUp,
  PlayCircle,
  RefreshCw,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { seriesApi, videoApi, categoryApi, Series, Video, Category } from '@/services/videoApi';
import FileUpload from '@/components/admin/FileUpload';

// Using types from videoApi

const ContentManagement = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { locale: urlLocale } = useLocale();
  const [contentLocale, setContentLocale] = useState<'en' | 'es' | 'pt'>(urlLocale as 'en' | 'es' | 'pt' || 'en');
  
  const [activeTab, setActiveTab] = useState('series');
  const [searchTerm, setSearchTerm] = useState('');
  const [series, setSeries] = useState<Series[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media management state
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);

  useEffect(() => {
    fetchContent();
  }, [contentLocale]); // Refetch when content locale changes

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching content from admin APIs...');
      
      // Temporarily set locale in localStorage to fetch localized content
      const originalLocale = localStorage.getItem('i18nextLng');
      localStorage.setItem('i18nextLng', contentLocale);
      
      // Fetch data from API in parallel
      const [categoriesResponse, seriesResponse, videosResponse] = await Promise.allSettled([
        categoryApi.getAll({ with_counts: true }),
        seriesApi.getAll({ per_page: 100 }),
        videoApi.getAll({ per_page: 100 })
      ]);
      
      // Restore original locale
      if (originalLocale) {
        localStorage.setItem('i18nextLng', originalLocale);
      }
      
      console.log('API responses received:', {
        categories: categoriesResponse.status,
        series: seriesResponse.status,
        videos: videosResponse.status
      });

      let categoriesData: any[] = [];

      // Handle categories
      if (categoriesResponse.status === 'fulfilled') {
        const response = categoriesResponse.value;
        console.log('Categories API response:', response);
        categoriesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        console.log('Extracted categories data:', categoriesData);
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch categories:', categoriesResponse.reason);
        setCategories([]);
      }

      // Handle series (Note: series = category in backend)
      if (seriesResponse.status === 'fulfilled') {
        const response = seriesResponse.value;
        console.log('Series API response:', response);
        
        // Handle different response structures
        let seriesData = [];
        if (Array.isArray(response.data)) {
          seriesData = response.data;
        } else if (response.data?.data) {
          seriesData = Array.isArray(response.data.data) ? response.data.data : [];
        } else {
          console.error('Unexpected series response structure:', response);
          seriesData = [];
        }
        
        console.log('Extracted series data:', seriesData);
        console.log('First series item:', seriesData[0]);
        
        setSeries(seriesData);
        setFilteredSeries(seriesData);
        
        // Since series = category, also populate categories from series data if categories is empty
        if (categoriesResponse.status !== 'fulfilled' || categoriesData.length === 0) {
          console.log('Using series data as categories (series = category)');
          setCategories(seriesData);
        }
      } else {
        console.error('Failed to fetch series:', seriesResponse.reason);
        setSeries([]);
        setFilteredSeries([]);
      }

      // Handle videos
      if (videosResponse.status === 'fulfilled') {
        const response = videosResponse.value;
        const videosData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setVideos(videosData);
        setFilteredVideos(videosData);
      } else {
        console.error('Failed to fetch videos:', videosResponse.reason);
        setVideos([]);
        setFilteredVideos([]);
      }
      
      toast.success('Content loaded successfully');
      
    } catch (error: any) {
      console.error('Error loading content:', error);
      toast.error(`Failed to load content: ${error.message}`);
      
      // Set empty arrays as fallback
      setCategories([]);
      setSeries([]);
      setVideos([]);
      setFilteredSeries([]);
      setFilteredVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter series
    if (activeTab === 'series' && series) {
      const filtered = series.filter(serie => 
        serie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        serie?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSeries(filtered);
    }

    // Filter videos
    if (activeTab === 'videos' && videos) {
      const filtered = videos.filter(video => 
        video?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video?.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredVideos(filtered);
    }
  }, [series, videos, searchTerm, activeTab]);

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

  const getStatusBadge = (status?: string | null) => {
    if (!status) {
      return (
        <Badge variant="secondary">
          <EyeOff className="h-3 w-3 mr-1" />
          {t('admin.content_draft')}
        </Badge>
      );
    }

    const variants = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline'
    } as const;

    const statusLabels = {
      published: t('admin.content_published'),
      draft: t('admin.content_draft'),
      archived: t('admin.content_archived')
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'published' && <Eye className="h-3 w-3 mr-1" />}
        {status === 'draft' && <EyeOff className="h-3 w-3 mr-1" />}
        {statusLabels[status as keyof typeof statusLabels] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown')}
      </Badge>
    );
  };

  const handleEditSeries = (serie: Series) => {
    console.log('Editing series:', serie);
    // Ensure all fields are properly mapped since series = category
    // Map 'name' to 'title' if title is missing, and ensure all fields have values
    const mappedSeries: Series = {
      ...serie,
      title: serie.title || serie.name || '',
      name: serie.name || serie.title || '',
      description: serie.description || '',
      short_description: serie.short_description || '',
      visibility: serie.visibility || 'freemium',
      status: serie.status || 'draft',
      category_id: serie.category_id || serie.id || 1,
      instructor_id: serie.instructor_id || null,
      thumbnail: serie.thumbnail || null,
      cover_image: serie.cover_image || null,
      trailer_url: serie.trailer_url || null,
      meta_title: serie.meta_title || null,
      meta_description: serie.meta_description || null,
      meta_keywords: serie.meta_keywords || null,
      video_count: serie.video_count || 0,
      total_duration: serie.total_duration || 0,
      total_views: serie.total_views || 0,
      rating: serie.rating || '0',
      rating_count: serie.rating_count || 0,
      price: serie.price || '0',
      is_free: serie.is_free ?? true,
      published_at: serie.published_at || null,
      featured_until: serie.featured_until || null,
      is_featured: serie.is_featured ?? false,
      sort_order: serie.sort_order || 0,
      tags: serie.tags || null,
      image: (serie as any)?.image || null,
      created_at: serie.created_at || '',
      updated_at: serie.updated_at || '',
    };
    setSelectedSeries(mappedSeries);
    setIsSeriesDialogOpen(true);
  };

  const handleAddSeries = () => {
    setSelectedSeries({
      id: 0,
      name: '', // Category name (since series = category)
      title: '',
      slug: '',
      description: '',
      short_description: '',
      visibility: 'freemium',
      status: 'draft',
      category_id: 1,
      instructor_id: 1,
      thumbnail: null,
      cover_image: null,
      trailer_url: null,
      meta_title: null,
      meta_description: null,
      meta_keywords: null,
      video_count: 0,
      total_duration: 0,
      total_views: 0,
      rating: '0',
      rating_count: 0,
      price: '0',
      is_free: true,
      published_at: null,
      featured_until: null,
      is_featured: false,
      sort_order: 0,
      tags: null,
      created_at: '',
      updated_at: '',
    });
    setSelectedCategoryImageFile(null);
    setIsSeriesDialogOpen(true);
  };

  const handleSaveSeries = async () => {
    if (!selectedSeries) return;

    try {
      setIsSubmitting(true);
      console.log('Saving series:', selectedSeries);
      
      // Prepare series payload with Bunny.net URLs
      const seriesPayload: any = {
        title: selectedSeries.title || selectedSeries.name || '',
        description: selectedSeries.description || '',
        visibility: selectedSeries.visibility || 'freemium',
        status: selectedSeries.status || 'draft',
        category_id: selectedSeries.category_id || null,
        thumbnail: (selectedSeries as any)?.thumbnail || null,
        cover_image: (selectedSeries as any)?.cover_image || null,
        trailer_url: (selectedSeries as any)?.trailer_url || null,
      };
      
      let response;
      if (selectedSeries.id && selectedSeries.id > 0) {
        // Update series
        response = await seriesApi.update(selectedSeries.id, seriesPayload);
      } else {
        // Create series
        response = await seriesApi.create(seriesPayload);
      }
      
      if (response.success) {
        const savedSeries = response.data;
        if (selectedSeries.id) {
          setSeries(prev => prev.map(s => s.id === selectedSeries.id ? savedSeries : s));
          setFilteredSeries(prev => prev.map(s => s.id === selectedSeries.id ? savedSeries : s));
          toast.success(t('admin.content_series_updated'));
        } else {
          setSeries(prev => [savedSeries, ...prev]);
          setFilteredSeries(prev => [savedSeries, ...prev]);
          toast.success(t('admin.content_series_created'));
        }
        setIsSeriesDialogOpen(false);
        setSelectedSeries(null);
      } else {
        toast.error(response.message || "Failed to save series");
      }
    } catch (error: any) {
      console.error('Error saving series:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to save series: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsVideoDialogOpen(true);
  };

  const handleAddVideo = () => {
    setSelectedVideo({
      id: 0,
      title: '',
      slug: '',
      description: '',
      short_description: null,
      series_id: series.length > 0 ? series[0].id : null,
      instructor_id: null,
      video_url: null,
      video_file_path: null,
      thumbnail: null,
      intro_image: null,
      intro_description: null,
      duration: 0,
      file_size: null,
      video_format: null,
      video_quality: null,
      bunny_video_id: null,
      bunny_video_url: null,
      bunny_embed_url: '',
      bunny_thumbnail_url: null,
      streaming_urls: null,
      hls_url: null,
      dash_url: null,
      visibility: 'freemium',
      status: 'draft',
      is_free: true,
      price: null,
      episode_number: null,
      sort_order: 0,
      tags: null,
      views: 0,
      unique_views: 0,
      rating: '0',
      rating_count: 0,
      completion_rate: 0,
      published_at: null,
      scheduled_at: null,
      downloadable_resources: null,
      allow_download: false,
      meta_title: null,
      meta_description: null,
      meta_keywords: null,
      processing_status: 'pending',
      processing_error: null,
      processed_at: null,
      created_at: '',
      updated_at: '',
    });
    setIsVideoDialogOpen(true);
  };

  const handleSaveVideo = async () => {
    if (!selectedVideo) return;

    // Validate required fields
    if (!selectedVideo.title?.trim()) {
      toast.error(t('admin.content_title_required'));
      return;
    }
    
    if (!selectedVideo.series_id) {
      toast.error(t('admin.content_series_required'));
      return;
    }

    // For Bunny.net-only integration, require at least an embed URL
    if (!selectedVideo.bunny_embed_url?.trim()) {
      toast.error('Bunny.net embed URL is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Partial<Video> = {
        ...selectedVideo,
      };

      let response;
      if (selectedVideo.id) {
        response = await videoApi.update(selectedVideo.id, payload);
      } else {
        response = await videoApi.create(payload);
      }

      if (response.success) {
        const savedVideo = response.data;
        if (selectedVideo.id) {
          setVideos(prev => prev.map(v => v.id === selectedVideo.id ? savedVideo : v));
          setFilteredVideos(prev => prev.map(v => v.id === selectedVideo.id ? savedVideo : v));
          toast.success(t('admin.content_video_updated'));
        } else {
          setVideos(prev => [savedVideo, ...prev]);
          setFilteredVideos(prev => [savedVideo, ...prev]);
          toast.success(t('admin.content_video_created'));
        }
        setIsVideoDialogOpen(false);
        setSelectedVideo(null);
      } else {
        toast.error(response.message || "Failed to save video");
      }
    } catch (error: any) {
      console.error('Error saving video:', error);
      const errorMessage = error.message || 'Failed to save video';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeries = async (seriesId: number) => {
    if (!confirm(t('admin.content_series_delete_confirm'))) {
      return;
    }

    try {
      console.log('Deleting series with ID:', seriesId);
      const response = await seriesApi.delete(seriesId);
      console.log('Delete response:', response);
      
      if (response.success) {
        setSeries(prev => prev.filter(s => s.id !== seriesId));
        setFilteredSeries(prev => prev.filter(s => s.id !== seriesId));
        toast.success(t('admin.content_series_deleted'));
      } else {
        toast.error(response.message || "Failed to delete series");
      }
    } catch (error: any) {
      console.error('Error deleting series:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to delete series: ${errorMessage}`);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm(t('admin.content_video_delete_confirm'))) {
      return;
    }

    try {
      const response = await videoApi.delete(videoId);
      if (response.success) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        setFilteredVideos(prev => prev.filter(v => v.id !== videoId));
        toast.success(t('admin.content_video_deleted'));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete video");
    }
  };

  const handleToggleSeriesStatus = async (seriesId: number) => {
    const serie = series.find(s => s.id === seriesId);
    if (!serie) return;

    const newStatus = serie.status === 'published' ? 'draft' : 'published';
    
    try {
      // Use categoryApi since series are categories
      // Need to send name field as it's required by CategoryController
      const updateData: Partial<Category> = {
        name: serie.name || serie.title || '',
        status: newStatus,
      };
      
      const response = await categoryApi.update(seriesId, updateData);
      if (response.success) {
        // Map category response to series format
        const categoryData = response.data;
        const seriesData: Series = {
          ...categoryData,
          title: categoryData.title || categoryData.name || '',
          status: (categoryData as any).status || newStatus,
          visibility: (categoryData as any).visibility || serie.visibility || 'freemium',
          video_count: (categoryData as any).video_count || serie.video_count || 0,
          total_duration: (categoryData as any).total_duration || serie.total_duration || 0,
          total_views: (categoryData as any).total_views || serie.total_views || 0,
          category_id: categoryData.id,
          instructor_id: (categoryData as any).instructor_id || serie.instructor_id || null,
          thumbnail: (categoryData as any).thumbnail || serie.thumbnail || null,
          cover_image: (categoryData as any).cover_image || serie.cover_image || null,
          trailer_url: (categoryData as any).trailer_url || serie.trailer_url || null,
          meta_title: (categoryData as any).meta_title || serie.meta_title || null,
          meta_description: (categoryData as any).meta_description || serie.meta_description || null,
          meta_keywords: (categoryData as any).meta_keywords || serie.meta_keywords || null,
          rating: (categoryData as any).rating || serie.rating || '0',
          rating_count: (categoryData as any).rating_count || serie.rating_count || 0,
          price: (categoryData as any).price || serie.price || '0',
          is_free: (categoryData as any).is_free ?? serie.is_free ?? true,
          published_at: (categoryData as any).published_at || serie.published_at || null,
          featured_until: (categoryData as any).featured_until || serie.featured_until || null,
          is_featured: (categoryData as any).is_featured ?? serie.is_featured ?? false,
          tags: (categoryData as any).tags || serie.tags || null,
        } as Series;
        setSeries(prev => prev.map(s => s.id === seriesId ? seriesData : s));
        setFilteredSeries(prev => prev.map(s => s.id === seriesId ? seriesData : s));
        toast.success(`Series ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update series status");
    }
  };

  const handleToggleVideoStatus = async (videoId: number) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const newStatus = video.status === 'published' ? 'draft' : 'published';
    
    try {
      const response = await videoApi.update(videoId, { status: newStatus });
      if (response.success) {
        setVideos(prev => prev.map(v => v.id === videoId ? response.data : v));
        setFilteredVideos(prev => prev.map(v => v.id === videoId ? response.data : v));
        toast.success(`Video ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update video status");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.content_management')}</h1>
          <p className="text-muted-foreground">{t('admin.common_loading')}</p>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
                <div className="space-x-2 flex">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('admin.content_management')}</h1>
          <p className="text-muted-foreground">{t('admin.content_management')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={fetchContent} disabled={isLoading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('admin.common_refresh')}</span>
          </Button>
          <Button variant="outline" onClick={handleAddVideo} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.content_add_episode')}</span>
            <span className="sm:hidden">{t('admin.content_episode')}</span>
          </Button>
          <Button onClick={handleAddSeries} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.content_add_series')}</span>
            <span className="sm:hidden">{t('admin.content_series')}</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'series' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('series')}
          className="flex items-center"
          size="sm"
        >
          <Folder className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('admin.content_series')}</span>
        </Button>
        <Button
          variant={activeTab === 'videos' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('videos')}
          className="flex items-center"
          size="sm"
        >
          <VideoIcon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('admin.content_videos')}</span>
        </Button>
        
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('admin.content_search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Series Tab */}
      {activeTab === 'series' && (
        <>
          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">{t('admin.content_table_series')}</TableHead>
                    <TableHead className="w-[100px]">{t('admin.content_table_episodes')}</TableHead>
                    <TableHead className="w-[100px]">{t('admin.content_table_duration')}</TableHead>
                    <TableHead className="w-[120px]">{t('admin.content_table_visibility')}</TableHead>
                    <TableHead className="w-[120px]">{t('admin.content_table_status')}</TableHead>
                    <TableHead className="w-[120px]">{t('admin.content_table_created')}</TableHead>
                    <TableHead className="w-[70px]">{t('admin.content_table_actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeries && filteredSeries.length > 0 ? filteredSeries.map((serie) => (
                    <TableRow key={serie.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <Folder className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{serie.name || 'Category'}</div>
                            <div className="text-sm text-muted-foreground truncate">{serie.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">{serie.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{serie.video_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{Math.floor(serie.total_duration / 60)}m</span>
                      </TableCell>
                      <TableCell>
                        {getVisibilityBadge(serie.visibility)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(serie.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {formatDate(serie.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover border-border shadow-lg">
                            <DropdownMenuLabel className="font-semibold px-3 py-2">{t('admin.common_actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleEditSeries(serie)}
                              className="px-3 py-2 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Series
                            </DropdownMenuItem>
                            <DropdownMenuItem className="px-3 py-2 cursor-pointer">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Episode
                            </DropdownMenuItem>
                            <DropdownMenuItem className="px-3 py-2 cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Series
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleSeriesStatus(serie.id)}
                              className="px-3 py-2 cursor-pointer"
                            >
                              {serie.status === 'published' ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSeries(serie.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 px-3 py-2 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Series
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {series.length === 0 ? 'No series found. Create your first series!' : 'No series match your search criteria.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredSeries && filteredSeries.length > 0 ? filteredSeries.map((serie) => (
              <Card key={serie.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Folder className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg mb-1 line-clamp-1">{serie.name || 'Category'}</h3>
                      <p className="text-sm text-muted-foreground mb-1 line-clamp-1">{serie.title}</p>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{serie.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center text-sm bg-muted px-2 py-1 rounded">
                          <VideoIcon className="h-3 w-3 mr-1" />
                          {serie.video_count} episodes
                        </div>
                        <div className="flex items-center text-sm bg-muted px-2 py-1 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.floor(serie.total_duration / 60)}m
                        </div>
                        {getVisibilityBadge(serie.visibility)}
                        {getStatusBadge(serie.status)}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {formatDate(serie.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover border-border shadow-lg">
                      <DropdownMenuLabel className="font-semibold px-3 py-2">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleEditSeries(serie)}
                        className="px-3 py-2 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Series
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-3 py-2 cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Episode
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-3 py-2 cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Series
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleSeriesStatus(serie.id)}
                        className="px-3 py-2 cursor-pointer"
                      >
                        {serie.status === 'published' ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSeries(serie.id)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 px-3 py-2 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Series
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )) : (
              <Card className="p-8 text-center">
                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {series.length === 0 ? 'No series found. Create your first series!' : 'No series match your search criteria.'}
                </p>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <>
          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">{t('admin.content_table_episode')}</TableHead>
                    <TableHead className="w-[150px]">{t('admin.content_table_series')}</TableHead>
                    <TableHead className="w-[100px]">{t('admin.content_table_duration')}</TableHead>
                    <TableHead className="w-[100px]">{t('admin.content_table_views')}</TableHead>
                    <TableHead className="w-[120px]">{t('admin.content_table_visibility')}</TableHead>
                    <TableHead className="w-[120px]">{t('admin.content_table_status')}</TableHead>
                    <TableHead className="w-[120px]">{t('admin.content_table_uploaded')}</TableHead>
                    <TableHead className="w-[70px]">{t('admin.content_table_actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVideos && filteredVideos.length > 0 ? filteredVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <VideoIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{video.title}</div>
                            <div className="text-sm text-muted-foreground">{Math.floor((video.duration || 0) / 60)}m</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate block">
                          {series.find(s => s.id === video.series_id)?.name || series.find(s => s.id === video.series_id)?.title || `Series #${video.series_id}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{Math.floor((video.duration || 0) / 60)}m</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm font-medium">
                          <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
                          {(video.views || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVisibilityBadge(video.visibility)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(video.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {formatDate(video.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover border-border shadow-lg">
                            <DropdownMenuLabel className="font-semibold px-3 py-2">{t('admin.common_actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleEditVideo(video)}
                              className="px-3 py-2 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Episode
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(`/video/${video.id}`, '_blank')}
                              className="px-3 py-2 cursor-pointer"
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Play Episode
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleVideoStatus(video.id)}
                              className="px-3 py-2 cursor-pointer"
                            >
                              {video.status === 'published' ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 px-3 py-2 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Episode
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {videos.length === 0 ? 'No videos found. Create your first video!' : 'No videos match your search criteria.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredVideos && filteredVideos.length > 0 ? filteredVideos.map((video) => (
              <Card key={video.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <VideoIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg mb-1 line-clamp-1">{video.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Series: {series.find(s => s.id === video.series_id)?.name || series.find(s => s.id === video.series_id)?.title || `Series #${video.series_id}`}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center text-sm bg-muted px-2 py-1 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.floor((video.duration || 0) / 60)}m
                        </div>
                        <div className="flex items-center text-sm bg-muted px-2 py-1 rounded">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {(video.views || 0).toLocaleString()} views
                        </div>
                        {getVisibilityBadge(video.visibility)}
                        {getStatusBadge(video.status)}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Uploaded {formatDate(video.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover border-border shadow-lg">
                      <DropdownMenuLabel className="font-semibold px-3 py-2">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleEditVideo(video)}
                        className="px-3 py-2 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Episode
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`/video/${video.id}`, '_blank')}
                        className="px-3 py-2 cursor-pointer"
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Play Episode
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleVideoStatus(video.id)}
                        className="px-3 py-2 cursor-pointer"
                      >
                        {video.status === 'published' ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 px-3 py-2 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Episode
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )) : (
              <Card className="p-8 text-center">
                <VideoIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {videos.length === 0 ? 'No videos found. Create your first video!' : 'No videos match your search criteria.'}
                </p>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.content_total_series')}</p>
              <p className="text-2xl font-bold">{series?.length || 0}</p>
            </div>
            <Folder className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.content_total_episodes')}</p>
              <p className="text-2xl font-bold">{videos?.length || 0}</p>
            </div>
            <VideoIcon className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.content_total_views')}</p>
              <p className="text-2xl font-bold">{videos?.reduce((sum, video) => sum + (video?.views || 0), 0).toLocaleString() || '0'}</p>
            </div>
            <Eye className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.content_published_count')}</p>
              <p className="text-2xl font-bold">{videos?.filter(v => v?.status === 'published').length || 0}</p>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      

      {/* Edit Series Dialog */}
      <Dialog open={isSeriesDialogOpen} onOpenChange={(open) => {
        setIsSeriesDialogOpen(open);
        if (!open) {
          setSelectedSeries(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSeries?.id ? t('admin.content_edit_series') : t('admin.content_create_series')}</DialogTitle>
            <DialogDescription>
              {selectedSeries?.id ? t('admin.content_edit_series_desc') : t('admin.content_create_series_desc')} {t('admin.content_series_save_desc')}
            </DialogDescription>
          </DialogHeader>
          {selectedSeries && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  {t('admin.content_label_title')}
                </Label>
                <Input
                  id="title"
                  value={selectedSeries.title || selectedSeries.name || ''}
                  onChange={(e) => setSelectedSeries({...selectedSeries, title: e.target.value, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  {t('admin.content_label_description')}
                </Label>
                <Textarea
                  id="description"
                  value={selectedSeries.description || ''}
                  onChange={(e) => setSelectedSeries({...selectedSeries, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="visibility" className="text-right">
                  {t('admin.content_label_visibility')}
                </Label>
                <Select
                  value={selectedSeries.visibility || 'freemium'}
                  onValueChange={(value) => setSelectedSeries({...selectedSeries, visibility: value as 'freemium' | 'basic' | 'premium'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="freemium" className="focus:bg-accent">Freemium</SelectItem>
                    <SelectItem value="basic" className="focus:bg-accent">Basic</SelectItem>
                    <SelectItem value="premium" className="focus:bg-accent">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  {t('admin.content_label_status')}
                </Label>
                <Select
                  value={selectedSeries.status || 'draft'}
                  onValueChange={(value) => setSelectedSeries({...selectedSeries, status: value as 'draft' | 'published' | 'archived'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="draft" className="focus:bg-accent">Draft</SelectItem>
                    <SelectItem value="published" className="focus:bg-accent">Published</SelectItem>
                    <SelectItem value="archived" className="focus:bg-accent">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="thumbnail" className="text-right">
                  Thumbnail URL (Bunny.net)
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="thumbnail"
                    value={(selectedSeries as any)?.thumbnail || ''}
                    onChange={(e) => setSelectedSeries({...selectedSeries, thumbnail: e.target.value} as Series)}
                    placeholder="https://vz-xxx.b-cdn.net/thumbnail.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the Bunny.net thumbnail URL from your dashboard.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coverImage" className="text-right">
                  Cover Image URL (Bunny.net)
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="coverImage"
                    value={(selectedSeries as any)?.cover_image || ''}
                    onChange={(e) => setSelectedSeries({...selectedSeries, cover_image: e.target.value} as Series)}
                    placeholder="https://vz-xxx.b-cdn.net/cover.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the Bunny.net cover image URL from your dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeriesDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveSeries} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (selectedSeries?.id ? 'Save Changes' : 'Create Series')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.id ? 'Edit Episode' : 'Add New Episode'}</DialogTitle>
            <DialogDescription>
              {selectedVideo?.id ? 'Make changes to the episode here.' : 'Fill in the details to create a new episode.'} Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoTitle" className="text-right">
                  Title
                </Label>
                <Input
                  id="videoTitle"
                  value={selectedVideo.title}
                  onChange={(e) => setSelectedVideo({...selectedVideo, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoDescription" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="videoDescription"
                  value={selectedVideo.description}
                  onChange={(e) => setSelectedVideo({...selectedVideo, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="introImage" className="text-right">
                  Intro Image URL (Bunny.net)
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="introImage"
                    value={selectedVideo.intro_image || ''}
                    onChange={(e) => setSelectedVideo({...selectedVideo, intro_image: e.target.value})}
                    placeholder="https://vz-xxx.b-cdn.net/intro.jpg"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the Bunny.net intro image URL from your dashboard.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="thumbnail" className="text-right">
                  Thumbnail URL (Bunny.net)
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="thumbnail"
                    value={selectedVideo.thumbnail || selectedVideo.bunny_thumbnail_url || ''}
                    onChange={(e) => setSelectedVideo({
                      ...selectedVideo,
                      thumbnail: e.target.value,
                      bunny_thumbnail_url: e.target.value
                    })}
                    placeholder="https://vz-xxx.b-cdn.net/thumbnail.jpg"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the Bunny.net thumbnail URL from your dashboard.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="introDescription" className="text-right">
                  Intro Description
                </Label>
                <Textarea
                  id="introDescription"
                  value={selectedVideo.intro_description || ''}
                  onChange={(e) => setSelectedVideo({...selectedVideo, intro_description: e.target.value})}
                  className="col-span-3"
                  placeholder={t('admin.content_placeholder_intro')}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bunnyEmbedUrl" className="text-right">
                  Bunny Embed URL
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="bunnyEmbedUrl"
                    value={selectedVideo.bunny_embed_url || ''}
                    onChange={(e) => setSelectedVideo({
                      ...selectedVideo,
                      bunny_embed_url: e.target.value,
                    })}
                    placeholder="https://iframe.mediadelivery.net/embed/{library}/{video}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the Bunny.net embed URL from your Bunny dashboard.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bunnyVideoId" className="text-right">
                  Bunny Video ID (optional)
                </Label>
                <Input
                  id="bunnyVideoId"
                  value={selectedVideo.bunny_video_id || ''}
                  onChange={(e) => setSelectedVideo({
                    ...selectedVideo,
                    bunny_video_id: e.target.value,
                  })}
                  className="col-span-3"
                  placeholder="Video GUID from Bunny (optional)"
                />
              </div>
              {/* Duration input removed — duration is now auto-calculated on backend */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoVisibility" className="text-right">
                  Visibility
                </Label>
                <Select
                  value={selectedVideo.visibility}
                  onValueChange={(value) => setSelectedVideo({...selectedVideo, visibility: value as 'freemium' | 'basic' | 'premium'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="freemium" className="focus:bg-accent">Freemium</SelectItem>
                    <SelectItem value="basic" className="focus:bg-accent">Basic</SelectItem>
                    <SelectItem value="premium" className="focus:bg-accent">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoSeries" className="text-right">
                  Series
                </Label>
                <Select
                  value={selectedVideo.series_id?.toString() || ''}
                  onValueChange={(value) => setSelectedVideo({...selectedVideo, series_id: parseInt(value)})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('admin.content_label_select_series')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {series.map((serie) => (
                      <SelectItem key={serie.id} value={serie.id.toString()} className="focus:bg-accent">
                        <div className="flex flex-col">
                          <span className="font-medium">{serie.name || 'Category'}</span>
                          <span className="text-sm text-muted-foreground">{serie.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoStatus" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedVideo.status}
                  onValueChange={(value) => setSelectedVideo({...selectedVideo, status: value as 'draft' | 'published' | 'archived'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="draft" className="focus:bg-accent">Draft</SelectItem>
                    <SelectItem value="published" className="focus:bg-accent">Published</SelectItem>
                    <SelectItem value="archived" className="focus:bg-accent">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveVideo} disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? 'Saving...' : (selectedVideo?.id ? 'Save Changes' : 'Create Episode')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;