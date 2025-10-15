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
import { generateMockPlans, MockSubscriptionPlan } from '@/services/mockData';
import { toast } from 'sonner';

const SubscriptionPlans = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MockSubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<MockSubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlan, setNewPlan] = useState<Partial<MockSubscriptionPlan>>({
    name: 'freemium',
    displayName: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    duration: 30,
    features: [],
    maxDevices: 1,
    videoQuality: 'SD',
    downloadableContent: false,
    certificates: false,
    prioritySupport: false,
    adFree: false,
    isActive: true,
    sortOrder: 1
  });

  useEffect(() => {
    // Simulate API call
    const fetchPlans = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockPlans = generateMockPlans();
      setPlans(mockPlans);
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

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

  const togglePlanStatus = (planId: number) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, isActive: !plan.isActive }
        : plan
    ));
    toast.success("Plan status updated");
  };

  const handleEditPlan = (plan: MockSubscriptionPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      setPlans(prev => prev.map(plan => 
        plan.id === editingPlan.id ? editingPlan : plan
      ));
      toast.success("Plan updated successfully");
    } else {
      // Create new plan
      const newPlanData = {
        ...newPlan,
        id: Math.max(...plans.map(p => p.id)) + 1,
        features: newPlan.features || []
      } as MockSubscriptionPlan;
      setPlans(prev => [...prev, newPlanData]);
      toast.success("Plan created successfully");
    }
    setIsDialogOpen(false);
    setEditingPlan(null);
    setNewPlan({
      name: 'freemium',
      displayName: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      duration: 30,
      features: [],
      maxDevices: 1,
      videoQuality: 'SD',
      downloadableContent: false,
      certificates: false,
      prioritySupport: false,
      adFree: false,
      isActive: true,
      sortOrder: 1
    });
  };

  const handleDeletePlan = (planId: number) => {
    setPlans(prev => prev.filter(plan => plan.id !== planId));
    toast.success("Plan deleted successfully");
  };

  const handleDuplicatePlan = (plan: MockSubscriptionPlan) => {
    const duplicatedPlan = {
      ...plan,
      id: Math.max(...plans.map(p => p.id)) + 1,
      displayName: `${plan.displayName} (Copy)`,
      name: `${plan.name}_copy`
    };
    setPlans(prev => [...prev, duplicatedPlan]);
    toast.success("Plan duplicated successfully");
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
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Loading plans...</p>
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
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage your subscription plans and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </DialogTitle>
              <DialogDescription>
                Configure your subscription plan details and features.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
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
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    placeholder="e.g., Premium Plan"
                    value={editingPlan?.displayName || newPlan.displayName}
                    onChange={(e) => {
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, displayName: e.target.value});
                      } else {
                        setNewPlan({...newPlan, displayName: e.target.value});
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Plan description..."
                  value={editingPlan?.description || newPlan.description}
                  onChange={(e) => {
                    if (editingPlan) {
                      setEditingPlan({...editingPlan, description: e.target.value});
                    } else {
                      setNewPlan({...newPlan, description: e.target.value});
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    placeholder="19.99"
                    value={editingPlan?.price || newPlan.price}
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
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select 
                    value={editingPlan?.billingCycle || newPlan.billingCycle} 
                    onValueChange={(value: 'monthly' | 'yearly') => {
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, billingCycle: value});
                      } else {
                        setNewPlan({...newPlan, billingCycle: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    placeholder="30"
                    value={editingPlan?.duration || newPlan.duration}
                    onChange={(e) => {
                      const duration = parseInt(e.target.value) || null;
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, duration});
                      } else {
                        setNewPlan({...newPlan, duration});
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDevices">Max Devices</Label>
                  <Input 
                    id="maxDevices" 
                    type="number" 
                    placeholder="3"
                    value={editingPlan?.maxDevices || newPlan.maxDevices}
                    onChange={(e) => {
                      const maxDevices = parseInt(e.target.value) || 1;
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, maxDevices});
                      } else {
                        setNewPlan({...newPlan, maxDevices});
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="videoQuality">Video Quality</Label>
                  <Select 
                    value={editingPlan?.videoQuality || newPlan.videoQuality} 
                    onValueChange={(value: 'SD' | 'HD' | '4K') => {
                      if (editingPlan) {
                        setEditingPlan({...editingPlan, videoQuality: value});
                      } else {
                        setNewPlan({...newPlan, videoQuality: value});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SD">SD</SelectItem>
                      <SelectItem value="HD">HD</SelectItem>
                      <SelectItem value="4K">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="downloadableContent"
                      checked={editingPlan?.downloadableContent || newPlan.downloadableContent}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, downloadableContent: checked});
                        } else {
                          setNewPlan({...newPlan, downloadableContent: checked});
                        }
                      }}
                    />
                    <Label htmlFor="downloadableContent">Downloadable Content</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="certificates"
                      checked={editingPlan?.certificates || newPlan.certificates}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, certificates: checked});
                        } else {
                          setNewPlan({...newPlan, certificates: checked});
                        }
                      }}
                    />
                    <Label htmlFor="certificates">Certificates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="prioritySupport"
                      checked={editingPlan?.prioritySupport || newPlan.prioritySupport}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, prioritySupport: checked});
                        } else {
                          setNewPlan({...newPlan, prioritySupport: checked});
                        }
                      }}
                    />
                    <Label htmlFor="prioritySupport">Priority Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="adFree"
                      checked={editingPlan?.adFree || newPlan.adFree}
                      onCheckedChange={(checked) => {
                        if (editingPlan) {
                          setEditingPlan({...editingPlan, adFree: checked});
                        } else {
                          setNewPlan({...newPlan, adFree: checked});
                        }
                      }}
                    />
                    <Label htmlFor="adFree">Ad-Free Experience</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input 
                  id="sortOrder" 
                  type="number" 
                  placeholder="1"
                  value={editingPlan?.sortOrder || newPlan.sortOrder}
                  onChange={(e) => {
                    const sortOrder = parseInt(e.target.value) || 1;
                    if (editingPlan) {
                      setEditingPlan({...editingPlan, sortOrder});
                    } else {
                      setNewPlan({...newPlan, sortOrder});
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`p-6 relative ${plan.isActive ? '' : 'opacity-60'}`}>
            {!plan.isActive && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Inactive</Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getPlanIcon(plan.name)}
                <div>
                  <h3 className="text-lg font-semibold">{plan.displayName}</h3>
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
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => togglePlanStatus(plan.id)}>
                    {plan.isActive ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-muted-foreground">
                  /{plan.billingCycle}
                </span>
              </div>
              {plan.duration && (
                <p className="text-sm text-muted-foreground">
                  {plan.duration} days duration
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span>Max Devices:</span>
                <span className="font-medium">{plan.maxDevices}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Video Quality:</span>
                <span className="font-medium">{plan.videoQuality}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Downloadable Content:</span>
                <span className="font-medium">
                  {plan.downloadableContent ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificates:</span>
                <span className="font-medium">
                  {plan.certificates ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Priority Support:</span>
                <span className="font-medium">
                  {plan.prioritySupport ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Ad-Free:</span>
                <span className="font-medium">
                  {plan.adFree ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Features:</h4>
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
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
              <p className="text-sm text-muted-foreground">Total Plans</p>
              <p className="text-2xl font-bold">{plans.length}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Plans</p>
              <p className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Price</p>
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
              <p className="text-sm text-muted-foreground">Premium Features</p>
              <p className="text-2xl font-bold">
                {plans.filter(p => p.downloadableContent || p.certificates || p.prioritySupport).length}
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
