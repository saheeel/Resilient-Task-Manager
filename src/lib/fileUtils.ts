// Utilities for detecting and handling file types (Images vs PDFs vs Documents)

const pdfUrlCache = new Set<string>();
const imageUrlCache = new Set<string>();
const sniffingUrls = new Set<string>();

export const isPdfFile = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  if (
    lowerUrl.includes('.pdf') || 
    lowerUrl.includes('application/pdf') || 
    lowerUrl.includes('type=pdf') || 
    lowerUrl.endsWith('#pdf') ||
    lowerUrl.includes('#attachment.pdf') ||
    lowerUrl.includes('.pdf#') ||
    lowerUrl.includes('filename=') && lowerUrl.includes('.pdf') ||
    pdfUrlCache.has(url)
  ) {
    return true;
  }
  
  if (lowerUrl.startsWith('data:application/pdf')) {
    return true;
  }

  // If sniffing detected it as PDF
  if (pdfUrlCache.has(url)) {
    return true;
  }

  return false;
};

export const isImageFile = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();

  // If it's a PDF, it is NOT an image
  if (isPdfFile(url)) return false;

  // Data URLs
  if (lowerUrl.startsWith('data:image/')) return true;

  // Known image extensions
  const hasImageExtension = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?.*)?(#.*)?$/i.test(lowerUrl);
  if (hasImageExtension) return true;

  // Known document extensions (not images)
  const isDocument = /\.(doc|docx|xls|xlsx|txt|csv|zip|rar|pdf)(\?.*)?(#.*)?$/i.test(lowerUrl);
  if (isDocument) return false;

  // Known cached image
  if (imageUrlCache.has(url)) return true;

  // For extension-less HTTP/HTTPS URLs (like Convex storage URLs), kick off async sniff
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://') || lowerUrl.startsWith('blob:')) {
    sniffUrlType(url);
    // Return true by default for non-pdf HTTP URLs until sniffing says otherwise, unless it's known doc
    return !pdfUrlCache.has(url);
  }

  return false;
};

// Async type sniffer for extension-less URLs (e.g., Convex storage URLs)
export const sniffUrlType = async (url: string) => {
  if (!url || pdfUrlCache.has(url) || imageUrlCache.has(url) || sniffingUrls.has(url)) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  sniffingUrls.add(url);

  try {
    const res = await fetch(url, { method: 'HEAD' });
    const contentType = res.headers.get('content-type')?.toLowerCase() || '';
    
    if (contentType.includes('application/pdf') || contentType.includes('pdf')) {
      pdfUrlCache.add(url);
      window.dispatchEvent(new CustomEvent('file-type-updated', { detail: { url, type: 'pdf' } }));
    } else if (contentType.includes('image/')) {
      imageUrlCache.add(url);
      window.dispatchEvent(new CustomEvent('file-type-updated', { detail: { url, type: 'image' } }));
    }
  } catch {
    // Silent catch for CORS or network restrictions
  } finally {
    sniffingUrls.delete(url);
  }
};

/**
 * Ensures PDF storage URLs have `#attachment.pdf` appended so they are 
 * recognized as PDFs synchronously across all clients and components.
 */
export const formatStorageUrlForFile = (url: string, fileOrName?: File | string): string => {
  if (!url) return url;
  
  const fileName = typeof fileOrName === 'string' ? fileOrName : fileOrName?.name || '';
  const isPdf = 
    (typeof fileOrName === 'object' && fileOrName?.type === 'application/pdf') ||
    fileName.toLowerCase().endsWith('.pdf') ||
    url.toLowerCase().includes('.pdf') ||
    url.toLowerCase().includes('application/pdf');

  if (isPdf && !url.toLowerCase().includes('.pdf')) {
    return `${url}#attachment.pdf`;
  }
  
  return url;
};
