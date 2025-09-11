import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface MediaUploadOptions {
  category: 'profile_avatar' | 'quest_image' | 'quest_video' | 'submission_photo' | 'submission_video' | 'submission_document' | 'category_icon' | 'badge_image' | 'general';
  questId?: string;
  submissionId?: string;
  description?: string;
}

export interface MediaUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: any;
}

export const useMediaUpload = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options: MediaUploadOptions }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', options.category);
      if (options.questId) formData.append('questId', options.questId);
      if (options.submissionId) formData.append('submissionId', options.submissionId);
      if (options.description) formData.append('description', options.description);

      const response = await fetch(`${apiClient.baseUrl}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getAccessToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate media queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('File uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error('Upload failed', { description: error.message });
    },
  });

  const uploadFile = useCallback(async (file: File, options: MediaUploadOptions) => {
    // Add file to progress tracking
    const progressItem: MediaUploadProgress = {
      file,
      progress: 0,
      status: 'uploading',
    };
    
    setUploadProgress(prev => [...prev, progressItem]);

    try {
      const result = await uploadMutation.mutateAsync({ file, options });
      
      // Update progress to completed
      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: 'completed', progress: 100, result }
            : item
        )
      );

      return result;
    } catch (error) {
      // Update progress to error
      setUploadProgress(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );
      throw error;
    }
  }, [uploadMutation]);

  const uploadMultipleFiles = useCallback(async (files: File[], options: MediaUploadOptions) => {
    const uploadPromises = files.map(file => uploadFile(file, options));
    return Promise.allSettled(uploadPromises);
  }, [uploadFile]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  const removeProgressItem = useCallback((file: File) => {
    setUploadProgress(prev => prev.filter(item => item.file !== file));
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    uploadProgress,
    clearProgress,
    removeProgressItem,
    isUploading: uploadMutation.isPending,
  };
};
