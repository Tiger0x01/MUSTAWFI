import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, FileImage, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassButton, GlassCard } from "./core";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";

export function UploadZone({ onAnalyze, busy }: { onAnalyze: () => void; busy: boolean }) {
  const app = useApplication();
  const t = copy[app.language].analyze;
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  const input = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const choose = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(copy[app.language].errors.invalid);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(copy[app.language].errors.large);
      return;
    }
    setError("");
    app.setFile(file);
  };

  // تشغيل الكاميرا الحية
  const startCamera = async () => {
    setError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setShowCameraModal(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      setError("تعذر الوصول إلى الكاميرا. تأكد من إعطاء الصلاحيات للمتصفح.");
    }
  };

  // إيقاف الكاميرا وإغلاق النافذة
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
  };

  // التقاط الصورة من الفيديو
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
          choose(file);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  // التنظيف عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  if (app.uploadedFile)
    return (
      <GlassCard className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="preview-frame">
            <img src={app.previewUrl ?? ""} alt="Selected loan application" />
          </div>
          <div className="flex min-w-0 flex-col justify-between py-2">
            <div>
              <p className="eyebrow">{t.ready}</p>
              <h2 className="mt-3 truncate text-2xl font-semibold">{app.uploadedFile.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {(app.uploadedFile.size / 1024 / 1024).toFixed(2)} MB · {app.uploadedFile.type}
              </p>
            </div>
            {busy && (
              <div className="progress-track my-6">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }} />
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <GlassButton onClick={onAnalyze} disabled={busy}>
                {t.action}
                <FileImage />
              </GlassButton>
              <Button variant="ghost" className="h-12 rounded-full" onClick={() => app.setFile(null)}>
                <Trash2 />
                {t.remove}
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    );

  return (
    <>
      <motion.div animate={{ scale: drag ? 1.02 : 1 }} className="mx-auto max-w-3xl">
        <GlassCard className={`upload-zone ${drag ? "upload-active" : ""}`}>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              choose(e.dataTransfer.files[0]);
            }}
          >
            <motion.div animate={{ y: drag ? -5 : 0 }} className="upload-icon">
              <Upload />
            </motion.div>
            <h2 className="mt-6 text-2xl font-semibold">{t.drop}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t.support}</p>
            <div className="mt-8 flex justify-center gap-3">
              <GlassButton onClick={() => input.current?.click()}>{t.browse}</GlassButton>
              <Button variant="outline" className="h-12 rounded-full px-5" onClick={startCamera}>
                <Camera />
                {t.camera}
              </Button>
            </div>
            {error && (
              <p role="alert" className="mt-5 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* نافذة كاميرا الويب الحية */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">التقاط صورة الطلب بالكاميرا</h3>
              <Button variant="ghost" size="icon" onClick={stopCamera}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-6 flex justify-center gap-4">
              <GlassButton onClick={captureImage}>التقاط الصورة</GlassButton>
              <Button variant="outline" className="h-12 rounded-full px-6" onClick={stopCamera}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}