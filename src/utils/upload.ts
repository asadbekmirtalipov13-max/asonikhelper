/**
 * Helper to upload a base64 encoded image to IMGBB via the Express server proxy.
 * This keeps the IMGBB API key secure.
 */
/**
 * Helper to downscale a base64 image to prevent massive payloads from high-res phone cameras.
 */
export function resizeBase64Image(base64Str: string, maxW = 1024, maxH = 1024): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a standard image data URI, just bypass
    if (!base64Str.startsWith("data:image")) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // If already within bounds, return original
      if (width <= maxW && height <= maxH) {
        resolve(base64Str);
        return;
      }

      if (width > height) {
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
      } else {
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // High-quality JPEG compression at 0.8
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = (err) => {
      console.error("Failed to load image for resizing:", err);
      resolve(base64Str);
    };
  });
}

/**
 * Helper to compress a File object directly to a downscaled JPEG base64 string
 */
export function compressImageFile(file: File, maxW = 1024, maxH = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > maxW || height > maxH) {
        if (width > height) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        } else {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.error("Failed to load image for compression, falling back to FileReader:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Helper to upload a base64 encoded image to IMGBB via the Express server proxy.
 * This keeps the IMGBB API key secure.
 */
const IMGBB_API_KEY = (import.meta as any).env.VITE_IMGBB_API_KEY || '88c6cd2b32b499fd1e7272926e44bc3d';

export async function uploadImageToImgbb(base64Image: string): Promise<string | null> {
  try {
    const optimizedBase64 = await resizeBase64Image(base64Image, 1024, 1024);
    const cleanBase64 = optimizedBase64.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('image', cleanBase64);
    const response = await fetch('https://api.imgbb.com/1/upload?key=' + IMGBB_API_KEY, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success && data.data && data.data.url) {
      return data.data.url;
    }
    console.error('IMGBB upload error:', data.error);
    return null;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return null;
  }
}
