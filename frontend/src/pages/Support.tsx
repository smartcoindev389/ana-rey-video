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
import { supportTicketApi, SupportTicket as TicketType, TicketReply } from '@/services/supportTicketApi';
import { faqApi, Faq } from '@/services/faqApi';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

const Support = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Updated state types
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  // Form state for new ticket
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general' as 'technical' | 'billing' | 'account' | 'content' | 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  useEffect(() => {
    // Fetch from backend API
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await supportTicketApi.getUserTickets();
        if (response.success) {
          const ticketsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
          setTickets(ticketsData);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchFaqs = async () => {
      try {
        const response = await faqApi.getFaqs(undefined, locale);
        if (response.success) {
          const faqData = Array.isArray(response.data) ? response.data : [];
          // Flatten grouped FAQs
          const allFaqs: Faq[] = [];
          Object.values(faqData).forEach((categoryFaqs: any) => {
            if (Array.isArray(categoryFaqs)) {
              allFaqs.push(...categoryFaqs);
            }
          });
          setFaqs(allFaqs);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs([]);
      }
    };

    fetchTickets();
    fetchFaqs();
  }, [user, locale]); // Refetch when user or locale changes

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return null;
    
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

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{(status || '').replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | undefined) => {
    if (!priority) return null;
    
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {(priority || '').toUpperCase()}
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

  const filteredTickets = (tickets || []).filter((ticket: any) => {
    const subject = (ticket?.subject || '').toString();
    const description = (ticket?.description || '').toString();
    const category = (ticket?.category || '').toString();
    const status = (ticket?.status || '').toString();

    const matchesSearch = subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedFilter === 'all' || status === selectedFilter;
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreateTicket = async () => {
    setLoading(true);
    try {
      const response = await supportTicketApi.create({
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: ticketForm.priority,
      });
      
      if (response.success) {
        const newTicket = response.data;
        setTickets(prev => [newTicket, ...prev]);
        setIsCreateTicketOpen(false);
        setTicketForm({
          subject: '',
          description: '',
          category: 'general',
          priority: 'medium',
        });
        toast.success(t('support.ticket_created'));
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(t('support.failed_create'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const response = await supportTicketApi.addReply(selectedTicket.id, {
        message: newMessage,
      });

      if (response.success) {
        // Refresh ticket to get updated messages
        try {
          const ticketResponse = await supportTicketApi.get(selectedTicket.id);
          const updatedTicket = ticketResponse?.data || ticketResponse?.data?.data || ticketResponse;
          
          if (updatedTicket) {
            setTickets(prev => prev.map(ticket => 
              ticket.id === selectedTicket.id ? updatedTicket : ticket
            ));
            setSelectedTicket(updatedTicket);
          }
        } catch (refreshError) {
          console.error('Error refreshing ticket:', refreshError);
          // Still show success even if refresh fails
        }
        setNewMessage('');
        toast.success(t('support.message_sent'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('support.failed_send'));
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return t('support.no_date');
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('support.invalid_date');
    }
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
        <h1 className="text-3xl font-bold mb-2">{t('support.center')}</h1>
        <p className="text-muted-foreground">{t('support.get_help')}</p>
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
                  <h3 className="font-medium">{t('support.create_ticket')}</h3>
                  <p className="text-sm text-muted-foreground">{t('support.get_personalized')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{t('support.email_support')}</h3>
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
                  <h3 className="font-medium">{t('support.phone_support')}</h3>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
            </Card>
          </div>

          {/* My Tickets */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{t('support.my_tickets')}</h2>
              <Button onClick={() => setIsCreateTicketOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('support.new_ticket')}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('support.search_tickets')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('support.filter_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('support.all_status')}</SelectItem>
                  <SelectItem value="open">{t('support.open')}</SelectItem>
                  <SelectItem value="in_progress">{t('support.in_progress')}</SelectItem>
                  <SelectItem value="resolved">{t('support.resolved')}</SelectItem>
                  <SelectItem value="closed">{t('support.closed')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('support.filter_category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('support.all_categories')}</SelectItem>
                  <SelectItem value="technical">{t('support.technical')}</SelectItem>
                  <SelectItem value="billing">{t('support.billing')}</SelectItem>
                  <SelectItem value="account">{t('support.account')}</SelectItem>
                  <SelectItem value="content">{t('support.content')}</SelectItem>
                  <SelectItem value="general">{t('support.general')}</SelectItem>
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
                        <h3 className="font-medium">{ticket.subject || t('support.no_subject')}</h3>
                        <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {ticket.description || t('support.no_description')}
                      </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>{formatDate(ticket.created_at)}</span>
                <span>{(ticket.replies?.length || 0)} {(ticket.replies?.length || 0) !== 1 ? t('support.messages') : t('support.message')}</span>
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
                  <h3 className="text-lg font-semibold mb-2">{t('support.no_tickets_found')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? t('support.try_search') : t('support.no_tickets_yet')}
                  </p>
                  <Button onClick={() => setIsCreateTicketOpen(true)}>
                    {t('support.create_first')}
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
            <h3 className="font-semibold mb-4">{t('support.contact_info')}</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('support.email')}</p>
                  <p className="text-sm text-muted-foreground">support@sacrart.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('support.phone')}</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('support.response_time')}</p>
                  <p className="text-sm text-muted-foreground">{t('support.within_24')}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Support Hours */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t('support.hours')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('support.monday_friday')}</span>
                <span>{t('support.time_9am_6pm')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('support.saturday')}</span>
                <span>{t('support.time_10am_4pm')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('support.sunday')}</span>
                <span>{t('support.closed_label')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('support.create_ticket_title')}</DialogTitle>
            <DialogDescription>
              {t('support.create_ticket_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t('support.subject')}</Label>
              <Input
                id="subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={t('support.brief_description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('support.category')}</Label>
                <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value as 'technical' | 'billing' | 'account' | 'content' | 'general' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">{t('support.technical')}</SelectItem>
                    <SelectItem value="billing">{t('support.billing')}</SelectItem>
                    <SelectItem value="account">{t('support.account')}</SelectItem>
                    <SelectItem value="content">{t('support.content')}</SelectItem>
                    <SelectItem value="general">{t('support.general')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{t('support.priority')}</Label>
                <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'urgent' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('support.low')}</SelectItem>
                    <SelectItem value="medium">{t('support.medium')}</SelectItem>
                    <SelectItem value="high">{t('support.high')}</SelectItem>
                    <SelectItem value="urgent">{t('support.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('support.description')}</Label>
              <Textarea
                id="description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('support.provide_detail')}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateTicket} disabled={!ticketForm.subject || !ticketForm.description || loading}>
              {t('support.create_ticket_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={isTicketDetailOpen} onOpenChange={setIsTicketDetailOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedTicket?.subject || t('support.no_subject')}</span>
              <span className="text-sm text-muted-foreground">#{selectedTicket?.id || t('support.na')}</span>
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
              {/* Ticket Description */}
              {selectedTicket.description && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
              )}
              
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.replies?.map((reply) => (
                  <div key={reply.id} className={`flex ${(reply.user_id === user?.id) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      (reply.user_id === user?.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">{reply.user?.name || t('support.support_user')}</span>
                        <span className="text-xs opacity-70">{formatDate(reply.created_at || reply.updated_at)}</span>
                      </div>
                      <p className="text-sm">{reply.message || t('support.no_message_content')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* New Message (hidden when ticket is closed or resolved) */}
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="newMessage">{t('support.reply')}</Label>
                    <Textarea
                      id="newMessage"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('support.type_message')}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      {t('support.send_message')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedTicket && (selectedTicket.status === 'closed' || selectedTicket.status === 'resolved') && (
              <Button 
                variant="destructive" 
                onClick={async () => {
                  if (!selectedTicket) return;
                  if (!confirm(t('support.delete_confirm'))) return;
                  try {
                    const res = await supportTicketApi.delete(selectedTicket.id);
                    if (res.success) {
                      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                      setIsTicketDetailOpen(false);
                      setSelectedTicket(null);
                      toast.success(t('support.ticket_deleted'));
                    }
                  } catch (err: any) {
                    toast.error(err.message || t('support.failed_delete'));
                  }
                }}
              >
                {t('support.delete_ticket')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsTicketDetailOpen(false)}>
              {t('support.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
