import { useState } from 'react';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import { Camera, X } from 'lucide-react';

interface ImageUploaderProps {
  images: File[];
  imagePreviews: string[];
  onImagesChange: (images: File[], imagePreviews: string[]) => void;
}

export function ImageUploader({ images, imagePreviews, onImagesChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('There was an error compressing an image.');
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const compressedFiles: File[] = [];
      const newPreviews: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        const compressedFile = await compressImage(file);
        if (compressedFile) {
          compressedFiles.push(compressedFile);
          const objectUrl = URL.createObjectURL(compressedFile);
          newPreviews.push(objectUrl);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      onImagesChange([...images, ...compressedFiles], [...imagePreviews, ...newPreviews]);
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process some images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const imageUrl = imagePreviews[index];
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }

    const newImages = images.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    onImagesChange(newImages, newImagePreviews);
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
        {imagePreviews.map((preview, index) => (
          <div key={index} className="relative group aspect-w-1 aspect-h-1">
            <img src={preview} alt={`Preview ${index}`} className="object-cover w-full h-full rounded-lg" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
            <Camera size={32} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Add photos</span>
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}
      </div>
      {isUploading && (
        <div className="w-full bg-muted rounded-full h-2.5 mb-4">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}
    </div>
  );
}