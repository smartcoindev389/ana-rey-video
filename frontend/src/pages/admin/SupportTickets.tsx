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
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Reply,
  Eye,
  User,
  Calendar,
  Tag,
  Plus
} from 'lucide-react';

const SupportTickets = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - replace with real API calls
  const tickets = [
    {
      id: 'TKT-001',
      user: 'John Doe',
      email: 'john@example.com',
      subject: 'Video playback issues',
      message: 'I am having trouble playing videos on my mobile device. The video keeps buffering...',
      category: 'Technical',
      priority: 'high',
      status: 'open',
      assignedTo: 'Support Team',
      createdAt: '2024-01-20 14:30:00',
      lastReply: '2024-01-20 15:45:00',
      replies: 2,
      relatedVideo: 'React Fundamentals - Episode 3'
    },
    {
      id: 'TKT-002',
      user: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'Subscription billing question',
      message: 'I was charged twice for my premium subscription this month. Can you help me resolve this?',
      category: 'Billing',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'Billing Team',
      createdAt: '2024-01-19 09:15:00',
      lastReply: '2024-01-19 10:30:00',
      replies: 3,
      relatedVideo: null
    },
    {
      id: 'TKT-003',
      user: 'Mike Johnson',
      email: 'mike@example.com',
      subject: 'Content request',
      message: 'Would it be possible to add more advanced JavaScript topics?',
      category: 'Content',
      priority: 'low',
      status: 'resolved',
      assignedTo: 'Content Team',
      createdAt: '2024-01-18 16:20:00',
      lastReply: '2024-01-19 09:00:00',
      replies: 1,
      relatedVideo: null
    },
    {
      id: 'TKT-004',
      user: 'Sarah Wilson',
      email: 'sarah@example.com',
      subject: 'Account access problem',
      message: 'I cannot log into my account. I keep getting an error message.',
      category: 'Account',
      priority: 'high',
      status: 'open',
      assignedTo: 'Technical Team',
      createdAt: '2024-01-17 11:45:00',
      lastReply: null,
      replies: 0,
      relatedVideo: null
    },
    {
      id: 'TKT-005',
      user: 'David Brown',
      email: 'david@example.com',
      subject: 'Feature suggestion',
      message: 'It would be great to have a dark mode option for the platform.',
      category: 'Feature Request',
      priority: 'low',
      status: 'closed',
      assignedTo: 'Product Team',
      createdAt: '2024-01-16 14:10:00',
      lastReply: '2024-01-17 08:30:00',
      replies: 2,
      relatedVideo: null
    }
  ];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {getPriorityIcon(priority)}
        <span className="ml-1 capitalize">{priority}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'default',
      closed: 'outline'
    } as const;

    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status === 'open' && <AlertCircle className="h-3 w-3 mr-1" />}
        {status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'closed' && <XCircle className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      Technical: 'bg-blue-100 text-blue-800',
      Billing: 'bg-green-100 text-green-800',
      Content: 'bg-purple-100 text-purple-800',
      Account: 'bg-orange-100 text-orange-800',
      'Feature Request': 'bg-pink-100 text-pink-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors]}`}>
        <Tag className="h-3 w-3 mr-1" />
        {category}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || ticket.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    closedTickets: tickets.filter(t => t.status === 'closed').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'high').length,
    averageResponseTime: '2.5 hours'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support / Tickets</h1>
          <p className="text-muted-foreground">Manage user questions and support requests</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold">{stats.totalTickets}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
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
                placeholder="Search tickets..."
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
              All Tickets
            </Button>
            <Button
              variant={selectedFilter === 'open' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('open')}
            >
              Open
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

      {/* Tickets Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-sm text-muted-foreground">{ticket.id}</div>
                    {ticket.relatedVideo && (
                      <div className="text-xs text-blue-600 mt-1">
                        Related: {ticket.relatedVideo}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{ticket.user}</div>
                    <div className="text-sm text-muted-foreground">{ticket.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getCategoryBadge(ticket.category)}
                </TableCell>
                <TableCell>
                  {getPriorityBadge(ticket.priority)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{ticket.assignedTo}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.replies} replies
                    </div>
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
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Tag className="mr-2 h-4 w-4" />
                        Change Priority
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority Tickets</p>
              <p className="text-2xl font-bold text-red-600">{stats.highPriorityTickets}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold">{stats.averageResponseTime}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupportTickets;
