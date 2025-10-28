import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Eye, 
  Download, 
  RotateCw,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';

interface HeroImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    id: number;
    name: string;
    description?: string;
    image_url: string;
    is_active: boolean;
    sort_order: number;
  }>;
  selectedImages: number[];
}

const HeroImagePreview: React.FC<HeroImagePreviewProps> = ({
  isOpen,
  onClose,
  images,
  selectedImages
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const selectedImagesData = images.filter(img => selectedImages.includes(img.id));

  useEffect(() => {
    if (selectedImagesData.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [selectedImages, selectedImagesData]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImagesData.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImagesData.length) % selectedImagesData.length);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadImage = () => {
    const currentImage = selectedImagesData[currentImageIndex];
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage.image_url;
      link.download = currentImage.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (selectedImagesData.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Images Selected</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Please select some hero background images to preview.</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentImage = selectedImagesData[currentImageIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-none w-screen h-screen' : 'sm:max-w-4xl'} p-0`}>
        <div className={`${isFullscreen ? 'h-full' : 'h-[80vh]'} flex flex-col`}>
          {/* Header */}
          <DialogHeader className="flex-shrink-0 p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <DialogTitle className="text-xl font-semibold">
                  Hero Background Preview
                </DialogTitle>
                <Badge variant="outline">
                  {currentImageIndex + 1} of {selectedImagesData.length}
                </Badge>
                {currentImage && (
                  <Badge variant={currentImage.is_active ? "default" : "secondary"}>
                    {currentImage.is_active ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Image Display */}
            <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
              {currentImage && (
                <img
                  src={currentImage.image_url}
                  alt={currentImage.name}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    filter: 'brightness(0.8) contrast(1.1)',
                  }}
                />
              )}
              
              {/* Navigation Arrows */}
              {selectedImagesData.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  >
                    →
                  </Button>
                </>
              )}

              {/* Image Info Overlay */}
              {showInfo && currentImage && (
                <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg max-w-sm">
                  <h3 className="font-semibold">{currentImage.name}</h3>
                  {currentImage.description && (
                    <p className="text-sm text-gray-300 mt-1">{currentImage.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Order: {currentImage.sort_order} | 
                    Status: {currentImage.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {selectedImagesData.length > 1 && (
              <div className="w-32 border-l bg-white overflow-y-auto">
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-3">Images ({selectedImagesData.length})</h4>
                  <div className="space-y-2">
                    {selectedImagesData.map((image, index) => (
                      <div
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt={image.name}
                          className="w-full h-20 object-cover"
                        />
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{image.name}</p>
                          <p className="text-xs text-gray-500">#{image.sort_order}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex-shrink-0 p-6 border-t bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedImagesData.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevImage}
                      disabled={selectedImagesData.length <= 1}
                    >
                      ← Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextImage}
                      disabled={selectedImagesData.length <= 1}
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadImage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(currentImage?.image_url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
                <Button onClick={onClose}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroImagePreview;
