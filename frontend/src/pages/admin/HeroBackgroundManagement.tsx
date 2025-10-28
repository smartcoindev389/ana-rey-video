import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Image as ImageIcon,
  Upload,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/admin/FileUpload';

interface HeroBackground {
  id: number;
  name: string;
  description?: string;
  image_path: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

const HeroBackgroundManagement = () => {
  const { user } = useAuth();
  
  const [backgrounds, setBackgrounds] = useState<HeroBackground[]>([]);
  const [filteredBackgrounds, setFilteredBackgrounds] = useState<HeroBackground[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBackground, setSelectedBackground] = useState<HeroBackground | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  useEffect(() => {
    // Filter backgrounds
    const filtered = backgrounds.filter(bg => 
      bg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bg.description && bg.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBackgrounds(filtered);
  }, [backgrounds, searchTerm]);

  const fetchBackgrounds = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/hero-backgrounds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setBackgrounds(result.data?.data || result.data || []);
      } else {
        throw new Error('Failed to fetch backgrounds');
      }
    } catch (error: any) {
      console.error('Error fetching backgrounds:', error);
      toast.error(`Failed to load backgrounds: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBackground = () => {
    setSelectedBackground({
      id: 0,
      name: '',
      description: '',
      image_path: '',
      image_url: '',
      is_active: true,
      sort_order: 0,
      metadata: {},
      created_at: '',
      updated_at: '',
    });
    setSelectedImageFile(null);
    setIsDialogOpen(true);
  };

  const handleEditBackground = (background: HeroBackground) => {
    setSelectedBackground({ ...background });
    setSelectedImageFile(null);
    setIsDialogOpen(true);
  };

  const handleSaveBackground = async () => {
    if (!selectedBackground) return;

    // Validate required fields
    if (!selectedBackground.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    
    if (!selectedBackground.id && !selectedImageFile) {
      toast.error("Image file is required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare form data for file upload
      const formData = new FormData();
      
      // Add background data to form data
      Object.keys(selectedBackground).forEach(key => {
        if (key !== 'id' && selectedBackground[key] !== null && selectedBackground[key] !== undefined) {
          if (typeof selectedBackground[key] === 'object') {
            formData.append(key, JSON.stringify(selectedBackground[key]));
          } else {
            formData.append(key, selectedBackground[key].toString());
          }
        }
      });

      // Add image file if selected
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      
      const token = localStorage.getItem('auth_token');
      
      if (selectedBackground.id) {
        // Update existing background
        const response = await fetch(`/api/admin/hero-backgrounds/${selectedBackground.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success) {
          setBackgrounds(prev => prev.map(bg => bg.id === selectedBackground.id ? result.data : bg));
          toast.success("Hero background updated successfully");
          setIsDialogOpen(false);
          setSelectedBackground(null);
          setSelectedImageFile(null);
        } else {
          toast.error(result.message || "Failed to update background");
        }
      } else {
        // Create new background
        const response = await fetch('/api/admin/hero-backgrounds', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success) {
          setBackgrounds(prev => [result.data, ...prev]);
          toast.success("Hero background created successfully");
          setIsDialogOpen(false);
          setSelectedBackground(null);
          setSelectedImageFile(null);
        } else {
          toast.error(result.message || "Failed to create background");
        }
      }
    } catch (error: any) {
      console.error('Error saving background:', error);
      toast.error(`Failed to save background: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBackground = async (id: number) => {
    if (!confirm("Are you sure you want to delete this hero background?")) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/hero-backgrounds/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBackgrounds(prev => prev.filter(bg => bg.id !== id));
        toast.success("Hero background deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete background");
      }
    } catch (error: any) {
      console.error('Error deleting background:', error);
      toast.error(`Failed to delete background: ${error.message}`);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/hero-backgrounds/${id}/toggle-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBackgrounds(prev => prev.map(bg => bg.id === id ? result.data : bg));
        toast.success("Background status updated successfully");
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hero Background Management</h1>
          <p className="text-muted-foreground">
            Manage hero background images for the homepage
          </p>
        </div>
        <Button onClick={handleAddBackground}>
          <Plus className="h-4 w-4 mr-2" />
          Add Background
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search backgrounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Backgrounds Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBackgrounds.map((background) => (
              <TableRow key={background.id}>
                <TableCell>
                  <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden">
                    {background.image_url && (
                      <img
                        src={background.image_url}
                        alt={background.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{background.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {background.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={background.is_active ? "default" : "secondary"}>
                    {background.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{background.sort_order}</TableCell>
                <TableCell>
                  {new Date(background.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(background.id)}
                    >
                      {background.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditBackground(background)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBackground(background.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBackground?.id ? 'Edit Hero Background' : 'Add New Hero Background'}
            </DialogTitle>
            <DialogDescription>
              {selectedBackground?.id ? 'Make changes to the hero background here.' : 'Fill in the details to create a new hero background.'}
            </DialogDescription>
          </DialogHeader>
          {selectedBackground && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={selectedBackground.name}
                  onChange={(e) => setSelectedBackground({...selectedBackground, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={selectedBackground.description || ''}
                  onChange={(e) => setSelectedBackground({...selectedBackground, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image
                </Label>
                <div className="col-span-3">
                  <FileUpload
                    type="image"
                    label=""
                    onFileSelect={setSelectedImageFile}
                    currentFile={selectedBackground.image_path}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sortOrder" className="text-right">
                  Sort Order
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={selectedBackground.sort_order}
                  onChange={(e) => setSelectedBackground({...selectedBackground, sort_order: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedBackground.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setSelectedBackground({...selectedBackground, is_active: value === 'active'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveBackground} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (selectedBackground?.id ? 'Save Changes' : 'Create Background')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroBackgroundManagement;
