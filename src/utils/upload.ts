/**
 * Helper to upload a base64 encoded image to IMGBB via the Express server proxy.
 * This keeps the IMGBB API key secure.
 */
export async function uploadImageToImgbb(base64Image: string): Promise<string | null> {
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: base64Image })
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
