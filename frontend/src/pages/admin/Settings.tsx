import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  RefreshCw, 
  Settings as SettingsIcon,
  Home,
  Globe,
  FileText,
  Mail,
  Phone,
  Users,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi, SiteSetting, SettingsUpdateRequest } from '@/services/settingsApi';
import { faqApi, Faq, FaqCreateRequest, FaqUpdateRequest } from '@/services/faqApi';
import { feedbackApi, Feedback } from '@/services/feedbackApi';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HeroBackgroundSelector from '@/components/admin/HeroBackgroundSelector';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, SiteSetting[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [selectedHeroBackgrounds, setSelectedHeroBackgrounds] = useState<any[]>([]);
  
  // FAQ Management State
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqCategories, setFaqCategories] = useState<string[]>(['general', 'subscription', 'technical', 'content', 'billing']);
  const [faqLoading, setFaqLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [faqFormData, setFaqFormData] = useState<FaqCreateRequest>({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_active: true
  });

  // Testimonial Management State (using Feedback)
  const [testimonials, setTestimonials] = useState<Feedback[]>([]);
  const [testimonialLoading, setTestimonialLoading] = useState(true);
  const [testimonialSearch, setTestimonialSearch] = useState('');
  const [testimonialFilter, setTestimonialFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedHomepageTestimonials, setSelectedHomepageTestimonials] = useState<number[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchFaqs();
    fetchFaqCategories();
    fetchTestimonials();
  }, []);

  useEffect(() => {
    // Load existing hero background images when settings are loaded
    if (settings.hero) {
      const heroBackgroundImagesSetting = settings.hero.find(s => s.key === 'hero_background_images');
      if (heroBackgroundImagesSetting && heroBackgroundImagesSetting.value) {
        try {
          const parsedBackgrounds = JSON.parse(heroBackgroundImagesSetting.value);
          setSelectedHeroBackgrounds(parsedBackgrounds);
        } catch (error) {
          console.error('Error parsing hero background images:', error);
        }
      }
    }

    // Load selected testimonials for homepage
    if (settings.testimonial) {
      const selectedTestimonialsSetting = settings.testimonial.find(s => s.key === 'homepage_testimonial_ids');
      if (selectedTestimonialsSetting && selectedTestimonialsSetting.value) {
        try {
          const parsedIds = JSON.parse(selectedTestimonialsSetting.value);
          setSelectedHomepageTestimonials(parsedIds);
        } catch (error) {
          console.error('Error parsing homepage testimonials:', error);
        }
      }
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAll();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (groupName: string) => {
    try {
      setSaving(true);
      const groupSettings = settings[groupName] || [];
      
      const updateData: SettingsUpdateRequest[] = groupSettings.map(setting => ({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        group: setting.group,
        label: setting.label,
        description: setting.description,
      }));

      const response = await settingsApi.bulkUpdate(updateData);
      if (response.success) {
        toast.success(`${groupName} settings updated successfully`);
        await fetchSettings(); // Refresh to get updated data
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (groupName: string, settingKey: string, newValue: string) => {
    setSettings(prev => ({
      ...prev,
      [groupName]: prev[groupName]?.map(setting => 
        setting.key === settingKey 
          ? { ...setting, value: newValue }
          : setting
      ) || []
    }));
  };

  const handleHeroBackgroundsChange = (backgrounds: any[]) => {
    setSelectedHeroBackgrounds(backgrounds);
    
    // Update the hero background images setting
    const backgroundImagesValue = JSON.stringify(backgrounds.map(bg => ({
      url: bg.image_path,
      alt: bg.name,
      rotation: 0,
      x: 0,
      y: 0
    })));
    
    updateSetting('hero', 'hero_background_images', backgroundImagesValue);
  };

  // FAQ Management Functions
  const fetchFaqs = async () => {
    try {
      setFaqLoading(true);
      if (user) {
        const response = await faqApi.getAdminFaqs();
        const allFaqs: Faq[] = [];
        Object.values(response.data).forEach(categoryFaqs => {
          allFaqs.push(...categoryFaqs);
        });
        setFaqs(allFaqs.sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const fetchFaqCategories = async () => {
    try {
      const response = await faqApi.getCategories();
      if (response.success) {
        setFaqCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      setTestimonialLoading(true);
      const response = await feedbackApi.getAll({ type: 'general_feedback' });
      if (response.success) {
        setTestimonials(response.data?.data || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to fetch testimonials');
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleToggleTestimonialApproval = async (testimonial: Feedback) => {
    try {
      const newStatus = testimonial.status === 'resolved' ? 'reviewed' : 'resolved';
      await feedbackApi.update(testimonial.id, { status: newStatus });
      toast.success(`Testimonial ${newStatus === 'resolved' ? 'approved' : 'unapproved'} successfully`);
      await fetchTestimonials();
    } catch (error) {
      console.error('Error toggling testimonial approval:', error);
      toast.error('Failed to toggle approval');
    }
  };

  const handleToggleTestimonialFeatured = async (testimonial: Feedback) => {
    try {
      const newPriority = testimonial.priority === 'high' ? 'medium' : 'high';
      await feedbackApi.update(testimonial.id, { priority: newPriority });
      toast.success(`Testimonial ${newPriority === 'high' ? 'featured' : 'unfeatured'} successfully`);
      await fetchTestimonials();
    } catch (error) {
      console.error('Error toggling testimonial featured:', error);
      toast.error('Failed to toggle featured status');
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await feedbackApi.delete(id);
        toast.success('Testimonial deleted successfully');
        await fetchTestimonials();
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        toast.error('Failed to delete testimonial');
      }
    }
  };

  const handleToggleHomepageTestimonial = async (testimonialId: number) => {
    try {
      const updatedIds = selectedHomepageTestimonials.includes(testimonialId)
        ? selectedHomepageTestimonials.filter(id => id !== testimonialId)
        : [...selectedHomepageTestimonials, testimonialId];

      setSelectedHomepageTestimonials(updatedIds);

      // Save to settings
      const updateData: SettingsUpdateRequest[] = [{
        key: 'homepage_testimonial_ids',
        value: JSON.stringify(updatedIds),
        group: 'testimonial'
      }];

      await settingsApi.bulkUpdate(updateData);
      toast.success('Homepage testimonials updated');
    } catch (error) {
      console.error('Error updating homepage testimonials:', error);
      toast.error('Failed to update homepage testimonials');
    }
  };

  const handleCreateFaq = async () => {
    try {
      if (user) {
        await faqApi.createFaq(faqFormData);
        await fetchFaqs();
        setIsCreateDialogOpen(false);
        resetFaqForm();
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Failed to create FAQ');
    }
  };

  const handleUpdateFaq = async () => {
    try {
      if (user && editingFaq) {
        const updateData: FaqUpdateRequest = {
          question: faqFormData.question,
          answer: faqFormData.answer,
          category: faqFormData.category,
          sort_order: faqFormData.sort_order,
          is_active: faqFormData.is_active
        };
        await faqApi.updateFaq(editingFaq.id, updateData);
        await fetchFaqs();
        setIsEditDialogOpen(false);
        setEditingFaq(null);
        resetFaqForm();
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        if (user) {
          await faqApi.deleteFaq(id);
          await fetchFaqs();
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        toast.error('Failed to delete FAQ');
      }
    }
  };

  const handleToggleFaqStatus = async (faq: Faq) => {
    try {
      if (user) {
        const updateData: FaqUpdateRequest = {
          is_active: !faq.is_active
        };
        await faqApi.updateFaq(faq.id, updateData);
        await fetchFaqs();
      }
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
    }
  };

  const resetFaqForm = () => {
    setFaqFormData({
      question: '',
      answer: '',
      category: 'general',
      sort_order: 0,
      is_active: true
    });
  };

  const openEditDialog = (faq: Faq) => {
    setEditingFaq(faq);
    setFaqFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_active: faq.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    const categorySlug = newCategory.toLowerCase().replace(/\s+/g, '-');
    
    if (faqCategories.includes(categorySlug)) {
      toast.error('Category already exists');
      return;
    }

    try {
      setFaqCategories([...faqCategories, categorySlug]);
      setNewCategory('');
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category}"?`)) {
      return;
    }

    try {
      setFaqCategories(faqCategories.filter(cat => cat !== category));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleStartEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryValue(category);
  };

  const handleSaveEditCategory = (oldCategory: string) => {
    if (!editCategoryValue.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const newCategorySlug = editCategoryValue.toLowerCase().replace(/\s+/g, '-');
    
    if (faqCategories.includes(newCategorySlug) && newCategorySlug !== oldCategory) {
      toast.error('Category already exists');
      return;
    }

    try {
      setFaqCategories(faqCategories.map(cat => cat === oldCategory ? newCategorySlug : cat));
      setEditingCategory(null);
      setEditCategoryValue('');
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryValue('');
  };

  const renderSettingField = (setting: SiteSetting, groupName: string) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={setting.key}
              checked={setting.value === '1' || setting.value === 'true'}
              onChange={(e) => updateSetting(groupName, setting.key, e.target.checked ? '1' : '0')}
              className="rounded border-gray-300"
            />
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
            <Input
              id={setting.key}
              type="number"
              value={setting.value}
              onChange={(e) => updateSetting(groupName, setting.key, e.target.value)}
              className="w-full"
            />
            {setting.description && (
              <p className="text-xs text-gray-500">{setting.description}</p>
            )}
          </div>
        );
      
      default: // text
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
            {setting.key.includes('disclaimer') || setting.key.includes('description') ? (
              <Textarea
                id={setting.key}
                value={setting.value}
                onChange={(e) => updateSetting(groupName, setting.key, e.target.value)}
                className="w-full min-h-[100px]"
                placeholder={setting.description || ''}
              />
            ) : (
              <Input
                id={setting.key}
                value={setting.value}
                onChange={(e) => updateSetting(groupName, setting.key, e.target.value)}
                className="w-full"
                placeholder={setting.description || ''}
              />
            )}
            {setting.description && (
              <p className="text-xs text-gray-500">{setting.description}</p>
            )}
          </div>
        );
    }
  };

  const renderSettingsGroup = (groupName: string, groupSettings: SiteSetting[]) => {
    return (
      <div className="space-y-6">
        {groupSettings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            {renderSettingField(setting, groupName)}
          </div>
        ))}
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={() => handleSaveSettings(groupName)}
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save {groupName} Settings
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration</p>
        </div>
        <div className="text-center py-8">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration and content</p>
        </div>
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="hero" className="flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            About
          </TabsTrigger>
          <TabsTrigger value="testimonial" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Settings */}
        <TabsContent value="hero" className="mt-6">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Hero Section Settings</h2>
              {settings.hero ? renderSettingsGroup('hero', settings.hero.filter(setting => !setting.key.includes('hero_background_images'))) : (
                <p className="text-muted-foreground">No hero settings found.</p>
              )}
            </Card>
            
            <Card className="p-6">
              <HeroBackgroundSelector
                onBackgroundsChange={handleHeroBackgroundsChange}
                selectedBackgrounds={selectedHeroBackgrounds.map(bg => bg.id)}
                readOnly={true}
              />
            </Card>
          </div>
        </TabsContent>

        {/* About Section Settings */}
        <TabsContent value="about" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">About Section Settings</h2>
            {settings.about ? renderSettingsGroup('about', settings.about) : (
              <p className="text-muted-foreground">No about settings found.</p>
            )}
          </Card>
        </TabsContent>

        {/* Testimonial Section Settings */}
        <TabsContent value="testimonial" className="mt-6 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Testimonial Section Settings</h2>
            {settings.testimonial ? renderSettingsGroup('testimonial', settings.testimonial) : (
              <p className="text-muted-foreground">No testimonial settings found.</p>
            )}
          </Card>

          {/* All Reviews/Testimonials from Database */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">All Reviews</h2>
                <p className="text-muted-foreground">All testimonials from the database. Choose which ones to display on homepage.</p>
              </div>
            </div>

            {/* Selected Testimonials Info */}
            {selectedHomepageTestimonials.length > 0 && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {selectedHomepageTestimonials.length} review(s) selected for homepage
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only approved reviews can be selected. Click reviews to toggle selection.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setSelectedHomepageTestimonials([]);
                      // Save empty array to settings
                      try {
                        const updateData: SettingsUpdateRequest[] = [{
                          key: 'homepage_testimonial_ids',
                          value: JSON.stringify([]),
                          group: 'testimonial'
                        }];
                        await settingsApi.bulkUpdate(updateData);
                        toast.success('Homepage reviews cleared');
                      } catch (error) {
                        console.error('Error clearing homepage reviews:', error);
                        toast.error('Failed to clear homepage reviews');
                      }
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search reviews..."
                value={testimonialSearch}
                onChange={(e) => setTestimonialSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={testimonialFilter} onValueChange={(value) => setTestimonialFilter(value as 'all' | 'approved' | 'pending')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="approved">Approved Only</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Testimonials List */}
            {testimonialLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading reviews...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testimonials
                  .filter(t => {
                    if (testimonialSearch) {
                      const search = testimonialSearch.toLowerCase();
                      return (t.user?.name || '').toLowerCase().includes(search) || 
                             t.description.toLowerCase().includes(search) ||
                             (t.user?.email || '').toLowerCase().includes(search);
                    }
                    if (testimonialFilter === 'approved') return t.status === 'resolved';
                    if (testimonialFilter === 'pending') return t.status !== 'resolved';
                    return true;
                  })
                  .map((testimonial) => (
                    <div 
                      key={testimonial.id} 
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        selectedHomepageTestimonials.includes(testimonial.id) 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => testimonial.status === 'resolved' && handleToggleHomepageTestimonial(testimonial.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{testimonial.user?.name || 'Anonymous'}</h4>
                            {selectedHomepageTestimonials.includes(testimonial.id) && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Show on Homepage</Badge>
                            )}
                            {testimonial.status !== 'resolved' && (
                              <Badge variant="secondary">Pending Approval</Badge>
                            )}
                            {testimonial.priority === 'high' && (
                              <Badge variant="default">Featured</Badge>
                            )}
                          </div>
                          {testimonial.user?.email && (
                            <p className="text-sm text-muted-foreground">
                              {testimonial.user.email}
                            </p>
                          )}
                          <p className="text-sm mt-2">{testimonial.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Rating: {testimonial.rating || 'N/A'}/5</span>
                            <span>Status: {testimonial.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleTestimonialApproval(testimonial)}
                          >
                            {testimonial.status === 'resolved' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant={testimonial.priority === 'high' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleTestimonialFeatured(testimonial)}
                          >
                            Star
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTestimonial(testimonial.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {testimonials.filter(t => {
                  if (testimonialSearch) {
                    const search = testimonialSearch.toLowerCase();
                    return (t.user?.name || '').toLowerCase().includes(search) || 
                           t.description.toLowerCase().includes(search) ||
                           (t.user?.email || '').toLowerCase().includes(search);
                  }
                  if (testimonialFilter === 'approved') return t.status === 'resolved';
                  if (testimonialFilter === 'pending') return t.status !== 'resolved';
                  return true;
                }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reviews found.
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* FAQ Management */}
        <TabsContent value="faq" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">FAQ Management</h2>
              <p className="text-muted-foreground">Manage frequently asked questions and categories</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* FAQ List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">FAQs</h3>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetFaqForm()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add FAQ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New FAQ</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="question">Question</Label>
                        <Input
                          id="question"
                          value={faqFormData.question}
                          onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                          placeholder="Enter the question"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea
                          id="answer"
                          value={faqFormData.answer}
                          onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                          placeholder="Enter the answer"
                          rows={4}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={faqFormData.category} onValueChange={(value) => setFaqFormData({ ...faqFormData, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {faqCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sort_order">Sort Order</Label>
                        <Input
                          id="sort_order"
                          type="number"
                          value={faqFormData.sort_order}
                          onChange={(e) => setFaqFormData({ ...faqFormData, sort_order: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateFaq}>
                          Create FAQ
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {faqLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {faqs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No FAQs found. Add your first FAQ.</p>
                  ) : (
                    faqs.map((faq) => (
                      <Card key={faq.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{faq.question}</h4>
                              <Badge variant={faq.is_active ? "default" : "secondary"}>
                                {faq.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{faq.answer}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Category: {faq.category}</span>
                              <span>Order: {faq.sort_order}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleFaqStatus(faq)}
                            >
                              {faq.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Category Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Categories</h3>
              <Card className="p-6">
                <div className="space-y-6">
                  {/* Add New Category */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter new category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Existing Categories
                    </h4>
                    <div className="space-y-2">
                      {faqCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          {editingCategory === category ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editCategoryValue}
                                onChange={(e) => setEditCategoryValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEditCategory(category)}
                                className="flex-1"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveEditCategory(category)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditCategory}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium capitalize">{category}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartEditCategory(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {faqCategories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No categories available. Add your first category above.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit FAQ</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-question">Question</Label>
                  <Input
                    id="edit-question"
                    value={faqFormData.question}
                    onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    placeholder="Enter the question"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-answer">Answer</Label>
                  <Textarea
                    id="edit-answer"
                    value={faqFormData.answer}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    placeholder="Enter the answer"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={faqFormData.category} onValueChange={(value) => setFaqFormData({ ...faqFormData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {faqCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sort_order">Sort Order</Label>
                  <Input
                    id="edit-sort_order"
                    type="number"
                    value={faqFormData.sort_order}
                    onChange={(e) => setFaqFormData({ ...faqFormData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is_active"
                    checked={faqFormData.is_active}
                    onChange={(e) => setFaqFormData({ ...faqFormData, is_active: e.target.checked })}
                  />
                  <Label htmlFor="edit-is_active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFaq}>
                    <Save className="mr-2 h-4 w-4" />
                    Update FAQ
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">General Settings</h2>
            {settings.general ? renderSettingsGroup('general', settings.general) : (
              <p className="text-muted-foreground">No general settings found.</p>
            )}
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Footer Settings</h2>
            {settings.footer ? renderSettingsGroup('footer', settings.footer) : (
              <p className="text-muted-foreground">No footer settings found.</p>
            )}
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Settings</h2>
            <div className="space-y-6">
              {/* Show contact-related settings from general group */}
              {settings.general?.filter(s => s.key.includes('contact') || s.key.includes('email') || s.key.includes('phone')).map((setting) => (
                <div key={setting.id} className="space-y-2">
                  {renderSettingField(setting, 'general')}
                </div>
              ))}
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSettings('general')}
                  disabled={saving}
                  className="flex items-center"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Contact Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;