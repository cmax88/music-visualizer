// ParticleVisualizer.jsx
import { useEffect, useRef, useState } from 'react';
import ColorThief from 'color-thief-browser';

export default function ParticleVisualizer({ analyser, albumArt }) {
  const canvasRef = useRef(null);
  const [gradientColors, setGradientColors] = useState([
    [160, 60, 200], // fallback start
    [50, 100, 255]  // fallback end
  ]);

  useEffect(() => {
    if (albumArt) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = albumArt;
      img.onload = async () => {
        const palette = await ColorThief.getPalette(img, 2);
        console.log("Extracted palette:", palette);
        if (palette?.length >= 2) {
          setGradientColors(palette);
        }
      };
    }
  }, [albumArt]);

  const getGradientColor = (t, alpha = 0.6) => {
    const [start, end] = gradientColors;
    const r = Math.round(start[0] + (end[0] - start[0]) * t);
    const g = Math.round(start[1] + (end[1] - start[1]) * t);
    const b = Math.round(start[2] + (end[2] - start[2]) * t);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId;
    let albumImage = null;

    if (albumArt) {
      albumImage = new Image();
      albumImage.src = albumArt;
    }

    if (analyser) {
      analyser.fftSize = 512;
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const waveform = new Uint8Array(analyser.fftSize);

      let frame = 0;

      const drawReactiveWave = (ctx, width, height, bassLevel, t, position = 'bottom') => {
        const isTop = position === 'top';
        const waveBase = isTop ? 100 : height - 100;

        const amplitude = 5 + bassLevel * 10;
        const pulse = 1 + Math.sin(t * 0.1) * 0.3 + bassLevel * 1.5;
        const frequency = 0.005 + bassLevel * 0.005;
        const layers = 1;

        for (let layer = 0; layer < layers; layer++) {
          const offset = layer * 30;
          const phase = t * 0.03 + layer;

          ctx.beginPath();
          ctx.moveTo(0, isTop ? 0 : height);

          for (let x = 0; x <= width; x += 8) {
            const y = waveBase + Math.sin(x * frequency + phase) * amplitude * pulse;
            ctx.lineTo(x, isTop ? y + offset : y - offset);
          }

          ctx.lineTo(width, isTop ? 0 : height);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, isTop ? 0 : waveBase - 50, 0, isTop ? waveBase + 300 : height);
          grad.addColorStop(0, getGradientColor(0.0, 0.3));
          grad.addColorStop(1, isTop ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.7)');

          ctx.fillStyle = grad;
          ctx.fill();
        }
      };

      const render = () => {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(waveform);

        const bass = freqData.slice(0, 20);
        const bassAvg = bass.reduce((a, b) => a + b, 0) / bass.length;
        const bassLevel = bassAvg / 255;

        // Background fade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // 🎵 Album art
        if (albumImage && albumImage.complete) {
          const size = Math.min(width, height) * 0.6;
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.drawImage(albumImage, centerX - size / 2, centerY - size / 2, size, size);
          ctx.restore();
        }

        drawReactiveWave(ctx, width, height, bassLevel, frame, 'top');
        drawReactiveWave(ctx, width, height, bassLevel, frame, 'bottom');

        // 🎧 Waveform
        ctx.beginPath();
        const waveformGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        waveformGradient.addColorStop(0, getGradientColor(0));
        waveformGradient.addColorStop(1, getGradientColor(1));
        ctx.strokeStyle = waveformGradient;
        ctx.lineWidth = 2;
        for (let i = 0; i < waveform.length; i++) {
          const x = (i / waveform.length) * width;
          const y = (waveform[i] / 255) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 💓 Pulse
        const pulseRadius = 50 + bassLevel * 100;
        const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, pulseRadius);
        grad.addColorStop(0, getGradientColor(0.3));
        grad.addColorStop(1, getGradientColor(0.9));
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        frame++;
        animationFrameId = requestAnimationFrame(render);
      };

      render();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, albumArt, gradientColors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        background: '#000',
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
