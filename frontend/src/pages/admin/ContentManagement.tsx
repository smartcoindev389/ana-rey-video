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
  Image as ImageIcon,
  Upload,
  FileImage,
  FileVideo
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { seriesApi, videoApi, categoryApi, Series, Video, Category } from '@/services/videoApi';

// Using types from videoApi

const ContentManagement = () => {
  const { user, isAuthenticated } = useAuth();
  
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching content from admin APIs...');
      
      // Fetch data from API in parallel
      const [categoriesResponse, seriesResponse, videosResponse] = await Promise.allSettled([
        categoryApi.getAll({ with_counts: true }),
        seriesApi.getAll({ per_page: 100 }),
        videoApi.getAll({ per_page: 100 })
      ]);
      
      console.log('API responses received:', {
        categories: categoriesResponse.status,
        series: seriesResponse.status,
        videos: videosResponse.status
      });

      // Handle categories
      if (categoriesResponse.status === 'fulfilled') {
        const response = categoriesResponse.value;
        const categoriesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch categories:', categoriesResponse.reason);
        setCategories([]);
      }

      // Handle series
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
        
        console.log('Processed series data:', seriesData);
        setSeries(seriesData);
        setFilteredSeries(seriesData);
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

  const getStatusBadge = (status: string) => {
    const variants = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status === 'published' && <Eye className="h-3 w-3 mr-1" />}
        {status === 'draft' && <EyeOff className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEditSeries = (serie: Series) => {
    console.log('Editing series:', serie);
    setSelectedSeries(serie);
    setIsSeriesDialogOpen(true);
  };

  const handleAddSeries = () => {
    setSelectedSeries({
      id: 0,
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
    setIsSeriesDialogOpen(true);
  };

  const handleSaveSeries = async () => {
    if (!selectedSeries) return;

    try {
      setIsSubmitting(true);
      console.log('Saving series:', selectedSeries);
      
      if (selectedSeries.id && selectedSeries.id > 0) {
        // Update existing series
        console.log('Updating series with ID:', selectedSeries.id);
        
        // Prepare the data for update (only send fields that can be updated)
        const updateData = {
          title: selectedSeries.title,
          description: selectedSeries.description,
          short_description: selectedSeries.short_description,
          visibility: selectedSeries.visibility,
          status: selectedSeries.status,
          category_id: selectedSeries.category_id,
          thumbnail: selectedSeries.thumbnail,
          cover_image: selectedSeries.cover_image,
          trailer_url: selectedSeries.trailer_url,
          meta_title: selectedSeries.meta_title,
          meta_description: selectedSeries.meta_description,
          meta_keywords: selectedSeries.meta_keywords,
          price: selectedSeries.price,
          is_free: selectedSeries.is_free,
          is_featured: selectedSeries.is_featured,
          featured_until: selectedSeries.featured_until,
          tags: selectedSeries.tags,
        };
        
        console.log('Update data being sent:', updateData);
        const response = await seriesApi.update(selectedSeries.id, updateData);
        console.log('Update response:', response);
        
        if (response.success) {
          setSeries(prev => prev.map(s => s.id === selectedSeries.id ? response.data : s));
          setFilteredSeries(prev => prev.map(s => s.id === selectedSeries.id ? response.data : s));
          toast.success("Series updated successfully");
          setIsSeriesDialogOpen(false);
          setSelectedSeries(null);
        } else {
          toast.error(response.message || "Failed to update series");
        }
      } else {
        // Create new series
        console.log('Creating new series');
        const response = await seriesApi.create(selectedSeries);
        console.log('Create response:', response);
        
        if (response.success) {
          setSeries(prev => [response.data, ...prev]);
          setFilteredSeries(prev => [response.data, ...prev]);
          toast.success("Series created successfully");
          setIsSeriesDialogOpen(false);
          setSelectedSeries(null);
        } else {
          toast.error(response.message || "Failed to create series");
        }
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
      series_id: series.length > 0 ? series[0].id : 1,
      instructor_id: null,
      video_url: null,
      video_file_path: null,
      thumbnail: null,
      duration: 0,
      file_size: null,
      video_format: null,
      video_quality: null,
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
      toast.error("Title is required");
      return;
    }
    
    if (!selectedVideo.series_id) {
      toast.error("Series is required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (selectedVideo.id) {
        // Update existing video
        const response = await videoApi.update(selectedVideo.id, selectedVideo);
        if (response.success) {
          setVideos(prev => prev.map(v => v.id === selectedVideo.id ? response.data : v));
          setFilteredVideos(prev => prev.map(v => v.id === selectedVideo.id ? response.data : v));
          toast.success("Video updated successfully");
          setIsVideoDialogOpen(false);
          setSelectedVideo(null);
        } else {
          toast.error(response.message || "Failed to update video");
        }
      } else {
        // Create new video
        const response = await videoApi.create(selectedVideo);
        if (response.success) {
          setVideos(prev => [response.data, ...prev]);
          setFilteredVideos(prev => [response.data, ...prev]);
          toast.success("Video created successfully");
          setIsVideoDialogOpen(false);
          setSelectedVideo(null);
        } else {
          toast.error(response.message || "Failed to create video");
        }
      }
    } catch (error: any) {
      console.error('Error saving video:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save video';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeries = async (seriesId: number) => {
    if (!confirm("Are you sure you want to delete this series? This will also delete all associated videos.")) {
      return;
    }

    try {
      console.log('Deleting series with ID:', seriesId);
      const response = await seriesApi.delete(seriesId);
      console.log('Delete response:', response);
      
      if (response.success) {
        setSeries(prev => prev.filter(s => s.id !== seriesId));
        setFilteredSeries(prev => prev.filter(s => s.id !== seriesId));
        toast.success("Series deleted successfully");
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
    if (!confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      const response = await videoApi.delete(videoId);
      if (response.success) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        setFilteredVideos(prev => prev.filter(v => v.id !== videoId));
        toast.success("Video deleted successfully");
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
      const response = await seriesApi.update(seriesId, { status: newStatus });
      if (response.success) {
        setSeries(prev => prev.map(s => s.id === seriesId ? response.data : s));
        setFilteredSeries(prev => prev.map(s => s.id === seriesId ? response.data : s));
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
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Loading content...</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage your series and episodes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={fetchContent} disabled={isLoading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" onClick={handleAddVideo} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Episode</span>
            <span className="sm:hidden">Episode</span>
          </Button>
          <Button onClick={handleAddSeries} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Series</span>
            <span className="sm:hidden">Series</span>
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
          <span className="hidden sm:inline">Series</span>
        </Button>
        <Button
          variant={activeTab === 'videos' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('videos')}
          className="flex items-center"
          size="sm"
        >
          <VideoIcon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Episodes</span>
        </Button>
        <Button
          variant={activeTab === 'images' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('images')}
          className="flex items-center"
          size="sm"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Images</span>
        </Button>
        <Button
          variant={activeTab === 'media' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('media')}
          className="flex items-center"
          size="sm"
        >
          <Upload className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Media Upload</span>
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
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
                    <TableHead className="min-w-[300px]">Series</TableHead>
                    <TableHead className="w-[100px]">Episodes</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[120px]">Visibility</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
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
                            <div className="font-medium truncate">{serie.title}</div>
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
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                            <DropdownMenuLabel className="text-gray-900 font-semibold px-3 py-2">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuItem 
                              onClick={() => handleEditSeries(serie)}
                              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Series
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Episode
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Series
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuItem 
                              onClick={() => handleToggleSeriesStatus(serie.id)}
                              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 cursor-pointer"
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
                      <h3 className="font-medium text-lg mb-1 line-clamp-1">{serie.title}</h3>
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
                    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                      <DropdownMenuLabel className="text-gray-900 font-semibold px-3 py-2">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem 
                        onClick={() => handleEditSeries(serie)}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Series
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Episode
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Series
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem 
                        onClick={() => handleToggleSeriesStatus(serie.id)}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 cursor-pointer"
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
                    <TableHead className="min-w-[250px]">Episode</TableHead>
                    <TableHead className="w-[150px]">Series</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[100px]">Views</TableHead>
                    <TableHead className="w-[120px]">Visibility</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Uploaded</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
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
                          {series.find(s => s.id === video.series_id)?.title || `Series #${video.series_id}`}
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
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                            <DropdownMenuLabel className="text-gray-900 font-semibold px-3 py-2">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuItem 
                              onClick={() => handleEditVideo(video)}
                              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Episode
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer">
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Play Episode
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuItem 
                              onClick={() => handleToggleVideoStatus(video.id)}
                              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 cursor-pointer"
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
                        Series: {series.find(s => s.id === video.series_id)?.title || `Series #${video.series_id}`}
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
                    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                      <DropdownMenuLabel className="text-gray-900 font-semibold px-3 py-2">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem 
                        onClick={() => handleEditVideo(video)}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Episode
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Play Episode
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200" />
                      <DropdownMenuItem 
                        onClick={() => handleToggleVideoStatus(video.id)}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 cursor-pointer"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 cursor-pointer"
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
              <p className="text-sm text-muted-foreground">Total Series</p>
              <p className="text-2xl font-bold">{series?.length || 0}</p>
            </div>
            <Folder className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Episodes</p>
              <p className="text-2xl font-bold">{videos?.length || 0}</p>
            </div>
            <VideoIcon className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{videos?.reduce((sum, video) => sum + (video?.views || 0), 0).toLocaleString() || '0'}</p>
            </div>
            <Eye className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{videos?.filter(v => v?.status === 'published').length || 0}</p>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Images Tab */}
      {activeTab === 'images' && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Image Gallery</h3>
              <Button onClick={() => {/* TODO: Add image upload */}}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No images uploaded yet</p>
                  <p className="text-sm">Upload images to get started</p>
                </div>
              ) : (
                uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={image.url || image}
                        alt={`Uploaded image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Media Upload Tab */}
      {activeTab === 'media' && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Media Upload</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileImage className="h-5 w-5" />
                  <h4 className="font-medium">Upload Images</h4>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop images here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, WebP (will be converted to WebP)
                  </p>
                  <Button className="mt-4" variant="outline">
                    Select Images
                  </Button>
                </div>
                
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Video Upload */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileVideo className="h-5 w-5" />
                  <h4 className="font-medium">Upload Videos</h4>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop videos here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports MP4, MOV, AVI (will be saved to data_section/movie/)
                  </p>
                  <Button className="mt-4" variant="outline">
                    Select Videos
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Videos will be saved to: <code>data_section/movie/</code></p>
                  <p>• Images will be saved to: <code>data_section/image/</code></p>
                  <p>• Images will be automatically converted to WebP format</p>
                </div>
              </div>
            </div>
            
            {/* Uploaded Media List */}
            {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
              <div className="space-y-4">
                <h4 className="font-medium">Recently Uploaded</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={`img-${index}`} className="text-center">
                      <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                        <img src={image.url || image} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground">Image {index + 1}</p>
                    </div>
                  ))}
                  {uploadedVideos.map((video, index) => (
                    <div key={`vid-${index}`} className="text-center">
                      <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                        <FileVideo className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Video {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Series Dialog */}
      <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSeries?.id ? 'Edit Series' : 'Create New Series'}</DialogTitle>
            <DialogDescription>
              {selectedSeries?.id ? 'Make changes to the series here.' : 'Fill in the details to create a new series.'} Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedSeries && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={selectedSeries.title}
                  onChange={(e) => setSelectedSeries({...selectedSeries, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={selectedSeries.description}
                  onChange={(e) => setSelectedSeries({...selectedSeries, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="visibility" className="text-right">
                  Visibility
                </Label>
                <Select
                  value={selectedSeries.visibility}
                  onValueChange={(value) => setSelectedSeries({...selectedSeries, visibility: value as 'freemium' | 'basic' | 'premium'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={selectedSeries.category_id?.toString() || ''}
                  onValueChange={(value) => setSelectedSeries({...selectedSeries, category_id: parseInt(value)})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedSeries.status}
                  onValueChange={(value) => setSelectedSeries({...selectedSeries, status: value as 'draft' | 'published' | 'archived'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
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
        <DialogContent className="sm:max-w-[500px]">
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
                  Intro Image URL
                </Label>
                <Input
                  id="introImage"
                  value={selectedVideo.intro_image || ''}
                  onChange={(e) => setSelectedVideo({...selectedVideo, intro_image: e.target.value})}
                  className="col-span-3"
                  placeholder="https://example.com/intro-image.webp"
                />
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
                  placeholder="Brief intro text for the video"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoDuration" className="text-right">
                  Duration (minutes)
                </Label>
                <Input
                  id="videoDuration"
                  type="number"
                  value={Math.floor(selectedVideo.duration / 60)}
                  onChange={(e) => setSelectedVideo({...selectedVideo, duration: parseInt(e.target.value) * 60})}
                  className="col-span-3"
                />
              </div>
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
                  <SelectContent>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
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
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.map((serie) => (
                      <SelectItem key={serie.id} value={serie.id.toString()}>
                        {serie.title}
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
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveVideo} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (selectedVideo?.id ? 'Save Changes' : 'Create Episode')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;