/**
 * Image Storage Abstraction Layer
 * Centralizes all image URL generation to eliminate hardcoded URLs.
 * Simplified to support only two formats: WebP (display) and JPG (download).
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpy1pmz7g';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}`;

export interface ImageSource {
  webp: string;
  jpg: string;
}

/**
 * Returns URLs for the optimized WebP (display) and high-quality JPG (download).
 */
export const getAssetSources = (publicId: string): ImageSource => {
  if (!publicId) return { webp: "", jpg: "" };
  
  // 1. If it's already a full URL or a local path, use it.
  // We check if it's a Cloudinary URL and strip any transformation segments to ensure zero-credit.
  if (publicId.startsWith("http")) {
    if (publicId.includes("res.cloudinary.com")) {
      // Strips the transformation segment (e.g., /upload/v123/... or /upload/f_auto,q_auto/v123/...)
      // to return the raw high-quality uploaded image.
      const cleanedUrl = publicId.replace(/\/image\/upload\/(?:[a-z]_[^\/]+\/)+(v\d+\/)?/, "/image/upload/$1");
      return { webp: cleanedUrl, jpg: cleanedUrl };
    }
    return { webp: publicId, jpg: publicId };
  }

  if (publicId.startsWith("/")) {
    return { webp: publicId, jpg: publicId };
  }

  // 2. For raw IDs, return the raw uploaded image directly.
  return { 
    webp: `${BASE_URL}/image/upload/${publicId}`, 
    jpg: `${BASE_URL}/image/upload/${publicId}` 
  };
};

export const getGallery = getAssetSources;
export const getPreview = getAssetSources;
