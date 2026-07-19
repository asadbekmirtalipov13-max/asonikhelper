const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Replace the custom camera with native camera input
const oldCameraLogic = `
  const handleStartCamera = async () => {
    setCameraActive(true);
    setProofPhotoBase64(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Failed to access camera, fallback to file selection:", err);
      setCameraActive(false);
      showAlert("Внимание", "Не удалось запустить камеру. Пожалуйста, загрузите готовое фото через кнопку выбора файла.");
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setProofPhotoBase64(dataUrl);
        handleStopCamera();
      }
    }
  };

  const handleStopCamera = () => {
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };
`;

const newCameraLogic = `
  const nativeCameraRef = useRef<HTMLInputElement | null>(null);

  const handleStartCamera = () => {
    // Just trigger the native camera input
    if (nativeCameraRef.current) {
      nativeCameraRef.current.click();
    }
  };

  const handleCapturePhoto = () => {
    // not used anymore
  };

  const handleStopCamera = () => {
    setCameraActive(false);
  };
`;

content = content.replace(oldCameraLogic, newCameraLogic);
if(content === fs.readFileSync('src/components/KidDashboard.tsx', 'utf8')) {
  console.log("Failed to replace camera logic!");
}

// Replace the video UI
const oldCameraUI = `
                ) : cameraActive ? (
                  <div className="w-full space-y-4">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-300 bg-black relative">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
                    </div>
                    <button
                      onClick={handleCapturePhoto}
                      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Сделать снимок!
                    </button>
                    <button
                      onClick={handleStopCamera}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
`;

const newCameraUI = `
                ) : cameraActive ? (
                   <div></div>
                ) : (
`;

content = content.replace(oldCameraUI, newCameraUI);

// Add the hidden native camera input right next to fileInputRef
content = content.replace(
  /<input \n\s+type="file" \n\s+ref=\{fileInputRef\}/,
  `<input 
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        ref={nativeCameraRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <input 
                        type="file" 
                        ref={fileInputRef}`
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
console.log("Patched camera");
