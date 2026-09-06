/**
 * Utility to compress and convert images to WebP format using HTML5 Canvas.
 * Ensures fast load times and ultra-lightweight storage (typically < 80KB).
 */
export async function compressImageToWebP(
  fileOrDataUrl: File | string,
  maxWidth = 1600,
  maxHeight = 900,
  quality = 0.82
): Promise<string> {
  if (typeof window === 'undefined') {
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP format with compression
      try {
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        // Fallback to jpeg if browser does not support webp canvas export
        if (webpDataUrl.startsWith('data:image/webp')) {
          resolve(webpDataUrl);
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      } catch {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };

    img.onerror = () => {
      // If error (e.g. cross-origin restriction), fallback to original string if available
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        reject(new Error('Gagal memproses gambar'));
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
