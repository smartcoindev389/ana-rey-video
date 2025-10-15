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

const CouponsDiscounts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Mock data - replace with real API calls
  const [coupons, setCoupons] = useState([
    {
      id: 1,
      code: 'WELCOME20',
      name: 'Welcome Discount',
      description: '20% off for new users',
      type: 'percentage',
      value: 20,
      minAmount: 0,
      maxDiscount: 50,
      usageLimit: 100,
      usedCount: 45,
      applicablePlans: ['basic', 'premium'],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      code: 'SAVE10',
      name: 'Fixed Discount',
      description: '$10 off any plan',
      type: 'fixed',
      value: 10,
      minAmount: 20,
      maxDiscount: 10,
      usageLimit: 50,
      usedCount: 23,
      applicablePlans: ['basic', 'premium'],
      startDate: '2024-01-15',
      endDate: '2024-06-15',
      isActive: true,
      createdAt: '2024-01-15'
    },
    {
      id: 3,
      code: 'STUDENT50',
      name: 'Student Scholarship',
      description: '50% off for students',
      type: 'percentage',
      value: 50,
      minAmount: 0,
      maxDiscount: 100,
      usageLimit: 25,
      usedCount: 25,
      applicablePlans: ['basic', 'premium'],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: false,
      createdAt: '2024-01-01'
    },
    {
      id: 4,
      code: 'EARLYBIRD',
      name: 'Early Bird Special',
      description: '30% off for early subscribers',
      type: 'percentage',
      value: 30,
      minAmount: 0,
      maxDiscount: 30,
      usageLimit: 200,
      usedCount: 156,
      applicablePlans: ['premium'],
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      isActive: true,
      createdAt: '2024-01-01'
    }
  ]);

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

  const getDiscountDisplay = (coupon: any) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% off`;
    } else {
      return `$${coupon.value} off`;
    }
  };

  const getStatusBadge = (isActive: boolean, endDate: string) => {
    const isExpired = new Date(endDate) < new Date();
    
    if (isExpired) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    
    return isActive ? (
      <Badge variant="default">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const toggleCouponStatus = (couponId: number) => {
    setCoupons(coupons.map(coupon => 
      coupon.id === couponId 
        ? { ...coupon, isActive: !coupon.isActive }
        : coupon
    ));
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = () => {
    // Handle save logic here
    setIsDialogOpen(false);
    setEditingCoupon(null);
  };

  const stats = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter(c => c.isActive).length,
    totalUsage: coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0),
    totalSavings: coupons.reduce((sum, coupon) => {
      if (coupon.type === 'percentage') {
        return sum + (coupon.usedCount * (coupon.maxDiscount || 0));
      } else {
        return sum + (coupon.usedCount * coupon.value);
      }
    }, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons & Discounts</h1>
          <p className="text-muted-foreground">Manage discount codes and promotional offers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
              <DialogDescription>
                Configure your discount coupon details and restrictions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input id="code" placeholder="e.g., WELCOME20" />
                </div>
                <div>
                  <Label htmlFor="name">Coupon Name</Label>
                  <Input id="name" placeholder="e.g., Welcome Discount" />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Coupon description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Discount Type</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="value">Discount Value</Label>
                  <Input id="value" type="number" step="0.01" placeholder="20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Minimum Amount</Label>
                  <Input id="minAmount" type="number" step="0.01" placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="maxDiscount">Max Discount</Label>
                  <Input id="maxDiscount" type="number" step="0.01" placeholder="50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input id="usageLimit" type="number" placeholder="100" />
                </div>
                <div>
                  <Label htmlFor="applicablePlans">Applicable Plans</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="freemium" />
                      <Label htmlFor="freemium">Freemium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="basic" />
                      <Label htmlFor="basic">Basic</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="premium" />
                      <Label htmlFor="premium">Premium</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCoupon}>
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Coupons</p>
              <p className="text-2xl font-bold">{stats.totalCoupons}</p>
            </div>
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
              <p className="text-2xl font-bold">{stats.activeCoupons}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Usage</p>
              <p className="text-2xl font-bold">{stats.totalUsage}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
              <p className="text-2xl font-bold">${stats.totalSavings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className={`p-6 relative ${coupon.isActive ? '' : 'opacity-60'}`}>
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copyCouponCode(coupon.code)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Coupon
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleCouponStatus(coupon.id)}>
                    {coupon.isActive ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{getDiscountDisplay(coupon)}</span>
                {getStatusBadge(coupon.isActive, coupon.endDate)}
              </div>
              <div className="mt-2">
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {coupon.code}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span>Usage:</span>
                <span className="font-medium">
                  {coupon.usedCount} / {coupon.usageLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Valid:</span>
                <span className="font-medium">
                  {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Min Amount:</span>
                <span className="font-medium">
                  ${coupon.minAmount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Max Discount:</span>
                <span className="font-medium">
                  ${coupon.maxDiscount}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Applicable Plans:</h4>
              <div className="flex flex-wrap gap-1">
                {coupon.applicablePlans.map((plan, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {plan}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CouponsDiscounts;
