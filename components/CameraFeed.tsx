
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

interface CameraFeedProps {
  onStreamReady: () => void;
  onError: (error: Error) => void;
}

export interface CameraFeedHandle {
  captureFrame: () => string | null;
}

const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(({ onStreamReady, onError }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          onStreamReady();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        onError(err as Error);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          return dataUrl.split(',')[1];
        }
      }
      return null;
    },
  }));

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-video bg-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 border-2 border-slate-700">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50"></div>
    </div>
  );
});

export default CameraFeed;
