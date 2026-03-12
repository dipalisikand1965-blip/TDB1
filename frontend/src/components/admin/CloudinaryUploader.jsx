/**
 * CloudinaryUploader - Reusable image upload component for admin
 * Uploads images directly to Cloudinary for persistent storage
 * Use this in ANY admin component that needs image upload
 */

import React, { useState } from 'react';
import { ImagePlus, RefreshCw, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { API_URL } from '../../utils/api';

/**
 * CloudinaryUploader Component
 * @param {string} entityType - 'product', 'service', 'bundle', 'experience', etc.
 * @param {string} entityId - The ID of the entity to link the image to
 * @param {string} currentImageUrl - Current image URL (to show preview)
 * @param {function} onUploadSuccess - Callback with new Cloudinary URL
 * @param {string} label - Custom label text
 * @param {boolean} showPreview - Whether to show image preview
 * @param {string} className - Additional CSS classes
 */
const CloudinaryUploader = ({ 
  entityType = 'product',
  entityId,
  currentImageUrl,
  onUploadSuccess,
  label = "Upload Image",
  showPreview = true,
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setStatusMessage('Invalid file type. Please upload JPG, PNG, or WebP images.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('error');
      setStatusMessage('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setStatusMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Determine the correct endpoint based on entity type
      let endpoint;
      if (entityType === 'product' && entityId) {
        endpoint = `${API_URL}/api/admin/product/${entityId}/upload-image`;
      } else if (entityType === 'service' && entityId) {
        endpoint = `${API_URL}/api/admin/service/${entityId}/upload-image`;
      } else if (entityType === 'bundle' && entityId) {
        endpoint = `${API_URL}/api/admin/bundle/${entityId}/upload-image`;
      } else if (entityType === 'experience' && entityId) {
        endpoint = `${API_URL}/api/admin/experience/${entityId}/upload-image`;
      } else {
        // Generic upload endpoint
        endpoint = `${API_URL}/api/upload/${entityType}-image`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus('success');
        setStatusMessage('Image uploaded to Cloudinary successfully!');
        
        if (onUploadSuccess) {
          onUploadSuccess(data.url);
        }
      } else {
        const err = await response.json();
        setUploadStatus('error');
        setStatusMessage(err.detail || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setStatusMessage('Network error. Please check your connection.');
    } finally {
      setUploading(false);
    }
  };

  const inputId = `cloudinary-upload-${entityType}-${entityId || 'new'}`;

  return (
    <div className={`cloudinary-uploader ${className}`}>
      {/* Upload Section */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <Label className="text-sm font-semibold text-purple-700 flex items-center gap-2 mb-2">
          <ImagePlus className="w-4 h-4" />
          {label} (Persists through Deployments!)
        </Label>
        
        <p className="text-xs text-purple-600 mb-3">
          Images uploaded here are stored in Cloudinary and will NOT be lost during redeployment.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
            id={inputId}
            disabled={uploading}
          />
          <label
            htmlFor={inputId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all text-white font-medium ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
            }`}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Choose File
              </>
            )}
          </label>
          <span className="text-xs text-gray-500">JPG, PNG, WebP (max 10MB)</span>
        </div>

        {/* Status Message */}
        {uploadStatus && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${
            uploadStatus === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {statusMessage}
          </div>
        )}

        {/* Warning if no entity ID */}
        {!entityId && (
          <p className="text-amber-600 text-xs mt-2 font-medium">
            Save the item first before uploading an image
          </p>
        )}
      </div>

      {/* Preview */}
      {showPreview && currentImageUrl && (
        <div className="mt-3">
          <Label className="text-xs text-gray-500">Current Image:</Label>
          <img 
            src={currentImageUrl} 
            alt="Preview"
            className="mt-1 w-24 h-24 object-cover rounded-lg border shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {currentImageUrl.includes('cloudinary') && (
            <span className="text-xs text-green-600 block mt-1">
              Stored in Cloudinary
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudinaryUploader;
