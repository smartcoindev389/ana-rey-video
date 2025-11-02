import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus,
  Edit,
  MoreVertical,
  Gift,
  Copy,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Clock,
  Target
} from 'lucide-react';
import { couponApi, Coupon, CouponCreateRequest } from '@/services/couponApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { useEffect } from 'react';

const CouponsDiscounts = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState<Partial<CouponCreateRequest>>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    usage_limit: null,
    usage_limit_per_user: null,
    valid_from: '',
    valid_until: '',
    is_active: true,
    applicable_plans: [],
    first_time_only: false,
  });

  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      try {
        const response = await couponApi.getAll();
        const couponsData = response.data?.data || response.data || [];
        setCoupons(Array.isArray(couponsData) ? couponsData : []);
      } catch (error: any) {
        console.error('Failed to fetch coupons:', error);
        toast.error(error?.message || t('admin.common_error'));
        setCoupons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, [locale]);

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% ${t('admin.coupons_off')}`;
    } else {
      return `$${coupon.value} ${t('admin.coupons_off')}`;
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
    
    if (isExpired) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          {t('admin.coupons_expired')}
        </Badge>
      );
    }
    
    return coupon.is_active ? (
      <Badge variant="default">
        <CheckCircle className="h-3 w-3 mr-1" />
        {t('admin.coupons_active')}
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        {t('admin.coupons_inactive')}
      </Badge>
    );
  };

  const toggleCouponStatus = async (couponId: number) => {
    try {
      const response = await couponApi.toggleStatus(couponId);
      const updatedCoupon = response.data;
      setCoupons(prev => prev.map(coupon => 
        coupon.id === couponId ? updatedCoupon : coupon
      ));
      toast.success(t('admin.coupons_status_updated', 'Coupon status updated'));
    } catch (error: any) {
      console.error('Failed to toggle coupon status:', error);
      toast.error(error?.message || t('admin.common_error'));
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('admin.coupons_code_copied', 'Coupon code copied'));
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    try {
      if (editingCoupon) {
        const response = await couponApi.update(editingCoupon.id, {
          code: editingCoupon.code,
          name: editingCoupon.name,
          description: editingCoupon.description,
          type: editingCoupon.type,
          value: editingCoupon.value,
          minimum_amount: editingCoupon.minimum_amount,
          maximum_discount: editingCoupon.maximum_discount,
          usage_limit: editingCoupon.usage_limit,
          usage_limit_per_user: editingCoupon.usage_limit_per_user,
          valid_from: editingCoupon.valid_from,
          valid_until: editingCoupon.valid_until,
          is_active: editingCoupon.is_active,
          applicable_plans: editingCoupon.applicable_plans,
          first_time_only: editingCoupon.first_time_only,
        });
        const updatedCoupon = response.data;
        setCoupons(prev => prev.map(coupon => 
          coupon.id === editingCoupon.id ? updatedCoupon : coupon
        ));
        toast.success(t('admin.coupons_updated', 'Coupon updated successfully'));
      } else {
        const response = await couponApi.create(newCoupon as CouponCreateRequest);
        const createdCoupon = response.data;
        setCoupons(prev => [...prev, createdCoupon]);
        toast.success(t('admin.coupons_created', 'Coupon created successfully'));
      }
      setIsDialogOpen(false);
      setEditingCoupon(null);
      setNewCoupon({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        minimum_amount: 0,
        maximum_discount: 0,
        usage_limit: null,
        usage_limit_per_user: null,
        valid_from: '',
        valid_until: '',
        is_active: true,
        applicable_plans: [],
        first_time_only: false,
      });
    } catch (error: any) {
      console.error('Failed to save coupon:', error);
      toast.error(error?.message || t('admin.common_error'));
    }
  };

  const stats = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter(c => c.is_active).length,
    totalUsage: coupons.reduce((sum, coupon) => sum + (coupon.used_count || 0), 0),
    totalSavings: coupons.reduce((sum, coupon) => {
      // This is a simplified calculation - in real scenario, you'd get this from API
      if (coupon.type === 'percentage') {
        return sum + ((coupon.used_count || 0) * (coupon.maximum_discount || 0));
      } else {
        return sum + ((coupon.used_count || 0) * coupon.value);
      }
    }, 0)
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.coupons_management')}</h1>
          <p className="text-muted-foreground">{t('admin.common_loading')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setNewCoupon({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimum_amount: 0,
      maximum_discount: 0,
      usage_limit: null,
      usage_limit_per_user: null,
      valid_from: '',
      valid_until: '',
      is_active: true,
      applicable_plans: [],
      first_time_only: false,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.coupons_management')}</h1>
          <p className="text-muted-foreground">{t('admin.coupons_manage_codes')}</p>
        </div>
        <Button onClick={handleAddCoupon}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.coupons_create_coupon')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.coupons_total_coupons')}</p>
              <p className="text-2xl font-bold">{stats.totalCoupons}</p>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.coupons_active_coupons')}</p>
              <p className="text-2xl font-bold">{stats.activeCoupons}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.coupons_total_usage')}</p>
              <p className="text-2xl font-bold">{stats.totalUsage}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.coupons_total_savings')}</p>
              <p className="text-2xl font-bold">${stats.totalSavings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.common_no_data')}</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <Card key={coupon.id} className={`p-6 relative ${coupon.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getDiscountIcon(coupon.type)}
                  <div>
                    <h3 className="text-lg font-semibold">{coupon.name}</h3>
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-gray-800 border border-gray-700 shadow-lg">
                    <DropdownMenuItem 
                      onClick={() => copyCouponCode(coupon.code)}
                      className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {t('admin.coupons_copy_code')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleEditCoupon(coupon)}
                      className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('admin.common_edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className="text-gray-100 hover:text-white hover:bg-gray-700 px-3 py-2 cursor-pointer"
                    >
                      {coupon.is_active ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          {t('admin.coupons_deactivate')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t('admin.coupons_activate')}
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{getDiscountDisplay(coupon)}</span>
                  {getStatusBadge(coupon)}
                </div>
                <div className="mt-2">
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {coupon.code}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {coupon.usage_limit && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('admin.coupons_usage')}</span>
                      <span className="font-medium">
                        {coupon.used_count || 0} / {coupon.usage_limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${((coupon.used_count || 0) / coupon.usage_limit) * 100}%` }}
                      ></div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>{t('admin.coupons_valid')}</span>
                  <span className="font-medium">
                    {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : 'N/A'} - {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {coupon.minimum_amount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('admin.coupons_min_amount_label')}</span>
                    <span className="font-medium">
                      ${coupon.minimum_amount}
                    </span>
                  </div>
                )}
                {coupon.maximum_discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('admin.coupons_max_discount_label')}</span>
                    <span className="font-medium">
                      ${coupon.maximum_discount}
                    </span>
                  </div>
                )}
              </div>

              {(coupon.applicable_plans && coupon.applicable_plans.length > 0) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{t('admin.coupons_applicable_plans_label')}</h4>
                  <div className="flex flex-wrap gap-1">
                    {coupon.applicable_plans.map((plan, index) => (
                      <Badge key={index} variant="outline" className="text-xs capitalize">
                        {plan}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCoupon(null);
          setNewCoupon({
            code: '',
            name: '',
            description: '',
            type: 'percentage',
            value: 0,
            minimum_amount: 0,
            maximum_discount: 0,
            usage_limit: null,
            usage_limit_per_user: null,
            valid_from: '',
            valid_until: '',
            is_active: true,
            applicable_plans: [],
            first_time_only: false,
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? t('admin.coupons_edit_coupon') : t('admin.coupons_create_new')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.coupons_configure')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">{t('admin.coupons_code')}</Label>
                <Input 
                  id="code" 
                  placeholder={t('admin.coupons_code_placeholder')}
                  value={editingCoupon?.code || newCoupon.code}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, code: e.target.value })
                    : setNewCoupon({ ...newCoupon, code: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="name">{t('admin.coupons_name')}</Label>
                <Input 
                  id="name" 
                  placeholder={t('admin.coupons_name_placeholder')}
                  value={editingCoupon?.name || newCoupon.name}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, name: e.target.value })
                    : setNewCoupon({ ...newCoupon, name: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">{t('admin.coupons_description_placeholder')}</Label>
              <Textarea 
                id="description" 
                placeholder={t('admin.coupons_description_placeholder')}
                value={editingCoupon?.description || newCoupon.description}
                onChange={(e) => editingCoupon 
                  ? setEditingCoupon({ ...editingCoupon, description: e.target.value })
                  : setNewCoupon({ ...newCoupon, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">{t('admin.coupons_discount_type')}</Label>
                <Select 
                  value={editingCoupon?.type || newCoupon.type}
                  onValueChange={(value) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, type: value as 'percentage' | 'fixed_amount' })
                    : setNewCoupon({ ...newCoupon, type: value as 'percentage' | 'fixed_amount' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('admin.coupons_percentage')}</SelectItem>
                    <SelectItem value="fixed_amount">{t('admin.coupons_fixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">{t('admin.coupons_discount_value')}</Label>
                <Input 
                  id="value" 
                  type="number" 
                  step="0.01" 
                  placeholder={t('admin.coupons_value_placeholder')}
                  value={editingCoupon?.value || newCoupon.value}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, value: parseFloat(e.target.value) || 0 })
                    : setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAmount">{t('admin.coupons_min_amount')}</Label>
                <Input 
                  id="minAmount" 
                  type="number" 
                  step="0.01" 
                  placeholder={t('admin.coupons_min_amount_placeholder')}
                  value={editingCoupon?.minimum_amount || newCoupon.minimum_amount}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, minimum_amount: parseFloat(e.target.value) || 0 })
                    : setNewCoupon({ ...newCoupon, minimum_amount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">{t('admin.coupons_max_discount')}</Label>
                <Input 
                  id="maxDiscount" 
                  type="number" 
                  step="0.01" 
                  placeholder={t('admin.coupons_max_discount_placeholder')}
                  value={editingCoupon?.maximum_discount || newCoupon.maximum_discount}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, maximum_discount: parseFloat(e.target.value) || 0 })
                    : setNewCoupon({ ...newCoupon, maximum_discount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageLimit">{t('admin.coupons_usage_limit')}</Label>
                <Input 
                  id="usageLimit" 
                  type="number" 
                  placeholder={t('admin.coupons_usage_limit_placeholder')}
                  value={editingCoupon?.usage_limit || newCoupon.usage_limit || ''}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, usage_limit: e.target.value ? parseInt(e.target.value) : null })
                    : setNewCoupon({ ...newCoupon, usage_limit: e.target.value ? parseInt(e.target.value) : null })
                  }
                />
              </div>
              <div>
                <Label htmlFor="applicablePlans">{t('admin.coupons_applicable_plans')}</Label>
                <div className="space-y-2">
                  {['freemium', 'basic', 'premium'].map((plan) => (
                    <div key={plan} className="flex items-center space-x-2">
                      <Switch 
                        id={plan}
                        checked={editingCoupon 
                          ? (editingCoupon.applicable_plans || []).includes(plan)
                          : (newCoupon.applicable_plans || []).includes(plan)
                        }
                        onCheckedChange={(checked) => {
                          const currentPlans = editingCoupon 
                            ? (editingCoupon.applicable_plans || [])
                            : (newCoupon.applicable_plans || []);
                          const updatedPlans = checked
                            ? [...currentPlans, plan]
                            : currentPlans.filter(p => p !== plan);
                          if (editingCoupon) {
                            setEditingCoupon({ ...editingCoupon, applicable_plans: updatedPlans });
                          } else {
                            setNewCoupon({ ...newCoupon, applicable_plans: updatedPlans });
                          }
                        }}
                      />
                      <Label htmlFor={plan} className="capitalize">{plan}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t('admin.coupons_start_date')}</Label>
                <Input 
                  id="startDate" 
                  type="date"
                  value={editingCoupon?.valid_from ? new Date(editingCoupon.valid_from).toISOString().split('T')[0] : newCoupon.valid_from}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, valid_from: e.target.value })
                    : setNewCoupon({ ...newCoupon, valid_from: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">{t('admin.coupons_end_date')}</Label>
                <Input 
                  id="endDate" 
                  type="date"
                  value={editingCoupon?.valid_until ? new Date(editingCoupon.valid_until).toISOString().split('T')[0] : newCoupon.valid_until}
                  onChange={(e) => editingCoupon 
                    ? setEditingCoupon({ ...editingCoupon, valid_until: e.target.value })
                    : setNewCoupon({ ...newCoupon, valid_until: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('admin.common_cancel')}
            </Button>
            <Button onClick={handleSaveCoupon}>
              {editingCoupon ? t('admin.coupons_update_coupon') : t('admin.coupons_create_coupon')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsDiscounts;
