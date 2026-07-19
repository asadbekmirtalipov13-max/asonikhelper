const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const uploadCode = `
      // 1. Upload Base64 image to IMGBB securely via server proxy
      let uploadedUrl = await uploadImageToImgbb(proofPhotoBase64);
      
      // Fallback: If ImgBB fails, try to save the compressed base64 directly to Firestore!
      if (!uploadedUrl) {
         console.warn("ImgBB upload failed, falling back to direct base64 storage.");
         // We must ensure it's compressed enough for Firestore (1MB limit)
         // compressImageFile already resizes and compresses. 
         uploadedUrl = proofPhotoBase64;
      }

      // 2. Save proof photo and update status in database
`;

content = content.replace(
  /\/\/\ 1\. Upload Base64 image to IMGBB securely via server proxy[\s\S]+?\/\/\ 2\. Save proof photo and update status in database/,
  uploadCode
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
console.log("Patched upload fallback");
