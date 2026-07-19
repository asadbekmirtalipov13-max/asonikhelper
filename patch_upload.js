const fs = require('fs');
let content = fs.readFileSync('src/utils/upload.ts', 'utf8');
content = content.replace(/export async function uploadImageToImgbb[\s\S]+/, `const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || "88c6cd2b32b499fd1e7272926e44bc3d";

export async function uploadImageToImgbb(base64Image: string): Promise<string | null> {
  try {
    const optimizedBase64 = await resizeBase64Image(base64Image, 1024, 1024);
    const cleanBase64 = optimizedBase64.replace(/^data:image\\/\\w+;base64,/, "");
    const formData = new FormData();
    formData.append("image", cleanBase64);
    const response = await fetch(\`https://api.imgbb.com/1/upload?key=\\${IMGBB_API_KEY}\`, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (data.success && data.data && data.data.url) {
      return data.data.url;
    }
    console.error("IMGBB upload error:", data.error);
    return null;
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
}
`);
fs.writeFileSync('src/utils/upload.ts', content);
