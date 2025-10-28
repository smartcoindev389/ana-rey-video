import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Upload, 
  FileImage, 
  FileVideo, 
  X, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onFileUpload?: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number; // in MB
  type: 'image' | 'video';
  label?: string;
  currentFile?: string | null;
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileUpload,
  accept,
  maxSize = 10,
  type,
  label,
  currentFile,
  disabled = false,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentFile || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      : ['video/mp4', 'video/mov', 'video/avi'];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Please select a valid ${type} file`);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    onFileSelect(file);

    // Auto upload if onFileUpload is provided
    if (onFileUpload) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!onFileUpload) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const url = await onFileUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedUrl(url);
      setUploadError(null);
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
    setUploadError(null);
    onFileSelect(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getAcceptTypes = () => {
    if (accept) return accept;
    return type === 'image' 
      ? 'image/jpeg,image/png,image/jpg,image/webp'
      : 'video/mp4,video/mov,video/avi';
  };

  const getIcon = () => {
    if (type === 'image') return <ImageIcon className="h-6 w-6" />;
    return <VideoIcon className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      
      <Card 
        className={`border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${uploadError ? 'border-red-300' : ''}`}
        onClick={handleClick}
      >
        <div className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          ) : uploadedUrl ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-sm text-green-600">File uploaded successfully</p>
              <p className="text-xs text-gray-500 truncate">{uploadedUrl.split('/').pop()}</p>
            </div>
          ) : selectedFile ? (
            <div className="space-y-2">
              {getIcon()}
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getIcon()}
              <p className="text-sm text-gray-600">
                Click to upload {type === 'image' ? 'image' : 'video'} or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {type === 'image' ? 'PNG, JPG, JPEG, WebP up to' : 'MP4, MOV, AVI up to'} {maxSize}MB
              </p>
            </div>
          )}
        </div>
      </Card>

      {uploadError && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}

      {(selectedFile || uploadedUrl) && !uploading && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            {type === 'image' ? <FileImage className="h-4 w-4" /> : <FileVideo className="h-4 w-4" />}
            <span className="text-sm text-gray-700">
              {selectedFile?.name || uploadedUrl?.split('/').pop()}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
