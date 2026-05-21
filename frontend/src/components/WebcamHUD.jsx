import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Sparkles, UserCheck } from 'lucide-react';

export default function WebcamHUD() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [eyeContactScore, setEyeContactScore] = useState(97);
  const [postureState, setPostureState] = useState("Centered");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setErrorMsg("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Camera source offline - Displaying simulator placeholder.");
      setErrorMsg("Optics offline. Simulation panel loaded.");
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setStreamActive(false);
    }
  };

  // Draw refined crop guides on overlay
  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const drawHUD = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const size = 120;
      const x = (w - size) / 2;
      const y = (h - size) / 2;

      // Draw subtle framing corners
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)'; // Indigo opacity
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      // Top Left Corner
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 10, y);
      // Top Right Corner
      ctx.moveTo(x + size - 10, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size, y + 10);
      // Bottom Left Corner
      ctx.moveTo(x, y + size - 10);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x + 10, y + size);
      // Bottom Right Corner
      ctx.moveTo(x + size - 10, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size, y + size - 10);
      ctx.stroke();

      // Telemetry metrics jitter
      if (Math.random() > 0.95) {
        setEyeContactScore(prev => {
          const delta = Math.floor(Math.random() * 3) - 1;
          return Math.min(100, Math.max(92, prev + delta));
        });
      }
      if (Math.random() > 0.98) {
        const states = ["Centered", "Optimal Focus", "Aligned", "Calibrating"];
        setPostureState(states[Math.floor(Math.random() * states.length)]);
      }

      animationId = requestAnimationFrame(drawHUD);
    };

    drawHUD();
    return () => cancelAnimationFrame(animationId);
  }, [streamActive]);

  return (
    <div className="saas-card p-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-3 border-b border-saas-border dark:border-dark-border pb-2">
        <span className="text-xs font-semibold text-saas-slate700 dark:text-dark-text flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-saas-indigo" />
          Focus & Alignment HUD
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-saas-emerald/10 text-saas-emerald">
          <span className="w-1.5 h-1.5 rounded-full bg-saas-emerald animate-pulse" />
          Active
        </span>
      </div>

      {/* Video Container */}
      <div className="relative w-full aspect-[4/3] bg-saas-slate50 dark:bg-black rounded-xl overflow-hidden border border-saas-border dark:border-dark-border">
        {streamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <CameraOff className="w-8 h-8 text-saas-muted dark:text-dark-muted mb-2 opacity-60" />
            <span className="text-[11px] text-saas-muted dark:text-dark-muted font-medium">Camera source offline</span>
            <span className="text-[9px] text-saas-muted dark:text-dark-muted/60 mt-0.5">Simulation metrics running</span>
          </div>
        )}

        {/* Canvas guide overlays */}
        <canvas
          ref={canvasRef}
          width={280}
          height={210}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      </div>

      {/* Telemetry data */}
      <div className="w-full grid grid-cols-2 gap-2.5 mt-3.5">
        <div className="p-2.5 rounded-xl bg-saas-slate50 dark:bg-dark-bg border border-saas-border dark:border-dark-border text-center">
          <span className="text-[9px] font-medium text-saas-muted uppercase tracking-wider block">Visual Stability</span>
          <span className="text-sm font-semibold text-saas-indigo dark:text-white mt-1 block">
            {eyeContactScore}%
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-saas-slate50 dark:bg-dark-bg border border-saas-border dark:border-dark-border text-center">
          <span className="text-[9px] font-medium text-saas-muted uppercase tracking-wider block">Alignment Vector</span>
          <span className="text-sm font-semibold text-saas-indigo mt-1 block truncate">
            {postureState}
          </span>
        </div>
      </div>

      {/* Activator button */}
      <button
        onClick={streamActive ? stopCamera : startCamera}
        className="mt-3.5 w-full py-2 bg-saas-slate100 hover:bg-saas-slate200 dark:bg-saas-slate800 dark:hover:bg-saas-slate700 text-saas-slate700 dark:text-white rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 border border-saas-border/60 dark:border-dark-border"
      >
        <Camera className="w-3.5 h-3.5" />
        {streamActive ? "Disable Camera" : "Enable Camera"}
      </button>
    </div>
  );
}
