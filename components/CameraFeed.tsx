
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';

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
    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      try {
        // Only request new stream if we don't have one
        if (!currentStream) {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
        
        if (videoRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = currentStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            onStreamReady();
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        onError(err as Error);
      }
    }
    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isCapturing, setIsCapturing] = useState(false);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (videoRef.current && canvasRef.current && !isCapturing) {
        setIsCapturing(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        try {
          // Check if video is actually playing and has dimensions
          if (context && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            // Use the current video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            return dataUrl.split(',')[1];
          }
        } finally {
          setIsCapturing(false);
        }
      }
      return null;
    },
  }));

  return (
    <div className="relative w-full h-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 border-2 border-slate-700">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-50"></div>
    </div>
  );
});

export default CameraFeed;
