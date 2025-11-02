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
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Crown,
  Star,
  Zap,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { userApi, User, UserStatistics } from '@/services/userApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

const UsersManagement = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getAll({ per_page: 100 });
      const usersData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setUsers(usersData);
      setFilteredUsers(usersData);
      toast.success('Users loaded successfully');
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(`Failed to load users: ${error.message}`);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await userApi.getStatistics();
      setStatistics(response.data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [locale]); // Refetch when locale changes

  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Subscription filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(user => user.subscription_type === selectedFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedFilter]);

  const getSubscriptionIcon = (subscription: string) => {
    switch (subscription) {
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

  const getSubscriptionBadge = (subscription: string) => {
    const variants = {
      premium: 'default',
      basic: 'secondary',
      freemium: 'outline'
    } as const;

    const colors = {
      premium: 'bg-yellow-100 text-yellow-800',
      basic: 'bg-blue-100 text-blue-800',
      freemium: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[subscription as keyof typeof colors]}`}>
        {getSubscriptionIcon(subscription)}
        <span className="ml-1 capitalize">{subscription}</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      suspended: 'destructive',
      inactive: 'secondary'
    } as const;

    const statusLabels = {
      active: t('admin.users_active'),
      suspended: t('admin.users_suspended'),
      inactive: t('admin.users_suspended')
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
        {statusLabels[status as keyof typeof statusLabels] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser({
      id: 0,
      name: '',
      email: '',
      subscription_type: 'freemium',
      role: 'user',
      created_at: '',
      updated_at: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      const response = await userApi.update(selectedUser.id, selectedUser);
      if (response.success) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? response.data : u));
        toast.success(t('admin.users_updated_success'));
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      const response = await userApi.create({ ...selectedUser, password: 'password123' });
      if (response.success) {
        setUsers(prev => [response.data, ...prev]);
        toast.success(t('admin.users_created_success'));
        setIsAddDialogOpen(false);
        setSelectedUser(null);
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async (userId: number) => {
    try {
      const response = await userApi.toggleStatus(userId);
      if (response.success) {
        setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
        toast.success(t('admin.users_status_updated'));
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('admin.users_delete_confirm'))) {
      return;
    }

    try {
      const response = await userApi.delete(userId);
      if (response.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success(t('admin.users_deleted_success'));
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleUpgradeSubscription = async (userId: number, subscriptionType: 'basic' | 'premium') => {
    try {
      const response = await userApi.upgradeSubscription(userId, { subscription_type: subscriptionType });
      if (response.success) {
        setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
        toast.success(t('admin.users_upgraded_success', { type: subscriptionType }));
        fetchStatistics();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade subscription");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.users_management')}</h1>
          <p className="text-muted-foreground">{t('admin.users_loading')}</p>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.users_management')}</h1>
          <p className="text-muted-foreground">{t('admin.users_manage_accounts')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('admin.users_refresh')}
          </Button>
          <Button onClick={handleAddUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('admin.users_add_user')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('admin.users_search_placeholder')}
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
              {t('admin.users_all_users')}
            </Button>
            <Button
              variant={selectedFilter === 'premium' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('premium')}
            >
              <Crown className="mr-2 h-4 w-4" />
              {t('admin.users_premium')}
            </Button>
            <Button
              variant={selectedFilter === 'basic' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('basic')}
            >
              <Star className="mr-2 h-4 w-4" />
              {t('admin.users_basic')}
            </Button>
            <Button
              variant={selectedFilter === 'freemium' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('freemium')}
            >
              <Zap className="mr-2 h-4 w-4" />
              {t('admin.users_freemium')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users_table_user')}</TableHead>
                <TableHead>{t('admin.users_table_subscription')}</TableHead>
                <TableHead>{t('admin.users_table_status')}</TableHead>
                <TableHead>{t('admin.users_table_role')}</TableHead>
                <TableHead>{t('admin.users_table_expires')}</TableHead>
                <TableHead>{t('admin.users_table_joined')}</TableHead>
                <TableHead className="w-[70px]">{t('admin.users_table_actions')}</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getSubscriptionBadge(user.subscription_type)}
                </TableCell>
                <TableCell>
                  {user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date() && user.subscription_type !== 'freemium' 
                    ? getStatusBadge('suspended')
                    : getStatusBadge('active')
                  }
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.role}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    {user.subscription_expires_at ? formatDate(user.subscription_expires_at) : t('admin.users_na')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    {formatDate(user.created_at)}
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
                      <DropdownMenuLabel className="text-white font-semibold px-3 py-2">{t('admin.users_actions_label')}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        onClick={() => handleEditUser(user)}
                        className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t('admin.users_edit')}
                      </DropdownMenuItem>
                      {user.subscription_type !== 'premium' && (
                        <DropdownMenuItem 
                          onClick={() => handleUpgradeSubscription(user.id, 'premium')}
                          className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          {t('admin.users_upgrade_premium')}
                        </DropdownMenuItem>
                      )}
                      {user.subscription_type === 'freemium' && (
                        <DropdownMenuItem 
                          onClick={() => handleUpgradeSubscription(user.id, 'basic')}
                          className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {t('admin.users_upgrade_basic')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-gray-700" />
                      {user.subscription_type !== 'freemium' && (
                        <DropdownMenuItem 
                          onClick={() => handleSuspendUser(user.id)}
                          className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                        >
                          {user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date() ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('admin.users_activate')}
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              {t('admin.users_suspend')}
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-2 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('admin.users_delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.users_total_users')}</p>
              <p className="text-2xl font-bold">{statistics?.total_users || users.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.users_premium_users')}</p>
              <p className="text-2xl font-bold">{statistics?.premium_users || users.filter(u => u.subscription_type === 'premium').length}</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{statistics?.active_users || users.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${statistics?.total_revenue.toFixed(2) || '0.00'}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user account here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription" className="text-right">
                  Subscription
                </Label>
                <Select 
                  value={selectedUser.subscription_type} 
                  onValueChange={(value: 'freemium' | 'basic' | 'premium') => 
                    setSelectedUser({...selectedUser, subscription_type: value})
                  }
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
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value: 'user' | 'admin') => 
                    setSelectedUser({...selectedUser, role: value})
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The default password will be "password123".
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription" className="text-right">
                  Subscription
                </Label>
                <Select 
                  value={selectedUser.subscription_type} 
                  onValueChange={(value: 'freemium' | 'basic' | 'premium') => 
                    setSelectedUser({...selectedUser, subscription_type: value})
                  }
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
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value: 'user' | 'admin') => 
                    setSelectedUser({...selectedUser, role: value})
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
