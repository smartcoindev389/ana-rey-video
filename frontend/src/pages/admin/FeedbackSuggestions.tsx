import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ThumbsUp,
  MessageSquare,
  Star,
  Eye,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Tag,
  Archive,
  AlertCircle
} from 'lucide-react';
import { feedbackApi } from '@/services/feedbackApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

const FeedbackSuggestions = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchFeedbacks();
    fetchStatistics();
  }, [selectedFilter, locale]); // Refetch when locale or filter changes

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params: any = {
        per_page: 100,
      };
      if (selectedFilter !== 'all') {
        params.status = selectedFilter;
      }
      const response = await feedbackApi.getAll(params);
      if (response.success) {
        const feedbacksData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.data || [];
        setFeedbacks(feedbacksData);
      }
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await feedbackApi.getStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      const response = await feedbackApi.resolve(id);
      if (response.success) {
        toast.success(t('admin.feedback_resolved_success'));
        fetchFeedbacks();
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve feedback');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await feedbackApi.reject(id);
      if (response.success) {
        toast.success(t('admin.feedback_rejected_success'));
        fetchFeedbacks();
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject feedback');
    }
  };

  // Mock data - replace with real API calls
  const mockFeedbacks = [
    {
      id: 'FB-001',
      user: 'John Doe',
      email: 'john@example.com',
      type: 'suggestion',
      subject: 'Dark mode feature request',
      message: 'It would be great to have a dark mode option for the platform. This would help reduce eye strain during night-time learning sessions.',
      category: 'UI/UX',
      rating: 5,
      status: 'new',
      createdAt: '2024-01-20 14:30:00',
      relatedVideo: null,
      priority: 'medium'
    },
    {
      id: 'FB-002',
      user: 'Jane Smith',
      email: 'jane@example.com',
      type: 'feedback',
      subject: 'Video quality feedback',
      message: 'The video quality is excellent, but I noticed some audio sync issues in the React Fundamentals series. The content is very helpful though!',
      category: 'Technical',
      rating: 4,
      status: 'reviewed',
      createdAt: '2024-01-19 09:15:00',
      relatedVideo: 'React Fundamentals - Episode 5',
      priority: 'high'
    },
    {
      id: 'FB-003',
      user: 'Mike Johnson',
      email: 'mike@example.com',
      type: 'suggestion',
      subject: 'Downloadable content request',
      message: 'Would it be possible to add downloadable PDFs for the course materials? This would be very helpful for offline study.',
      category: 'Content',
      rating: 5,
      status: 'in_progress',
      createdAt: '2024-01-18 16:20:00',
      relatedVideo: null,
      priority: 'medium'
    },
    {
      id: 'FB-004',
      user: 'Sarah Wilson',
      email: 'sarah@example.com',
      type: 'feedback',
      subject: 'Mobile app suggestion',
      message: 'The mobile experience is good, but could you add swipe gestures for video navigation? This would make it more intuitive.',
      category: 'Mobile',
      rating: 4,
      status: 'new',
      createdAt: '2024-01-17 11:45:00',
      relatedVideo: null,
      priority: 'low'
    },
    {
      id: 'FB-005',
      user: 'David Brown',
      email: 'david@example.com',
      type: 'feedback',
      subject: 'Course structure feedback',
      message: 'The course progression is well-structured, but I think adding more practical exercises would enhance the learning experience.',
      category: 'Content',
      rating: 4,
      status: 'resolved',
      createdAt: '2024-01-16 14:10:00',
      relatedVideo: 'JavaScript Advanced - Episode 3',
      priority: 'medium'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature_request':
      case 'suggestion':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'general_feedback':
      case 'feedback':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'bug_report':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'complaint':
        return <Archive className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      'feature_request': 'suggestion',
      'general_feedback': 'feedback',
      'bug_report': 'bug_report',
      'complaint': 'complaint',
    };
    const displayType = typeMap[type] || type;
    
    const colors: Record<string, string> = {
      suggestion: 'bg-blue-100 text-blue-800',
      feedback: 'bg-green-100 text-green-800',
      bug_report: 'bg-red-100 text-red-800',
      complaint: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[displayType] || 'bg-gray-100 text-gray-800'}`}>
        {getTypeIcon(type)}
        <span className="ml-1 capitalize">{displayType.replace('_', ' ')}</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'default',
      reviewed: 'secondary',
      in_progress: 'secondary',
      resolved: 'default',
      archived: 'outline'
    } as const;

    const colors = {
      new: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-primary/10 text-primary',
      resolved: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status === 'new' && <MessageSquare className="h-3 w-3 mr-1" />}
        {status === 'reviewed' && <Eye className="h-3 w-3 mr-1" />}
        {status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'UI/UX': 'bg-purple-100 text-purple-800',
      'Technical': 'bg-blue-100 text-blue-800',
      'Content': 'bg-green-100 text-green-800',
      'Mobile': 'bg-primary/10 text-primary',
      'Feature': 'bg-pink-100 text-pink-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors]}`}>
        <Tag className="h-3 w-3 mr-1" />
        {category}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredFeedbacks = feedbacks.filter((feedback: any) => {
    const user = (feedback?.user?.name || feedback?.user?.email || '').toString().toLowerCase();
    const description = (feedback?.description || '').toString().toLowerCase();
    const matchesSearch = user.includes(searchTerm.toLowerCase()) ||
                         description.includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || feedback.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate average rating safely
  const calculateAverageRating = (): number => {
    if (stats?.average_rating !== null && stats?.average_rating !== undefined) {
      const avg = typeof stats.average_rating === 'string' 
        ? parseFloat(stats.average_rating) 
        : Number(stats.average_rating);
      return isNaN(avg) ? 0 : avg;
    }
    
    // Fallback calculation from feedbacks
    const ratings = feedbacks.filter((f: any) => f.rating && typeof f.rating === 'number');
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc: number, f: any) => acc + (f.rating || 0), 0);
    const avg = sum / ratings.length;
    return isNaN(avg) ? 0 : avg;
  };

  // Merge stats from API with computed stats from feedbacks array
  const computedStats = {
    total_feedback: stats?.total_feedback ?? feedbacks.length,
    new_feedback: stats?.new_feedback ?? feedbacks.filter((f: any) => f.status === 'new').length,
    type_breakdown: {
      feature_request: stats?.type_breakdown?.feature_request ?? feedbacks.filter((f: any) => f.type === 'feature_request').length,
      general_feedback: stats?.type_breakdown?.general_feedback ?? feedbacks.filter((f: any) => f.type === 'general_feedback').length,
    },
    average_rating: calculateAverageRating(),
    resolved_feedback: stats?.resolved_feedback ?? feedbacks.filter((f: any) => f.status === 'resolved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.feedback_suggestions')}</h1>
          <p className="text-muted-foreground">{t('admin.feedback_review_suggestions')}</p>
        </div>
        <Button variant="outline" onClick={fetchFeedbacks}>
          {t('admin.feedback_refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.feedback_total')}</p>
              <p className="text-2xl font-bold">{computedStats.total_feedback || 0}</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.feedback_new_items')}</p>
              <p className="text-2xl font-bold text-blue-600">{computedStats.new_feedback || 0}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.feedback_suggestions_count')}</p>
              <p className="text-2xl font-bold text-green-600">{computedStats.type_breakdown?.feature_request || 0}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.feedback_avg_rating')}</p>
              <p className="text-2xl font-bold">{Number(computedStats.average_rating || 0).toFixed(1)}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('admin.feedback_search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('all')}
            >
              {t('admin.feedback_all_items')}
            </Button>
            <Button
              variant={selectedFilter === 'new' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('new')}
            >
              {t('admin.feedback_new')}
            </Button>
            <Button
              variant={selectedFilter === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('in_progress')}
            >
              {t('admin.feedback_in_progress')}
            </Button>
            <Button
              variant={selectedFilter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('resolved')}
            >
              {t('admin.feedback_resolved')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Feedback Table */}
      <Card>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>{t('admin.feedback_table_feedback')}</TableHead>
                <TableHead>{t('admin.feedback_table_user')}</TableHead>
                <TableHead>{t('admin.feedback_table_type')}</TableHead>
                <TableHead>{t('admin.feedback_table_category')}</TableHead>
                <TableHead>{t('admin.feedback_table_rating')}</TableHead>
                <TableHead>{t('admin.feedback_table_status')}</TableHead>
                <TableHead>{t('admin.feedback_table_created')}</TableHead>
                <TableHead className="w-[70px]">{t('admin.feedback_table_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('admin.feedback_loading')}
                </TableCell>
              </TableRow>
            ) : filteredFeedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('admin.feedback_no_found')}
                </TableCell>
              </TableRow>
            ) : (
              filteredFeedbacks.map((feedback: any) => (
                <TableRow key={feedback.id}>
                  <TableCell>
                    <div>
                      <div className="text-sm text-muted-foreground line-clamp-3 break-words">
                        {feedback.description || t('admin.feedback_no_description')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        #{feedback.id}
                      </div>
                      {feedback.video && (
                        <div className="text-xs text-blue-600 mt-1">
                          Related: {feedback.video.title || `Video #${feedback.video_id}`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="break-words">
                      <div className="font-medium">{feedback.user?.name || t('admin.feedback_anonymous')}</div>
                      <div className="text-sm text-muted-foreground">{feedback.user?.email || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(feedback.type || 'general_feedback')}
                  </TableCell>
                  <TableCell>
                    {feedback.category ? getCategoryBadge(feedback.category) : '-'}
                  </TableCell>
                  <TableCell>
                    {feedback.rating ? (
                      <div className="flex items-center space-x-1">
                        {renderStars(feedback.rating)}
                        <span className="text-sm ml-2">{feedback.rating}/5</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t('admin.feedback_no_rating')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(feedback.status || 'new')}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {feedback.created_at ? new Date(feedback.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-gray-800 border border-gray-700 shadow-lg">
                        <DropdownMenuItem className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          {t('admin.feedback_view_details')}
                        </DropdownMenuItem>
                        {feedback.status !== 'resolved' && (
                          <DropdownMenuItem 
                            onClick={() => handleResolve(feedback.id)}
                            className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('admin.feedback_mark_resolved')}
                          </DropdownMenuItem>
                        )}
                        {feedback.status !== 'rejected' && (
                          <DropdownMenuItem 
                            onClick={() => handleReject(feedback.id)}
                            className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {t('admin.feedback_mark_rejected')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Feedback vs Suggestions</p>
              <p className="text-lg font-bold">
                {computedStats.type_breakdown?.general_feedback || 0} feedback, {computedStats.type_breakdown?.feature_request || 0} suggestions
              </p>
            </div>
            <ThumbsUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.feedback_resolved_items')}</p>
              <p className="text-2xl font-bold text-green-600">{computedStats.resolved_feedback || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackSuggestions;
