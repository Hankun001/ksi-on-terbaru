/**
 * Content Utility Functions
 * Handles YouTube URL normalization, file type detection, and content validation
 */

// ============================================
// YOUTUBE URL UTILITIES
// ============================================

/**
 * Normalizes a YouTube URL to embed format
 * @param {string} url - YouTube URL (various formats)
 * @returns {string|null} - YouTube embed URL or null if invalid
 */
export const normalizeYouTubeUrl = (url) => {
  if (!url) return null;
  
  // Remove whitespace
  url = url.trim();
  
  // Various YouTube URL patterns
  const patterns = [
    // Standard: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Short: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts: https://www.youtube.com/shorts/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return null;
};

/**
 * Checks if a URL is a valid YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export const isYouTubeUrl = (url) => {
  return normalizeYouTubeUrl(url) !== null;
};

/**
 * Extracts YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - YouTube video ID
 */
export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// ============================================
// FILE TYPE UTILITIES
// ============================================

/**
 * File type categories
 */
export const FILE_TYPES = {
  DOCUMENT: 'document',
  IMAGE: 'image',
  VIDEO: 'video',
};

/**
 * MIME type to content type mapping
 */
export const MIME_TYPE_MAP = {
  // Documents
  'application/pdf': { type: FILE_TYPES.DOCUMENT, label: 'PDF', icon: 'picture_as_pdf' },
  'application/msword': { type: FILE_TYPES.DOCUMENT, label: 'Word', icon: 'description' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: FILE_TYPES.DOCUMENT, label: 'Word', icon: 'description' },
  'application/vnd.ms-excel': { type: FILE_TYPES.DOCUMENT, label: 'Excel', icon: 'table_chart' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { type: FILE_TYPES.DOCUMENT, label: 'Excel', icon: 'table_chart' },
  'application/vnd.ms-powerpoint': { type: FILE_TYPES.DOCUMENT, label: 'PowerPoint', icon: 'slideshow' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { type: FILE_TYPES.DOCUMENT, label: 'PowerPoint', icon: 'slideshow' },
  'text/plain': { type: FILE_TYPES.DOCUMENT, label: 'Text', icon: 'text_snippet' },
  
  // Images
  'image/jpeg': { type: FILE_TYPES.IMAGE, label: 'JPEG Image', icon: 'image' },
  'image/png': { type: FILE_TYPES.IMAGE, label: 'PNG Image', icon: 'image' },
  'image/gif': { type: FILE_TYPES.IMAGE, label: 'GIF Image', icon: 'image' },
  'image/webp': { type: FILE_TYPES.IMAGE, label: 'WebP Image', icon: 'image' },
  'image/svg+xml': { type: FILE_TYPES.IMAGE, label: 'SVG Image', icon: 'image' },
  
  // Videos
  'video/mp4': { type: FILE_TYPES.VIDEO, label: 'MP4 Video', icon: 'video_file' },
  'video/webm': { type: FILE_TYPES.VIDEO, label: 'WebM Video', icon: 'video_file' },
  'video/quicktime': { type: FILE_TYPES.VIDEO, label: 'QuickTime', icon: 'video_file' },
  'video/x-msvideo': { type: FILE_TYPES.VIDEO, label: 'AVI Video', icon: 'video_file' },
};

/**
 * File extension to MIME type mapping
 */
export const EXTENSION_TO_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
};

/**
 * Gets content type from file object or MIME type
 * @param {File|string} file - File object or MIME type string
 * @returns {string} - Content type (document, image, video)
 */
export const getContentType = (file) => {
  const mimeType = typeof file === 'string' ? file : file.type;
  const info = MIME_TYPE_MAP[mimeType];
  return info ? info.type : null;
};

/**
 * Gets file info from MIME type
 * @param {string} mimeType - MIME type
 * @returns {object} - File info object
 */
export const getFileInfo = (mimeType) => {
  return MIME_TYPE_MAP[mimeType] || { type: 'unknown', label: 'Unknown', icon: 'insert_drive_file' };
};

// ============================================
// FILE SIZE UTILITIES
// ============================================

/**
 * Maximum file size thresholds (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  // 10MB threshold for suggesting external link
  SUGGEST_EXTERNAL: 10 * 1024 * 1024, // 10MB
  // 50MB hard limit for uploads
  MAX_UPLOAD: 50 * 1024 * 1024, // 50MB
  // 100MB for videos
  MAX_VIDEO_UPLOAD: 100 * 1024 * 1024, // 100MB
};

/**
 * Formats file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Checks if file size exceeds threshold for suggesting external link
 * @param {number} bytes - File size in bytes
 * @param {string} contentType - Content type
 * @returns {boolean} - True if should suggest external
 */
export const shouldSuggestExternal = (bytes, contentType) => {
  if (contentType === FILE_TYPES.VIDEO) {
    return bytes > FILE_SIZE_LIMITS.MAX_VIDEO_UPLOAD;
  }
  return bytes > FILE_SIZE_LIMITS.SUGGEST_EXTERNAL;
};

/**
 * Checks if file size is within upload limits
 * @param {number} bytes - File size in bytes
 * @param {string} contentType - Content type
 * @returns {boolean} - True if within limits
 */
export const isWithinUploadLimit = (bytes, contentType) => {
  if (contentType === FILE_TYPES.VIDEO) {
    return bytes <= FILE_SIZE_LIMITS.MAX_VIDEO_UPLOAD;
  }
  return bytes <= FILE_SIZE_LIMITS.MAX_UPLOAD;
};

// ============================================
// URL VALIDATION UTILITIES
// ============================================

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detects if URL is from a known external storage provider
 * @param {string} url - URL to check
 * @returns {object} - Provider info or null
 */
export const detectExternalProvider = (url) => {
  if (!url) return null;
  
  const providers = [
    { name: 'Google Drive', patterns: [/drive\.google\.com/i, /googledrive\.com/i] },
    { name: 'Dropbox', patterns: [/dropbox\.com/i, /dropboxusercontent\.com/i] },
    { name: 'OneDrive', patterns: [/onedrive\.live\.com/i, /1drv\.ms/i] },
    { name: 'iCloud', patterns: [/icloud\.com/i, /iclouddrive\.com/i] },
    { name: 'Box', patterns: [/box\.com/i, /boxcloud\.com/i] },
  ];
  
  for (const provider of providers) {
    for (const pattern of provider.patterns) {
      if (pattern.test(url)) {
        return provider;
      }
    }
  }
  
  return null;
};

// ============================================
// CONTENT TYPE DETECTION
// ============================================

/**
 * Auto-detects content type based on URL or file
 * @param {string} url - URL (optional)
 * @param {File} file - File object (optional)
 * @returns {string} - Detected content type
 */
export const detectContentType = (url, file) => {
  // First check file
  if (file) {
    const contentType = getContentType(file);
    if (contentType) return contentType;
  }
  
  // Then check URL
  if (url) {
    // Check if YouTube
    if (isYouTubeUrl(url)) {
      return FILE_TYPES.VIDEO;
    }
    
    // Check for external provider
    const provider = detectExternalProvider(url);
    if (provider) {
      // Check if it's likely an image or document based on extension
      const extension = url.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        return FILE_TYPES.IMAGE;
      }
      return FILE_TYPES.DOCUMENT;
    }
  }
  
  return FILE_TYPES.DOCUMENT; // Default
};

export default {
  normalizeYouTubeUrl,
  isYouTubeUrl,
  getYouTubeVideoId,
  FILE_TYPES,
  getContentType,
  getFileInfo,
  formatFileSize,
  shouldSuggestExternal,
  isWithinUploadLimit,
  isValidUrl,
  detectExternalProvider,
  detectContentType,
};
