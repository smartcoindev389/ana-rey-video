import { useState, useEffect, useCallback } from 'react';
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
import { paymentTransactionApi, PaymentTransaction } from '@/services/paymentTransactionApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

// Frontend transaction interface matching the UI expectations
interface DisplayTransaction {
  id: string;
  user: string;
  userEmail: string;
  subscription: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  type: 'subscription' | 'upgrade' | 'refund';
  paymentMethod: string;
  cardLastFour: string;
  gateway: string;
  transactionId: string;
  paidAt: string | null;
  subscriptionPeriod: string;
  createdAt: string;
}

const PaymentsTransactions = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<DisplayTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<DisplayTransaction | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    monthlyRevenue: 0,
    averageTransaction: 0,
  });

  // Map backend transaction to frontend format
  const mapTransaction = (transaction: PaymentTransaction): DisplayTransaction => {
    const subscriptionName = transaction.subscription?.plan?.display_name || 
                            transaction.subscription?.plan?.name || 
                            'N/A';
    
    // Calculate subscription period if available
    let subscriptionPeriod = 'N/A';
    if (transaction.paid_at && transaction.subscription?.plan) {
      const paidDate = new Date(transaction.paid_at);
      const endDate = new Date(paidDate);
      // Assuming monthly subscription, adjust based on your plan duration
      endDate.setMonth(endDate.getMonth() + 1);
      subscriptionPeriod = `${paidDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    } else if (transaction.status === 'pending') {
      subscriptionPeriod = t('admin.payments_pending');
    } else if (transaction.status === 'failed') {
      subscriptionPeriod = t('admin.payments_failed');
    }

    return {
      id: transaction.id.toString(),
      user: transaction.user?.name || 'N/A',
      userEmail: transaction.user?.email || 'N/A',
      subscription: subscriptionName,
      amount: parseFloat(transaction.amount.toString()),
      currency: transaction.currency || 'USD',
      status: transaction.status,
      type: (transaction.type || 'subscription') as 'subscription' | 'upgrade' | 'refund',
      paymentMethod: transaction.payment_method || 'card',
      cardLastFour: transaction.card_last_four || '0000',
      gateway: transaction.payment_gateway || 'stripe',
      transactionId: transaction.transaction_id,
      paidAt: transaction.paid_at || null,
      subscriptionPeriod,
      createdAt: transaction.created_at,
    };
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        per_page: 100,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      if (selectedFilter !== 'all') {
        params.status = selectedFilter;
      }

      // Apply date filter based on selected period
      const now = new Date();
      if (selectedPeriod === 'week') {
        params.date_from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (selectedPeriod === 'month') {
        params.date_from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      } else if (selectedPeriod === 'quarter') {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        params.date_from = quarterStart.toISOString().split('T')[0];
      } else if (selectedPeriod === 'year') {
        params.date_from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await paymentTransactionApi.getAll(params);
      
      if (response.success && response.data) {
        const transactionsData = response.data.data || response.data;
        const mappedTransactions = transactionsData.map(mapTransaction);
        setTransactions(mappedTransactions);
        setFilteredTransactions(mappedTransactions);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error.message || t('admin.payments_fetch_error') || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback function to calculate statistics from loaded transactions
  const calculateStatsFromTransactions = useCallback(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const pending = transactions.filter(t => t.status === 'pending');
    const failed = transactions.filter(t => t.status === 'failed');
    
    const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = completed.length > 0 ? totalRevenue / completed.length : 0;
    
    setStats({
      totalRevenue,
      totalTransactions: transactions.length,
      completedTransactions: completed.length,
      pendingTransactions: pending.length,
      failedTransactions: failed.length,
      monthlyRevenue: totalRevenue,
      averageTransaction,
    });
  }, [transactions]);

  const fetchStatistics = async () => {
    try {
      const response = await paymentTransactionApi.getStatistics();
      console.log('📊 Statistics API response:', response);
      
      if (response.success && response.data) {
        const statsData = response.data;
        console.log('📊 Statistics data:', statsData);
        
        const newStats = {
          totalRevenue: parseFloat(statsData.total_revenue?.toString() || '0') || 0,
          totalTransactions: parseInt(statsData.total_transactions?.toString() || '0') || 0,
          completedTransactions: parseInt(statsData.completed_transactions?.toString() || '0') || 0,
          pendingTransactions: parseInt(statsData.pending_transactions?.toString() || '0') || 0,
          failedTransactions: parseInt(statsData.failed_transactions?.toString() || '0') || 0,
          monthlyRevenue: parseFloat(statsData.total_revenue?.toString() || '0') || 0,
          averageTransaction: parseFloat(statsData.average_transaction_value?.toString() || '0') || 0,
        };
        
        console.log('📊 Parsed statistics:', newStats);
        setStats(newStats);
      } else {
        console.warn('⚠️ Statistics API response format unexpected:', response);
        // Fallback: calculate from loaded transactions
        calculateStatsFromTransactions();
      }
    } catch (error: any) {
      console.error('❌ Error fetching statistics:', error);
      // Fallback: calculate from loaded transactions
      calculateStatsFromTransactions();
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
  }, [locale, selectedFilter, selectedPeriod]);

  // Recalculate stats when transactions change (as fallback)
  useEffect(() => {
    if (transactions.length > 0) {
      // Only use fallback if stats are still zero after a delay
      const timer = setTimeout(() => {
        if (stats.totalTransactions === 0 && transactions.length > 0) {
          console.log('📊 Using fallback statistics calculation from transactions');
          calculateStatsFromTransactions();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, stats.totalTransactions, calculateStatsFromTransactions]);

  // Refetch when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtering is now handled server-side, but we keep local filtering for immediate UI updates
  useEffect(() => {
    let filtered = transactions;

    // Additional client-side filtering if needed (though search is server-side)
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === selectedFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter]);

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

  const handleViewDetails = (transaction: DisplayTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  const handleRetryPayment = async (transactionId: string) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return;

      // Mark as pending by updating the transaction
      await paymentTransactionApi.update(parseInt(transactionId), { status: 'pending' });
      toast.success(t('admin.payments_retry_initiated'));
      await fetchTransactions();
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      toast.error(error.message || t('admin.payments_retry_error') || 'Failed to retry payment');
    }
  };

  const handleProcessRefund = async (transactionId: string) => {
    try {
      await paymentTransactionApi.refund(parseInt(transactionId));
      toast.success(t('admin.payments_refund_processed'));
      await fetchTransactions();
      await fetchStatistics();
      setIsDetailsDialogOpen(false);
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(error.message || t('admin.payments_refund_error') || 'Failed to process refund');
    }
  };

  const handleExportTransactions = async () => {
    try {
      const params: any = {};
      if (selectedFilter !== 'all') {
        params.status = selectedFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await paymentTransactionApi.export(params);
      if (response.success && response.data) {
        // Convert CSV data to downloadable file
        const csvContent = response.data.map((row: any[]) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('admin.payments_exported'));
      }
    } catch (error: any) {
      console.error('Error exporting transactions:', error);
      toast.error(error.message || t('admin.payments_export_error') || 'Failed to export transactions');
    }
  };

  const handleRefreshTransactions = async () => {
    await fetchTransactions();
    await fetchStatistics();
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

  // Stats are now fetched from API and stored in state

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
                {stats.totalTransactions > 0 
                  ? ((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)
                  : '0.0'}%
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
              <p className="text-2xl font-bold text-green-600">{stats.completedTransactions || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_pending_count')}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.payments_failed_count')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedTransactions || 0}</p>
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
