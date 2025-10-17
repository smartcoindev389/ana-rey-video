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
  X
} from 'lucide-react';
import { faqApi, Faq, FaqCreateRequest, FaqUpdateRequest } from '@/services/faqApi';
import { useAuth } from '@/contexts/AuthContext';

const FaqManagement = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState<FaqCreateRequest>({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      console.log('Fetching FAQs - User:', user);
      
      if (user) {
        const response = await faqApi.getAdminFaqs();
        console.log('FAQ API Response:', response);
        
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

  const handleCreateFaq = async () => {
    try {
      if (user) {
        await faqApi.createFaq(formData);
        await fetchFaqs();
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
    }
  };

  const handleUpdateFaq = async () => {
    try {
      if (user && editingFaq) {
        const updateData: FaqUpdateRequest = {
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          sort_order: formData.sort_order,
          is_active: formData.is_active
        };
        await faqApi.updateFaq(editingFaq.id, updateData);
        await fetchFaqs();
        setIsEditDialogOpen(false);
        setEditingFaq(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
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

  const categories = ['account', 'billing', 'technical', 'content', 'plans', 'general'];

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
          <h1 className="text-3xl font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions and answers</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
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
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the question"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the answer"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="sort_order">Sort Order</Label>
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
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFaq}>
                  <Save className="mr-2 h-4 w-4" />
                  Create FAQ
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
            <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
            <p className="text-muted-foreground mb-4">
              {user ? 
                "No FAQs are currently available. Create your first FAQ using the button above." :
                "Authentication required to view FAQs."
              }
            </p>
            {!user && (
              <p className="text-sm text-red-500">
                Please check your authentication status.
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
                    {faq.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {faq.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">{faq.answer}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Sort Order: {faq.sort_order}</span>
                  <span>Created: {new Date(faq.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(faq)}
                  title={faq.is_active ? "Deactivate" : "Activate"}
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
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea
                id="edit-answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="edit-sort_order">Sort Order</Label>
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
    </div>
  );
};

export default FaqManagement;
