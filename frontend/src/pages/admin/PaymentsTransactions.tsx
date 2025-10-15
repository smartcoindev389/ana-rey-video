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

const PaymentsTransactions = () => {
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
  }, []);

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
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
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
    toast.success("Payment retry initiated");
  };

  const handleProcessRefund = (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { ...t, status: 'refunded' as const }
        : t
    ));
    toast.success("Refund processed successfully");
  };

  const handleExportTransactions = () => {
    // Simulate export functionality
    toast.success("Transaction data exported successfully");
  };

  const handleRefreshTransactions = () => {
    // Simulate refresh
    toast.success("Transactions refreshed");
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payments & Transactions</h1>
          <p className="text-muted-foreground">Loading transactions...</p>
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
          <h1 className="text-3xl font-bold">Payments & Transactions</h1>
          <p className="text-muted-foreground">Monitor payment transactions and revenue</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshTransactions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              <p className="text-xs text-blue-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% from last month
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.completedTransactions} of {stats.totalTransactions} successful
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Transaction</p>
              <p className="text-2xl font-bold">${stats.averageTransaction.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Per successful transaction
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
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
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
                        {transaction.paidAt ? formatDate(transaction.paidAt) : 'Pending'}
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewDetails(transaction)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRetryPayment(transaction.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Receipt className="mr-2 h-4 w-4" />
                        Download Receipt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleProcessRefund(transaction.id)}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Process Refund
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
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
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
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono">{selectedTransaction.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gateway:</span>
                      <span>{selectedTransaction.gateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{selectedTransaction.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span>{selectedTransaction.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Card:</span>
                      <span>****{selectedTransaction.cardLastFour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid At:</span>
                      <span>{selectedTransaction.paidAt ? formatDate(selectedTransaction.paidAt) : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{selectedTransaction.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedTransaction.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscription:</span>
                    {getSubscriptionBadge(selectedTransaction.subscription)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span>{selectedTransaction.subscriptionPeriod}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedTransaction) {
                handleProcessRefund(selectedTransaction.id);
                setIsDetailsDialogOpen(false);
              }
            }}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsTransactions;
