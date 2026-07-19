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
export async function uploadImageToImgbb(base64Image: string): Promise<string | null> {
  try {
    // Automatically downscale before uploading to keep network light and avoid limits
    const optimizedBase64 = await resizeBase64Image(base64Image, 1024, 1024);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: optimizedBase64 })
    });
    
    const data = await response.json();
    if (data.success && data.url) {
      return data.url;
    }
    console.error("IMGBB upload error from proxy:", data.error);
    return null;
  } catch (error) {
    console.error("Failed to upload image via proxy:", error);
    return null;
  }
}

