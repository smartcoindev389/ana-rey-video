import { useState } from 'react';
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
  Archive
} from 'lucide-react';

const FeedbackSuggestions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - replace with real API calls
  const feedbacks = [
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
      case 'suggestion':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'feedback':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      suggestion: 'bg-blue-100 text-blue-800',
      feedback: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors]}`}>
        {getTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
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

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || feedback.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalFeedbacks: feedbacks.length,
    newFeedbacks: feedbacks.filter(f => f.status === 'new').length,
    suggestions: feedbacks.filter(f => f.type === 'suggestion').length,
    feedbacks: feedbacks.filter(f => f.type === 'feedback').length,
    averageRating: feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length,
    resolvedFeedbacks: feedbacks.filter(f => f.status === 'resolved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback & Suggestions</h1>
          <p className="text-muted-foreground">Review user feedback and feature suggestions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
              <p className="text-2xl font-bold">{stats.totalFeedbacks}</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Items</p>
              <p className="text-2xl font-bold text-blue-600">{stats.newFeedbacks}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suggestions</p>
              <p className="text-2xl font-bold text-green-600">{stats.suggestions}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
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
                placeholder="Search feedback..."
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
              All Items
            </Button>
            <Button
              variant={selectedFilter === 'new' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('new')}
            >
              New
            </Button>
            <Button
              variant={selectedFilter === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('in_progress')}
            >
              In Progress
            </Button>
            <Button
              variant={selectedFilter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('resolved')}
            >
              Resolved
            </Button>
          </div>
        </div>
      </Card>

      {/* Feedback Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feedback</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedbacks.map((feedback) => (
              <TableRow key={feedback.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{feedback.subject}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {feedback.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {feedback.id}
                    </div>
                    {feedback.relatedVideo && (
                      <div className="text-xs text-blue-600 mt-1">
                        Related: {feedback.relatedVideo}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{feedback.user}</div>
                    <div className="text-sm text-muted-foreground">{feedback.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getTypeBadge(feedback.type)}
                </TableCell>
                <TableCell>
                  {getCategoryBadge(feedback.category)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {renderStars(feedback.rating)}
                    <span className="text-sm ml-2">{feedback.rating}/5</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(feedback.status)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Feedback vs Suggestions</p>
              <p className="text-lg font-bold">
                {stats.feedbacks} feedback, {stats.suggestions} suggestions
              </p>
            </div>
            <ThumbsUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved Items</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedFeedbacks}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackSuggestions;
