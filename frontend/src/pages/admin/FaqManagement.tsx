import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  Folder,
  List,
  Languages
} from 'lucide-react';
import { faqApi, Faq, FaqCreateRequest, FaqUpdateRequest } from '@/services/faqApi';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/hooks/useLocale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const FaqManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale: urlLocale } = useLocale();
  const [contentLocale, setContentLocale] = useState<'en' | 'es' | 'pt'>(urlLocale as 'en' | 'es' | 'pt' || 'en');
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<string[]>(['general', 'subscription', 'technical', 'content', 'billing']);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [activeTab, setActiveTab] = useState('faqs');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [formData, setFormData] = useState<FaqCreateRequest>({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, [contentLocale]); // Refetch when content locale changes

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      console.log('Fetching FAQs - User:', user);
      
      if (user) {
        // Temporarily set locale in localStorage to fetch localized content
        const originalLocale = localStorage.getItem('i18nextLng');
        localStorage.setItem('i18nextLng', contentLocale);
        
        const response = await faqApi.getAdminFaqs();
        console.log('FAQ API Response:', response);
        
        // Restore original locale
        if (originalLocale) {
          localStorage.setItem('i18nextLng', originalLocale);
        }
        
        // Flatten the grouped FAQs into a single array
        const allFaqs: Faq[] = [];
        Object.values(response.data).forEach(categoryFaqs => {
          allFaqs.push(...categoryFaqs);
        });
        console.log('Flattened FAQs:', allFaqs);
        setFaqs(allFaqs.sort((a, b) => a.sort_order - b.sort_order));
      } else {
        console.error('No user token available');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await faqApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateFaq = async () => {
    try {
      if (user) {
        // Temporarily set locale in localStorage to save with correct locale
        const originalLocale = localStorage.getItem('i18nextLng');
        localStorage.setItem('i18nextLng', contentLocale);
        
        await faqApi.createFaq(formData);
        
        // Restore original locale
        if (originalLocale) {
          localStorage.setItem('i18nextLng', originalLocale);
        }
        
        await fetchFaqs();
        setIsCreateDialogOpen(false);
        resetForm();
        toast.success(`FAQ created successfully in ${contentLocale.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Failed to create FAQ');
    }
  };

  const handleUpdateFaq = async () => {
    try {
      if (user && editingFaq) {
        // Temporarily set locale in localStorage to save with correct locale
        const originalLocale = localStorage.getItem('i18nextLng');
        localStorage.setItem('i18nextLng', contentLocale);
        
        const updateData: FaqUpdateRequest = {
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        };
        await faqApi.updateFaq(editingFaq.id, updateData);
        
        // Restore original locale
        if (originalLocale) {
          localStorage.setItem('i18nextLng', originalLocale);
        }
        
        await fetchFaqs();
        setIsEditDialogOpen(false);
        setEditingFaq(null);
        resetForm();
        toast.success(`FAQ updated successfully in ${contentLocale.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (window.confirm(t('admin.faq_delete_confirm'))) {
      try {
      if (user) {
        await faqApi.deleteFaq(id);
          await fetchFaqs();
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
      }
    }
  };

  const handleToggleStatus = async (faq: Faq) => {
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

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      sort_order: 0,
      is_active: true
    });
  };

  const openEditDialog = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_active: faq.is_active
    });
    setIsEditDialogOpen(true);
  };

  // Category Management Functions
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error(t('admin.faq_enter_category'));
      return;
    }
    
    const categorySlug = newCategory.toLowerCase().replace(/\s+/g, '-');
    
    if (categories.includes(categorySlug)) {
      toast.error(t('admin.faq_category_exists'));
      return;
    }

    try {
      setCategories([...categories, categorySlug]);
      setNewCategory('');
      toast.success(t('admin.faq_category_added'));
    } catch (error) {
      toast.error(t('admin.common_error'));
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!window.confirm(t('admin.faq_delete_category_confirm', { category }))) {
      return;
    }

    try {
      setCategories(categories.filter(cat => cat !== category));
      toast.success(t('admin.faq_category_deleted'));
    } catch (error) {
      toast.error(t('admin.common_error'));
    }
  };

  const handleStartEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryValue(category);
  };

  const handleSaveEditCategory = (oldCategory: string) => {
    if (!editCategoryValue.trim()) {
      toast.error(t('admin.faq_enter_category'));
      return;
    }

    const newCategorySlug = editCategoryValue.toLowerCase().replace(/\s+/g, '-');
    
    if (categories.includes(newCategorySlug) && newCategorySlug !== oldCategory) {
      toast.error(t('admin.faq_category_exists'));
      return;
    }

    try {
      setCategories(categories.map(cat => cat === oldCategory ? newCategorySlug : cat));
      setEditingCategory(null);
      setEditCategoryValue('');
      toast.success(t('admin.faq_category_updated'));
    } catch (error) {
      toast.error(t('admin.common_error'));
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryValue('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.faq_management')}</h1>
          <p className="text-muted-foreground">{t('admin.faq_manage_questions')}</p>
        </div>
        <div className="flex items-center gap-2 border rounded-lg p-1">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={contentLocale === 'en' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setContentLocale('en')}
            className="h-8"
          >
            EN
          </Button>
          <Button
            variant={contentLocale === 'es' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setContentLocale('es')}
            className="h-8"
          >
            ES
          </Button>
          <Button
            variant={contentLocale === 'pt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setContentLocale('pt')}
            className="h-8"
          >
            PT
          </Button>
        </div>
      </div>

      {/* Language Notice */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Editing FAQs in: {contentLocale.toUpperCase()}</strong> - Questions and answers will be saved in the selected language. The system will automatically translate to other languages.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="faqs" className="flex items-center">
            <List className="mr-2 h-4 w-4" />
            {t('admin.faq_tab_faqs')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <Folder className="mr-2 h-4 w-4" />
            {t('admin.faq_tab_categories')}
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <div className="flex items-center justify-end">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('admin.faq_add')}
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.faq_create_new')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="question">{t('admin.faq_question')}</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder={t('admin.faq_placeholder_question')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="answer">{t('admin.faq_answer')}</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder={t('admin.faq_placeholder_answer')}
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">{t('admin.faq_category')}</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.faq_placeholder_category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort_order">{t('admin.faq_label_sort_order')}</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">{t('admin.faq_active')}</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('admin.common_cancel')}
                </Button>
                <Button onClick={handleCreateFaq}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('admin.faq_create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* FAQs List */}
      <div className="grid gap-4">
        {faqs.length === 0 && !loading ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">{t('admin.faq_no_found')}</h3>
            <p className="text-muted-foreground mb-4">
              {user ? 
                t('admin.faq_no_available') :
                t('admin.faq_auth_required')
              }
            </p>
            {!user && (
              <p className="text-sm text-red-500">
                {t('admin.faq_check_auth')}
              </p>
            )}
          </Card>
        ) : (
          faqs.map((faq) => (
          <Card key={faq.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{faq.question}</h3>
                  <Badge variant={faq.is_active ? "default" : "secondary"}>
                    {faq.is_active ? t('admin.faq_active') : t('admin.faq_inactive')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {faq.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">{faq.answer}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{t('admin.faq_sort_order')} {faq.sort_order}</span>
                  <span>{t('admin.faq_created')} {new Date(faq.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(faq)}
                  title={faq.is_active ? t('admin.faq_deactivate') : t('admin.faq_activate')}
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">{t('admin.faq_category_management')}</h2>
            <div className="space-y-6">
              {/* Add New Category */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('admin.faq_placeholder_new_category')}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1"
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.faq_add_category')}
                </Button>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {t('admin.faq_existing_categories')}
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
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

              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.faq_no_categories')}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.faq_edit_title')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-question">{t('admin.faq_question')}</Label>
              <Input
                id="edit-question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder={t('admin.faq_placeholder_question')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-answer">{t('admin.faq_answer')}</Label>
              <Textarea
                id="edit-answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder={t('admin.faq_placeholder_answer')}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">{t('admin.faq_category')}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.faq_placeholder_category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sort_order">{t('admin.faq_label_sort_order')}</Label>
              <Input
                id="edit-sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="edit-is_active">{t('admin.faq_active')}</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('admin.common_cancel')}
              </Button>
              <Button onClick={handleUpdateFaq}>
                <Save className="mr-2 h-4 w-4" />
                {t('admin.common_save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaqManagement;
