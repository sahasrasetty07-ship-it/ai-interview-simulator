import React, { useEffect, useRef } from 'react';

export default function AudioVisualizer({ isRecording }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let phase = 0;

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Clean, premium waves (no neon glows, soft opacity layers)
      const waves = [
        { amplitude: isRecording ? 24 : 1.5, speed: 0.08, color: 'rgba(79, 70, 229, 0.65)', freq: 0.025 },
        { amplitude: isRecording ? 16 : 1.0, speed: 0.12, color: 'rgba(129, 140, 248, 0.45)', freq: 0.035 },
        { amplitude: isRecording ? 8  : 2.0, speed: 0.06, color: 'rgba(139, 92, 246, 0.35)', freq: 0.015 },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 1.8;
        
        for (let x = 0; x < width; x++) {
          const edgeFactor = Math.sin((x / width) * Math.PI); // Smooth boundary fade-out
          const y = centerY + Math.sin(x * w.freq + phase * w.speed) * w.amplitude * edgeFactor;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      phase += 0.4;
      animationId = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2.5">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={70} 
        className="w-full max-w-[400px] h-[70px] bg-saas-slate50 dark:bg-dark-bg/60 rounded-xl border border-saas-border dark:border-dark-border"
      />
      <div className="flex items-center gap-2 mt-3 font-mono text-[10px] font-medium tracking-wide">
        {isRecording ? (
          <>
            <span className="w-2 h-2 rounded-full bg-saas-indigo animate-ping" />
            <span className="text-saas-indigo dark:text-saas-indigo font-semibold">STREAMING AUDIBLE SIGNAL</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-saas-muted dark:bg-dark-muted" />
            <span className="text-saas-muted dark:text-dark-muted uppercase">Voice Capture Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
