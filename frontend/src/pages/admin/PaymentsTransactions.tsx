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
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Receipt
} from 'lucide-react';
import { generateMockTransactions, MockTransaction } from '@/services/mockData';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

const PaymentsTransactions = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [transactions, setTransactions] = useState<MockTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<MockTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<MockTransaction | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchTransactions = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockTransactions = generateMockTransactions();
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setIsLoading(false);
    };

    fetchTransactions();
  }, [locale]);

  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === selectedFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, selectedFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'secondary'
    } as const;

    const statusLabels = {
      completed: t('admin.payments_completed'),
      pending: t('admin.payments_pending'),
      failed: t('admin.payments_failed'),
      refunded: t('admin.payments_refunded')
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{statusLabels[status as keyof typeof statusLabels] || status}</span>
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription: string) => {
    const colors = {
      Premium: 'bg-yellow-100 text-yellow-800',
      Basic: 'bg-blue-100 text-blue-800',
      Freemium: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[subscription as keyof typeof colors]}`}>
        {subscription}
      </span>
    );
  };

  const handleViewDetails = (transaction: MockTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  const handleRetryPayment = (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { ...t, status: 'pending' as const }
        : t
    ));
    toast.success(t('admin.payments_retry_initiated'));
  };

  const handleProcessRefund = (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { ...t, status: 'refunded' as const }
        : t
    ));
    toast.success(t('admin.payments_refund_processed'));
  };

  const handleExportTransactions = () => {
    // Simulate export functionality
    toast.success(t('admin.payments_exported'));
  };

  const handleRefreshTransactions = () => {
    // Simulate refresh
    toast.success(t('admin.payments_refreshed'));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.payments_transactions')}</h1>
          <p className="text-muted-foreground">{t('admin.payments_loading')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalRevenue: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter(t => t.status === 'completed').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    failedTransactions: transactions.filter(t => t.status === 'failed').length,
    monthlyRevenue: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    averageTransaction: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.payments_transactions')}</h1>
          <p className="text-muted-foreground">{t('admin.payments_monitor')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshTransactions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.payments_refresh')}
          </Button>
          <Button variant="outline" onClick={handleExportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            {t('admin.payments_export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_total_revenue')}</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% {t('admin.payments_from_last_month')}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_total_transactions')}</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              <p className="text-xs text-blue-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% {t('admin.payments_from_last_month')}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_success_rate')}</p>
              <p className="text-2xl font-bold">
                {((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.completedTransactions} {t('admin.payments_of')} {stats.totalTransactions} {t('admin.payments_successful')}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_avg_transaction')}</p>
              <p className="text-2xl font-bold">${stats.averageTransaction.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {t('admin.payments_per_transaction')}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
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
                placeholder={t('admin.payments_search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.payments_filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.payments_all_status')}</SelectItem>
                <SelectItem value="completed">{t('admin.payments_completed')}</SelectItem>
                <SelectItem value="pending">{t('admin.payments_pending')}</SelectItem>
                <SelectItem value="failed">{t('admin.payments_failed')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.payments_time_period')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t('admin.payments_this_week')}</SelectItem>
                <SelectItem value="month">{t('admin.payments_this_month')}</SelectItem>
                <SelectItem value="quarter">{t('admin.payments_this_quarter')}</SelectItem>
                <SelectItem value="year">{t('admin.payments_this_year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.payments_table_transaction')}</TableHead>
              <TableHead>{t('admin.payments_table_user')}</TableHead>
              <TableHead>{t('admin.payments_table_subscription')}</TableHead>
              <TableHead>{t('admin.payments_table_amount')}</TableHead>
              <TableHead>{t('admin.payments_table_payment_method')}</TableHead>
              <TableHead>{t('admin.payments_table_status')}</TableHead>
              <TableHead>{t('admin.payments_table_date')}</TableHead>
              <TableHead className="w-[70px]">{t('admin.payments_table_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.transactionId}</div>
                    <div className="text-sm text-muted-foreground">{transaction.gateway}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.user}</div>
                    <div className="text-sm text-muted-foreground">{transaction.userEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getSubscriptionBadge(transaction.subscription)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm font-medium">
                    <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">****{transaction.cardLastFour}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <div>
                      <div className="text-sm">
                        {transaction.paidAt ? formatDate(transaction.paidAt) : t('admin.payments_pending')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.subscriptionPeriod}
                      </div>
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
                      <DropdownMenuLabel className="text-white font-semibold px-3 py-2">{t('admin.payments_table_actions')}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        onClick={() => handleViewDetails(transaction)}
                        className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t('admin.payments_view_details')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRetryPayment(transaction.id)}
                        className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('admin.payments_retry_payment')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer">
                        <Receipt className="mr-2 h-4 w-4" />
                        {t('admin.payments_download_receipt')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        onClick={() => handleProcessRefund(transaction.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-2 cursor-pointer"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t('admin.payments_process_refund')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Payment Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_completed_count')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_pending_count')}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_failed_count')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedTransactions}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('admin.payments_transaction_details')}</DialogTitle>
            <DialogDescription>
              {t('admin.payments_details_description')}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('admin.payments_transaction_info')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_transaction_id')}</span>
                      <span className="font-mono">{selectedTransaction.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_gateway')}</span>
                      <span>{selectedTransaction.gateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_type')}</span>
                      <span>{selectedTransaction.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_status_label')}</span>
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('admin.payments_payment_details')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_amount_label')}</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_payment_method_label')}</span>
                      <span>{selectedTransaction.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_card')}</span>
                      <span>****{selectedTransaction.cardLastFour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.payments_paid_at')}</span>
                      <span>{selectedTransaction.paidAt ? formatDate(selectedTransaction.paidAt) : t('admin.payments_pending')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('admin.payments_customer_info')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.payments_name')}</span>
                    <span>{selectedTransaction.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.payments_email')}</span>
                    <span>{selectedTransaction.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.payments_subscription_label')}</span>
                    {getSubscriptionBadge(selectedTransaction.subscription)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.payments_period')}</span>
                    <span>{selectedTransaction.subscriptionPeriod}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              {t('admin.payments_close')}
            </Button>
            <Button onClick={() => {
              if (selectedTransaction) {
                handleProcessRefund(selectedTransaction.id);
                setIsDetailsDialogOpen(false);
              }
            }}>
              {t('admin.payments_process_refund')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsTransactions;
