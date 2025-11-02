import { useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import { supportTicketApi, SupportTicket } from '@/services/supportTicketApi';
import { useSupportTickets } from '@/contexts/SupportTicketsContext';
import { useLocale } from '@/hooks/useLocale';
import { useTranslation } from 'react-i18next';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SupportTickets = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { tickets, setTickets, selectedTicket, setSelectedTicket, updateTicket, appendReply } = useSupportTickets();
  const [loading, setLoading] = useState<boolean>(true);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [replyMessage, setReplyMessage] = useState<string>('');

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      try {
        const response = await supportTicketApi.getAll();
        const data = Array.isArray(response?.data?.data) ? response.data.data : (response?.data || []);
        setTickets(data);
      } catch (e) {
        console.error('Failed to load tickets', e);
        toast.error(t('admin.support_failed_load'));
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, [locale]); // Refetch when locale changes

  const getPriorityIcon = (priority: string | undefined) => {
    if (!priority) return null;
    
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string | undefined) => {
    if (!priority) return null;
    
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline',
      urgent: 'destructive'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>
        {getPriorityIcon(priority)}
        <span className="ml-1 capitalize">{priority}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'open' && <AlertCircle className="h-3 w-3 mr-1" />}
        {status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'closed' && <XCircle className="h-3 w-3 mr-1" />}
        {(status || '').charAt(0).toUpperCase() + (status || '').slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getCategoryBadge = (category: string | undefined) => {
    if (!category) return null;
    
    const colors = {
      technical: 'bg-blue-100 text-blue-800',
      billing: 'bg-green-100 text-green-800',
      content: 'bg-purple-100 text-purple-800',
      account: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        <Tag className="h-3 w-3 mr-1" />
        {(category || '').charAt(0).toUpperCase() + (category || '').slice(1)}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const subject = (ticket.subject || '').toString();
    const matchesSearch = subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || ticket.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    closedTickets: tickets.filter(t => t.status === 'closed').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    averageResponseTime: '—'
  };

  const handleResolve = async (id: number) => {
    try {
      const response = await supportTicketApi.resolve(id);
      if (response.success) {
        updateTicket({ ...(selectedTicket as any), id, status: 'resolved' } as SupportTicket);
        if (selectedTicket?.id === id) {
          setSelectedTicket({ ...selectedTicket, status: 'resolved' });
        }
        toast.success(t('admin.support_marked_resolved'));
      }
    } catch (e) {
      console.error('Failed to resolve ticket:', e);
      toast.error(t('admin.support_failed_resolve'));
    }
  };

  const handleClose = async (id: number) => {
    try {
      const response = await supportTicketApi.close(id);
      if (response.success) {
        updateTicket({ ...(selectedTicket as any), id, status: 'closed' } as SupportTicket);
        if (selectedTicket?.id === id) {
          setSelectedTicket({ ...selectedTicket, status: 'closed' });
        }
        toast.success(t('admin.support_closed'));
      }
    } catch (e) {
      console.error('Failed to close ticket:', e);
      toast.error(t('admin.support_failed_close'));
    }
  };

  const handleReopen = async (id: number) => {
    try {
      const response = await supportTicketApi.reopen(id);
      if (response.success) {
        updateTicket({ ...(selectedTicket as any), id, status: 'open' } as SupportTicket);
        if (selectedTicket?.id === id) {
          setSelectedTicket({ ...selectedTicket, status: 'open' });
        }
        toast.success(t('admin.support_reopened'));
      }
    } catch (e) {
      console.error('Failed to reopen ticket:', e);
      toast.error(t('admin.support_failed_reopen'));
    }
  };

  const openDetail = async (ticket: SupportTicket) => {
    try {
      const response = await supportTicketApi.get(ticket.id);
      const data = (response as any)?.data?.data || (response as any)?.data || ticket;
      // Normalize assigned user key for UI
      if (!(data as any).assigned_user && (data as any).assignedTo) {
        (data as any).assigned_user = (data as any).assignedTo;
      }
      // Ensure status is present (fallback to list item)
      if (!(data as any).status && (ticket as any).status) {
        (data as any).status = (ticket as any).status;
      }
      // Ensure basic identifiers exist
      if (!(data as any)?.id) {
        (data as any).id = ticket.id;
      }
      // Ensure replies are loaded
      try {
        const repliesRes = await supportTicketApi.getReplies((data as any).id || ticket.id);
        const replies = repliesRes?.data || repliesRes?.data?.data || repliesRes || [];
        (data as any).replies = replies;
      } catch (e) {
        // ignore replies load error; dialog will still open
      }
      setSelectedTicket(data);
      setDetailOpen(true);
      setReplyMessage('');
    } catch (e) {
      console.error('Failed to load ticket details:', e);
      // Fallback to ticket data we already have
      setSelectedTicket(ticket);
      setDetailOpen(true);
      setReplyMessage('');
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    if (!selectedTicket.id) {
      toast.error('Ticket ID is missing. Please reopen the ticket and try again.');
      return;
    }

    try {
      const response = await supportTicketApi.addReply(selectedTicket.id, { message: replyMessage });
      if (response.success) {
        // Optimistically append the new reply to the dialog
        const createdReply = (response as any).data || (response as any).data?.data || null;
        if (createdReply) appendReply(selectedTicket.id, createdReply);
        // Refresh ticket to get updated replies
        try {
          const ticketResponse = await supportTicketApi.get(selectedTicket.id);
          const updatedTicket = (ticketResponse as any)?.data?.data || (ticketResponse as any)?.data || ticketResponse;
          try {
            const repliesRes = await supportTicketApi.getReplies((updatedTicket as any).id || selectedTicket.id);
            const replies = repliesRes?.data || repliesRes?.data?.data || repliesRes || [];
            (updatedTicket as any).replies = replies;
          } catch {}

          if (updatedTicket) {
            // Normalize for list UI
            if (!(updatedTicket as any).assigned_user && (updatedTicket as any).assignedTo) {
              (updatedTicket as any).assigned_user = (updatedTicket as any).assignedTo;
            }
            updateTicket(updatedTicket as SupportTicket);
            setSelectedTicket(updatedTicket);
          }
        } catch (refreshError) {
          console.error('Error refreshing ticket:', refreshError);
          // Still show success even if refresh fails
        }
        setReplyMessage('');
        toast.success('Reply sent successfully');
        // Close detail modal after sending reply
        setDetailOpen(false);
      }
    } catch (e) {
      console.error('Failed to send reply:', e);
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.support_tickets')}</h1>
          <p className="text-muted-foreground">{t('admin.support_manage_requests')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.support_total_tickets')}</p>
              <p className="text-2xl font-bold">{stats.totalTickets}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.support_open_tickets')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.support_in_progress')}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.support_resolved_count')}</p>
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
                placeholder={t('admin.support_search_placeholder')}
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
              {t('admin.support_all_tickets')}
            </Button>
            <Button
              variant={selectedFilter === 'open' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('open')}
            >
              {t('admin.support_open')}
            </Button>
            <Button
              variant={selectedFilter === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('in_progress')}
            >
              {t('admin.support_in_progress')}
            </Button>
            <Button
              variant={selectedFilter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('resolved')}
            >
              {t('admin.support_resolved')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.support_table_ticket')}</TableHead>
              <TableHead>{t('admin.support_table_user')}</TableHead>
              <TableHead>{t('admin.support_table_category')}</TableHead>
              <TableHead>{t('admin.support_table_priority')}</TableHead>
              <TableHead>{t('admin.support_table_status_label')}</TableHead>
              <TableHead>{t('admin.support_table_assigned_to')}</TableHead>
              <TableHead>{t('admin.support_table_created')}</TableHead>
              <TableHead className="w-[70px]">{t('admin.common_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('admin.support_no_tickets_found')}</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? t('admin.support_try_search') : t('admin.support_no_tickets_yet')}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
            filteredTickets.map((ticket, index) => (
              <TableRow key={ticket.id ?? `ticket-${index}`}>
                <TableCell>
                  <div>
                    <div className="font-medium break-words">{ticket.subject || t('admin.support_no_subject')}</div>
                    <div className="text-sm text-muted-foreground">#{ticket.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="break-words">
                    <div className="font-medium">{ticket.user?.name || '—'}</div>
                    <div className="text-sm text-muted-foreground">{ticket.user?.email || '—'}</div>
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
                  <span className="text-sm">{ticket.assigned_user?.name || (ticket as any).assignedTo?.name || t('admin.support_unassigned')}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(ticket.replies?.length || 0)} {t('admin.support_replies')}
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
                    <DropdownMenuContent align="end" className="w-48 bg-gray-800 border border-gray-700 shadow-lg">
                      <DropdownMenuItem onClick={() => openDetail(ticket)} className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        {t('admin.support_view_details')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResolve(ticket.id)} className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer">
                        <Reply className="mr-2 h-4 w-4" />
                        {t('admin.support_mark_resolved')}
                      </DropdownMenuItem>
                      {ticket.status === 'closed' ? (
                        <DropdownMenuItem onClick={() => handleReopen(ticket.id)} className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer">
                          <Tag className="mr-2 h-4 w-4" />
                          {t('admin.support_reopen')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleClose(ticket.id)} className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer">
                          <Tag className="mr-2 h-4 w-4" />
                          {t('admin.support_close')}
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
        )}
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTicket?.subject || 'Ticket Details'}</span>
              <span className="text-sm text-muted-foreground">#{selectedTicket?.id || 'N/A'}</span>
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-center space-x-3 mt-2">
                {selectedTicket && getStatusBadge(selectedTicket.status)}
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
                {selectedTicket && getCategoryBadge(selectedTicket.category)}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Description */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Ticket Description</div>
                <p className="text-sm">{selectedTicket.description || 'No description provided'}</p>
              </div>

              {/* User Info */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Created by: </span>
                  <span className="font-medium">{selectedTicket.user?.name || 'Unknown'}</span>
                  <span className="text-muted-foreground ml-2">({selectedTicket.user?.email || 'No email'})</span>
                </div>
                <div className="text-muted-foreground">
                  {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* Replies */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-3">
                  Conversation ({(selectedTicket.replies || []).length} {selectedTicket.replies?.length === 1 ? 'reply' : 'replies'})
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {(selectedTicket.replies && selectedTicket.replies.length > 0) ? (
                    selectedTicket.replies.map((r) => (
                      <div key={r.id} className={`p-3 rounded-lg border ${
                        r.user_id === selectedTicket.user_id ? 'bg-primary/10 border-primary/20' : 'bg-muted'
                      }`}>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-medium">{r.user?.name || 'Agent'}</span>
                          <span className="text-muted-foreground">
                            {(r.created_at || r.updated_at) ? new Date(r.created_at || r.updated_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{r.message || 'No message content'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No replies yet. Be the first to respond.
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Form (only show for active statuses) */}
              {['open', 'in_progress', 'pending'].includes((selectedTicket.status || '').toString()) && (
                <div className="border-t pt-4 space-y-2">
                  <Textarea 
                    value={replyMessage} 
                    onChange={(e) => setReplyMessage(e.target.value)} 
                    placeholder="Type your reply..." 
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setDetailOpen(false);
                      setReplyMessage('');
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={sendReply} disabled={!replyMessage.trim() || loading}>
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTickets;
