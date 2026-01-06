import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';

interface CameraProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Prefer back camera
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Unable to access camera. Please upload a file instead.');
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const image = canvas.toDataURL('image/jpeg');
        onCapture(image);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onCancel} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center sm:relative sm:bg-transparent sm:h-auto">
      <div className="relative w-full max-w-lg aspect-[4/3] bg-black rounded-lg overflow-hidden shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 border-2 border-[#64ffda] opacity-50 pointer-events-none m-8 rounded-lg">
          {/* Guide frame */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#64ffda]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#64ffda]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#64ffda]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#64ffda]"></div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-6">
        <Button onClick={onCancel} variant="outline" className="bg-white border-white text-black hover:bg-gray-200">
          Cancel
        </Button>
        <Button onClick={handleCapture} variant="secondary" className="px-8">
          Capture Photo
        </Button>
      </div>
    </div>
  );
};
