import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Mail,
  Phone,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  CreditCard,
  Settings,
  Globe,
  Shield,
  Star,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'content' | 'general';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  content: string;
  sender: 'user' | 'support';
  senderName: string;
  createdAt: string;
}

const Support = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state for new ticket
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  // Mock data - replace with real API calls
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState([
    {
      id: '1',
      question: 'How do I reset my password?',
      answer: 'To reset your password, go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your email.',
      category: 'account'
    },
    {
      id: '2',
      question: 'How can I upgrade my subscription?',
      answer: 'You can upgrade your subscription by going to your Profile page and clicking "Upgrade Plan". Choose your desired plan and follow the payment process.',
      category: 'billing'
    },
    {
      id: '3',
      question: 'Why is my video not playing?',
      answer: 'If your video is not playing, try refreshing the page, clearing your browser cache, or checking your internet connection. If the problem persists, contact support.',
      category: 'technical'
    },
    {
      id: '4',
      question: 'How do I download course materials?',
      answer: 'Course materials can be downloaded from the video player page. Look for the "Downloadable Materials" section on the right side of the video player.',
      category: 'content'
    },
    {
      id: '5',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription anytime from your Profile page. Your access will continue until the end of your current billing period.',
      category: 'billing'
    },
    {
      id: '6',
      question: 'How do I change my email address?',
      answer: 'You can change your email address from your Profile page. Click "Edit Profile" and update your email address. You will need to verify the new email.',
      category: 'account'
    }
  ]);

  useEffect(() => {
    // Simulate API call
    const fetchTickets = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock tickets data
      const mockTickets: SupportTicket[] = [
        {
          id: 'TK-001',
          subject: 'Video playback issues',
          description: 'I am experiencing buffering issues when watching videos on mobile devices.',
          status: 'in_progress',
          priority: 'high',
          category: 'technical',
          createdAt: '2024-01-20T10:30:00Z',
          updatedAt: '2024-01-21T14:15:00Z',
          messages: [
            {
              id: '1',
              content: 'I am experiencing buffering issues when watching videos on mobile devices.',
              sender: 'user',
              senderName: user?.name || 'User',
              createdAt: '2024-01-20T10:30:00Z'
            },
            {
              id: '2',
              content: 'Thank you for contacting us. We are looking into this issue and will get back to you soon.',
              sender: 'support',
              senderName: 'Support Team',
              createdAt: '2024-01-20T11:45:00Z'
            }
          ]
        },
        {
          id: 'TK-002',
          subject: 'Billing inquiry',
          description: 'I was charged twice for my premium subscription this month.',
          status: 'resolved',
          priority: 'urgent',
          category: 'billing',
          createdAt: '2024-01-18T09:15:00Z',
          updatedAt: '2024-01-19T16:30:00Z',
          messages: [
            {
              id: '1',
              content: 'I was charged twice for my premium subscription this month.',
              sender: 'user',
              senderName: user?.name || 'User',
              createdAt: '2024-01-18T09:15:00Z'
            },
            {
              id: '2',
              content: 'We apologize for the inconvenience. We have refunded the duplicate charge to your account.',
              sender: 'support',
              senderName: 'Support Team',
              createdAt: '2024-01-19T16:30:00Z'
            }
          ]
        },
        {
          id: 'TK-003',
          subject: 'Account access problem',
          description: 'I cannot log into my account despite using the correct password.',
          status: 'open',
          priority: 'medium',
          category: 'account',
          createdAt: '2024-01-22T08:45:00Z',
          updatedAt: '2024-01-22T08:45:00Z',
          messages: [
            {
              id: '1',
              content: 'I cannot log into my account despite using the correct password.',
              sender: 'user',
              senderName: user?.name || 'User',
              createdAt: '2024-01-22T08:45:00Z'
            }
          ]
        }
      ];
      
      setTickets(mockTickets);
      setLoading(false);
    };

    fetchTickets();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <Settings className="h-4 w-4" />;
      case 'billing':
        return <CreditCard className="h-4 w-4" />;
      case 'account':
        return <User className="h-4 w-4" />;
      case 'content':
        return <Video className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedFilter === 'all' || ticket.status === selectedFilter;
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreateTicket = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTicket: SupportTicket = {
        id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
        subject: ticketForm.subject,
        description: ticketForm.description,
        status: 'open',
        priority: ticketForm.priority as any,
        category: ticketForm.category as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: '1',
            content: ticketForm.description,
            sender: 'user',
            senderName: user?.name || 'User',
            createdAt: new Date().toISOString()
          }
        ]
      };

      setTickets(prev => [newTicket, ...prev]);
      setIsCreateTicketOpen(false);
      setTicketForm({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      toast.success("Support ticket created successfully");
    } catch (error) {
      toast.error("Failed to create support ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const newMsg: TicketMessage = {
      id: String(selectedTicket.messages.length + 1),
      content: newMessage,
      sender: 'user',
      senderName: user?.name || 'User',
      createdAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(ticket => 
      ticket.id === selectedTicket.id 
        ? { ...ticket, messages: [...ticket.messages, newMsg], updatedAt: new Date().toISOString() }
        : ticket
    ));

    setSelectedTicket(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMsg],
      updatedAt: new Date().toISOString()
    } : null);

    setNewMessage('');
    toast.success("Message sent successfully");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">Get help with your account, billing, and technical issues</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsCreateTicketOpen(true)}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Create Ticket</h3>
                  <p className="text-sm text-muted-foreground">Get personalized help</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Email Support</h3>
                  <p className="text-sm text-muted-foreground">support@sacrart.com</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Phone Support</h3>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
            </Card>
          </div>

          {/* My Tickets */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">My Support Tickets</h2>
              <Button onClick={() => setIsCreateTicketOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setIsTicketDetailOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{formatDate(ticket.createdAt)}</span>
                        <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'You haven\'t created any support tickets yet'}
                  </p>
                  <Button onClick={() => setIsCreateTicketOpen(true)}>
                    Create Your First Ticket
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@sacrart.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-sm text-muted-foreground">Within 24 hours</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Support Hours */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Support Hours</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span>9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide as much detail as possible about your issue..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={!ticketForm.subject || !ticketForm.description || loading}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={isTicketDetailOpen} onOpenChange={setIsTicketDetailOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedTicket?.subject}</span>
              <span className="text-sm text-muted-foreground">#{selectedTicket?.id}</span>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-4 mt-2">
                {selectedTicket && getStatusBadge(selectedTicket.status)}
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </div>
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">{message.senderName}</span>
                        <span className="text-xs opacity-70">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* New Message */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="newMessage">Reply</Label>
                  <Textarea
                    id="newMessage"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end mt-3">
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTicketDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
