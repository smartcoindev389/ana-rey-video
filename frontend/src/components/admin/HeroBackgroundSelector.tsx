import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Play,
  ZoomIn
} from 'lucide-react';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import { heroBackgroundApi } from '@/services/heroBackgroundApi';
import HeroImagePreview from './HeroImagePreview';

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

interface HeroBackgroundSelectorProps {
  onBackgroundsChange: (backgrounds: HeroBackground[]) => void;
  selectedBackgrounds?: number[];
  className?: string;
  readOnly?: boolean; // New prop to make it read-only
}

const HeroBackgroundSelector: React.FC<HeroBackgroundSelectorProps> = ({
  onBackgroundsChange,
  selectedBackgrounds = [],
  className = '',
  readOnly = false
}) => {
  const [backgrounds, setBackgrounds] = useState<HeroBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newBackground, setNewBackground] = useState({
    name: '',
    description: '',
    sort_order: 0
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      setLoading(true);
      const response = await heroBackgroundApi.getAll();
      if (response.success) {
        // Handle both response formats: { data: HeroBackground[] } or HeroBackground[]
        const dataArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.data || [];
        setBackgrounds(dataArray);
      } else {
        throw new Error('Failed to fetch backgrounds');
      }
    } catch (error: any) {
      console.error('Error fetching backgrounds:', error);
      toast.error(`Failed to load backgrounds: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackground = async () => {
    if (!selectedImageFile) {
      toast.error("Please select an image file");
      return;
    }

    if (!newBackground.name.trim()) {
      toast.error("Please enter a name for the background");
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('name', newBackground.name);
      formData.append('description', newBackground.description);
      formData.append('sort_order', newBackground.sort_order.toString());
      formData.append('image', selectedImageFile);
      formData.append('is_active', 'true');
      
      const response = await heroBackgroundApi.create(formData);
      
      if (response.success) {
        // Ensure we're adding a single HeroBackground object, not an array
        const newBg = Array.isArray(response.data) ? response.data[0] : response.data;
        setBackgrounds(prev => [newBg, ...prev]);
        toast.success("Hero background uploaded successfully");
        setShowUpload(false);
        setNewBackground({ name: '', description: '', sort_order: 0 });
        setSelectedImageFile(null);
      } else {
        toast.error("Failed to upload background");
      }
    } catch (error: any) {
      console.error('Error uploading background:', error);
      toast.error(`Failed to upload background: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleBackground = async (id: number) => {
    try {
      const response = await heroBackgroundApi.toggleStatus(id);
      
      if (response.success) {
        // Ensure we're using a single HeroBackground object
        const updatedBg = Array.isArray(response.data) ? response.data[0] : response.data;
        setBackgrounds(prev => prev.map(bg => bg.id === id ? updatedBg : bg));
        toast.success("Background status updated successfully");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleDeleteBackground = async (id: number) => {
    if (!confirm("Are you sure you want to delete this hero background?")) {
      return;
    }

    try {
      const response = await heroBackgroundApi.delete(id);
      
      if (response.success) {
        setBackgrounds(prev => prev.filter(bg => bg.id !== id));
        toast.success("Hero background deleted successfully");
      } else {
        toast.error("Failed to delete background");
      }
    } catch (error: any) {
      console.error('Error deleting background:', error);
      toast.error(`Failed to delete background: ${error.message}`);
    }
  };

  const handleSelectBackground = (id: number) => {
    const newSelected = selectedBackgrounds.includes(id)
      ? selectedBackgrounds.filter(bgId => bgId !== id)
      : [...selectedBackgrounds, id];
    
    onBackgroundsChange(backgrounds.filter(bg => newSelected.includes(bg.id)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hero Background Images</h3>
          <p className="text-sm text-gray-600">Total: {backgrounds.length} images</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedBackgrounds.length > 0 && (
            <Button
              onClick={() => setShowPreview(true)}
              variant="default"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Preview ({selectedBackgrounds.length})
            </Button>
          )}
          
          {!readOnly && (
            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Background
            </Button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && !readOnly && (
        <Card className="p-4 border-2 border-dashed border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Upload New Background</h4>
              <Button
                onClick={() => setShowUpload(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newBackground.name}
                  onChange={(e) => setNewBackground({...newBackground, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Background name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <input
                  type="number"
                  value={newBackground.sort_order}
                  onChange={(e) => setNewBackground({...newBackground, sort_order: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={newBackground.description}
                onChange={(e) => setNewBackground({...newBackground, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Background description (optional)"
                rows={2}
              />
            </div>
            
            <FileUpload
              type="image"
              label="Background Image"
              onFileSelect={setSelectedImageFile}
              disabled={uploading}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowUpload(false)}
                variant="outline"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadBackground}
                disabled={uploading || !selectedImageFile || !newBackground.name.trim()}
              >
                {uploading ? 'Uploading...' : 'Upload Background'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Background Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {backgrounds.map((background) => (
          <Card key={background.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <div 
                className="aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                onDoubleClick={() => {
                  onBackgroundsChange([background]);
                  setShowPreview(true);
                }}
              >
                <img
                  src={background.image_url}
                  alt={background.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              {/* Selection Overlay */}
              <div className="absolute top-1 left-1">
                <button
                  onClick={() => handleSelectBackground(background.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedBackgrounds.includes(background.id)
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-300 hover:border-primary'
                  }`}
                >
                  {selectedBackgrounds.includes(background.id) && (
                    <Check className="h-2.5 w-2.5" />
                  )}
                </button>
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-1 right-1">
                <Badge 
                  variant={background.is_active ? "default" : "secondary"}
                  className="text-xs px-1 py-0"
                >
                  {background.is_active ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
            
            <div className="p-2">
              <h4 className="font-medium text-xs truncate">{background.name}</h4>
              
              <div className="flex items-center justify-between mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onBackgroundsChange([background]);
                    setShowPreview(true);
                  }}
                  className="h-5 w-5 p-0"
                  title="Preview image"
                >
                  <ZoomIn className="h-2.5 w-2.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleBackground(background.id)}
                  className="h-5 w-5 p-0"
                  title={background.is_active ? "Deactivate" : "Activate"}
                >
                  {background.is_active ? (
                    <EyeOff className="h-2.5 w-2.5" />
                  ) : (
                    <Eye className="h-2.5 w-2.5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {backgrounds.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hero background images found.</p>
          <p className="text-sm">Click "Add Background" to upload your first image.</p>
        </div>
      )}

      {/* Preview Modal */}
      <HeroImagePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        images={backgrounds}
        selectedImages={selectedBackgrounds}
      />
    </div>
  );
};

export default HeroBackgroundSelector;
