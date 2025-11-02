import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus,
  Edit,
  MoreVertical,
  Crown,
  Star,
  Zap,
  DollarSign,
  Users,
  CheckCircle,
  X,
  Trash2,
  Copy,
  Settings
} from 'lucide-react';
import { subscriptionPlanApi, SubscriptionPlan, SubscriptionPlanCreateRequest } from '@/services/subscriptionPlanApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

const SubscriptionPlans = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlanCreateRequest>>({
    name: 'freemium',
    display_name: '',
    description: '',
    price: 0,
    duration_days: 30,
    features: [],
    max_devices: 1,
    video_quality: 'SD',
    downloadable_content: false,
    certificates: false,
    priority_support: false,
    ad_free: false,
    is_active: true,
    sort_order: 1
  });

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const response = await subscriptionPlanApi.getAll();
        const plansData = response.data?.data || response.data || [];
        setPlans(Array.isArray(plansData) ? plansData : []);
      } catch (error: any) {
        console.error('Failed to fetch plans:', error);
        toast.error(error?.message || t('admin.common_error'));
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [locale]);

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'basic':
        return <Star className="h-6 w-6 text-blue-500" />;
      case 'freemium':
        return <Zap className="h-6 w-6 text-gray-500" />;
      default:
        return <DollarSign className="h-6 w-6 text-primary" />;
    }
  };

  const togglePlanStatus = async (planId: number) => {
    try {
      const response = await subscriptionPlanApi.toggleStatus(planId);
      const updatedPlan = response.data;
      setPlans(prev => prev.map(plan => 
        plan.id === planId ? updatedPlan : plan
      ));
      toast.success(t('admin.plans_status_updated'));
    } catch (error: any) {
      console.error('Failed to toggle plan status:', error);
      toast.error(error?.message || t('admin.common_error'));
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        const response = await subscriptionPlanApi.update(editingPlan.id, {
          name: editingPlan.name,
          display_name: editingPlan.display_name,
          description: editingPlan.description,
          price: editingPlan.price,
          duration_days: editingPlan.duration_days,
          features: editingPlan.features,
          max_devices: editingPlan.max_devices,
          video_quality: editingPlan.video_quality,
          downloadable_content: editingPlan.downloadable_content,
          certificates: editingPlan.certificates,
          priority_support: editingPlan.priority_support,
          ad_free: editingPlan.ad_free,
          is_active: editingPlan.is_active,
          sort_order: editingPlan.sort_order,
        });
        const updatedPlan = response.data;
        setPlans(prev => prev.map(plan => 
          plan.id === editingPlan.id ? updatedPlan : plan
        ));
        toast.success(t('admin.plans_updated'));
      } else {
        const response = await subscriptionPlanApi.create(newPlan as SubscriptionPlanCreateRequest);
        const createdPlan = response.data;
        setPlans(prev => [...prev, createdPlan]);
        toast.success(t('admin.plans_created'));
      }
      setIsDialogOpen(false);
      setEditingPlan(null);
      setNewPlan({
        name: 'freemium',
        display_name: '',
        description: '',
        price: 0,
        duration_days: 30,
        features: [],
        max_devices: 1,
        video_quality: 'SD',
        downloadable_content: false,
        certificates: false,
        priority_support: false,
        ad_free: false,
        is_active: true,
        sort_order: 1
      });
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      toast.error(error?.message || t('admin.common_error'));
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm(t('admin.common_confirm'))) {
      return;
    }
    try {
      await subscriptionPlanApi.delete(planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      toast.success(t('admin.plans_deleted'));
    } catch (error: any) {
      console.error('Failed to delete plan:', error);
      toast.error(error?.message || t('admin.common_error'));
    }
  };

  const handleDuplicatePlan = async (plan: SubscriptionPlan) => {
    try {
      const duplicatedData: SubscriptionPlanCreateRequest = {
        name: `${plan.name}_copy`,
        display_name: `${plan.display_name} (Copy)`,
        description: plan.description,
        price: plan.price,
        duration_days: plan.duration_days,
        features: plan.features || [],
        max_devices: plan.max_devices,
        video_quality: plan.video_quality,
        downloadable_content: plan.downloadable_content,
        certificates: plan.certificates,
        priority_support: plan.priority_support,
        ad_free: plan.ad_free,
        is_active: plan.is_active,
        sort_order: plan.sort_order,
      };
      const response = await subscriptionPlanApi.create(duplicatedData);
      const duplicatedPlan = response.data;
      setPlans(prev => [...prev, duplicatedPlan]);
      toast.success(t('admin.plans_duplicated'));
    } catch (error: any) {
      console.error('Failed to duplicate plan:', error);
      toast.error(error?.message || t('admin.common_error'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.plans_management')}</h1>
          <p className="text-muted-foreground">{t('admin.plans_loading')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-3 bg-muted rounded w-4/6"></div>
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
          <h1 className="text-3xl font-bold">{t('admin.plans_management')}</h1>
          <p className="text-muted-foreground">{t('admin.plans_manage_pricing')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.plans_create_plan')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? t('admin.plans_edit_plan') : t('admin.plans_create_new')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.plans_configure')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('admin.plans_plan_name')}</Label>
                  <Select 
                    value={editingPlan?.name || newPlan.name} 
                    onValueChange={(value: 'freemium' | 'basic' | 'premium') => {
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, name: value});
                      } else {
                        setNewPlan({...newPlan, name: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freemium">{t('admin.users_freemium')}</SelectItem>
                      <SelectItem value="basic">{t('admin.users_basic')}</SelectItem>
                      <SelectItem value="premium">{t('admin.users_premium')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="display_name">{t('admin.plans_display_name')}</Label>
                  <Input 
                    id="display_name" 
                    placeholder={t('admin.plans_display_name_placeholder')}
                    value={editingPlan?.display_name || newPlan.display_name || ''}
                    onChange={(e) => {
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, display_name: e.target.value});
                      } else {
                        setNewPlan({...newPlan, display_name: e.target.value});
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">{t('admin.plans_description')}</Label>
                <Textarea 
                  id="description" 
                  placeholder={t('admin.plans_description_placeholder')}
                  value={editingPlan?.description || newPlan.description || ''}
                  onChange={(e) => {
                    if (editingPlan) {
                      setEditingPlan({...editingPlan, description: e.target.value});
                    } else {
                      setNewPlan({...newPlan, description: e.target.value});
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">{t('admin.plans_price')}</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    placeholder={t('admin.plans_price_placeholder')}
                    value={editingPlan?.price || newPlan.price || 0}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, price});
                      } else {
                        setNewPlan({...newPlan, price});
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_days">{t('admin.plans_duration')}</Label>
                  <Input 
                    id="duration_days" 
                    type="number" 
                    placeholder={t('admin.plans_duration_placeholder')}
                    value={editingPlan?.duration_days || newPlan.duration_days || 30}
                    onChange={(e) => {
                      const duration_days = parseInt(e.target.value) || 30;
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, duration_days});
                      } else {
                        setNewPlan({...newPlan, duration_days});
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_devices">{t('admin.plans_max_devices')}</Label>
                  <Input 
                    id="max_devices" 
                    type="number" 
                    placeholder={t('admin.plans_max_devices_placeholder')}
                    value={editingPlan?.max_devices || newPlan.max_devices || 1}
                    onChange={(e) => {
                      const max_devices = parseInt(e.target.value) || 1;
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, max_devices});
                      } else {
                        setNewPlan({...newPlan, max_devices});
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="video_quality">{t('admin.plans_video_quality')}</Label>
                  <Select 
                    value={editingPlan?.video_quality || newPlan.video_quality || 'SD'} 
                    onValueChange={(value: 'SD' | 'HD' | '4K') => {
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, video_quality: value});
                      } else {
                        setNewPlan({...newPlan, video_quality: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SD" className="text-white hover:text-white hover:bg-gray-700">SD</SelectItem>
                      <SelectItem value="HD" className="text-white hover:text-white hover:bg-gray-700">HD</SelectItem>
                      <SelectItem value="4K" className="text-white hover:text-white hover:bg-gray-700">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.plans_features')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="downloadable_content"
                      checked={editingPlan?.downloadable_content || newPlan.downloadable_content || false}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, downloadable_content: checked});
                        } else {
                          setNewPlan({...newPlan, downloadable_content: checked});
                        }
                      }}
                    />
                    <Label htmlFor="downloadable_content">{t('admin.plans_downloadable_content')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="certificates"
                      checked={editingPlan?.certificates || newPlan.certificates || false}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, certificates: checked});
                        } else {
                          setNewPlan({...newPlan, certificates: checked});
                        }
                      }}
                    />
                    <Label htmlFor="certificates">{t('admin.plans_certificates')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="priority_support"
                      checked={editingPlan?.priority_support || newPlan.priority_support || false}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, priority_support: checked});
                        } else {
                          setNewPlan({...newPlan, priority_support: checked});
                        }
                      }}
                    />
                    <Label htmlFor="priority_support">{t('admin.plans_priority_support')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="ad_free"
                      checked={editingPlan?.ad_free || newPlan.ad_free || false}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, ad_free: checked});
                        } else {
                          setNewPlan({...newPlan, ad_free: checked});
                        }
                      }}
                    />
                    <Label htmlFor="ad_free">{t('admin.plans_ad_free')}</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="sort_order">{t('admin.plans_sort_order')}</Label>
                <Input 
                  id="sort_order" 
                  type="number" 
                  placeholder={t('admin.plans_sort_order_placeholder')}
                  value={editingPlan?.sort_order || newPlan.sort_order || 1}
                  onChange={(e) => {
                    const sort_order = parseInt(e.target.value) || 1;
                    if (editingPlan) {
                      setEditingPlan({...editingPlan, sort_order});
                    } else {
                      setNewPlan({...newPlan, sort_order});
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('admin.plans_cancel')}
              </Button>
              <Button onClick={handleSavePlan}>
                {editingPlan ? t('admin.plans_update_plan') : t('admin.plans_create_plan')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`p-6 relative flex flex-col ${plan.is_active ? '' : 'opacity-60'}`}>
            {!plan.is_active && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">{t('admin.plans_inactive')}</Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getPlanIcon(plan.name)}
                <div>
                  <h3 className="text-lg font-semibold">{plan.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('admin.common_actions')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('admin.plans_edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('admin.plans_duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => togglePlanStatus(plan.id)}>
                    {plan.is_active ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        {t('admin.plans_deactivate')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t('admin.plans_activate')}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('admin.plans_delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4 min-h-[60px]">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-muted-foreground">
                  /{t('admin.plans_monthly').toLowerCase()}
                </span>
              </div>
              {plan.duration_days && (
                <p className="text-sm text-muted-foreground">
                  {plan.duration_days} {t('admin.plans_days_duration')}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.plans_max_devices_label')}</span>
                <span className="font-medium">{plan.max_devices}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.plans_video_quality_label')}</span>
                <span className="font-medium">{plan.video_quality}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.plans_downloadable_label')}</span>
                <span className="font-medium">
                  {plan.downloadable_content ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.plans_certificates_label')}</span>
                <span className="font-medium">
                  {plan.certificates ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.plans_priority_label')}</span>
                <span className="font-medium">
                  {plan.priority_support ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.plans_ad_free_label')}</span>
                <span className="font-medium">
                  {plan.ad_free ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <div className="border-t mb-4"></div>
              <h4 className="font-medium text-sm mb-2">{t('admin.plans_features_label')}</h4>
              <ul className="space-y-1">
                {plan.features && plan.features.length > 0 ? (
                  plan.features.map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">{t('admin.common_no_data')}</li>
                )}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.plans_total_plans')}</p>
              <p className="text-2xl font-bold">{plans.length}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.plans_active_plans')}</p>
              <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.plans_avg_price')}</p>
              <p className="text-2xl font-bold">
                ${(plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.plans_premium_features')}</p>
              <p className="text-2xl font-bold">
                {plans.filter(p => p.downloadable_content || p.certificates || p.priority_support).length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
