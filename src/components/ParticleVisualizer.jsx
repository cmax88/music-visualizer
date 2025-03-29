// ParticleVisualizer.jsx - Visualizer Component with Audio + Blur Magic
import { useEffect, useRef, useState } from 'react';
import ColorThief from 'color-thief-browser';

export default function ParticleVisualizer({ analyser, albumArt }) {
  const canvasRef = useRef(null);
  const [gradientColors, setGradientColors] = useState([
    [160, 60, 200], // Purple default
    [50, 100, 255]  // Blue default
  ]);

  // 🎨 Extract dominant gradient from album art
  useEffect(() => {
    if (albumArt) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = albumArt;
      img.onload = async () => {
        try {
          const palette = await ColorThief.getPalette(img, 2);
          if (palette?.length >= 2) {
            setGradientColors(palette);
          }
        } catch (e) {
          console.error("Color extraction failed", e);
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

    const offscreenCanvas = document.createElement('canvas');
    const offCtx = offscreenCanvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId;
    let albumImage = null;
    const ripples = [];
    const stars = Array.from({ length: 150 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      distance: Math.random() * 1000 + 200,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.001 + 0.0005,
    }));

    if (albumArt) {
      albumImage = new Image();
      albumImage.src = albumArt;
    }

    if (analyser) {
      analyser.fftSize = 512;
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const waveform = new Uint8Array(analyser.fftSize);

      let frame = 0;
      let rotation = 0;

      const drawReactiveWave = (ctx, width, height, bassLevel, t, position = 'bottom') => {
        const isTop = position === 'top';
        const waveBase = isTop ? 100 : height - 100;
        const amplitude = 5 + bassLevel * 10;
        const pulse = 1 + Math.sin(t * 0.1) * 0.3 + bassLevel * 1.5;
        const frequency = 0.005 + bassLevel * 0.005;

        ctx.beginPath();
        ctx.moveTo(0, isTop ? 0 : height);

        for (let x = 0; x <= width; x += 8) {
          const y = waveBase + Math.sin(x * frequency + t * 0.03) * amplitude * pulse;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, isTop ? 0 : height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, isTop ? 0 : waveBase - 50, 0, isTop ? waveBase + 300 : height);
        grad.addColorStop(0, getGradientColor(0.0, 0.3));
        grad.addColorStop(1, isTop ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.7)');

        ctx.fillStyle = grad;
        ctx.fill();
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

        offCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        offCtx.fillRect(0, 0, width, height);

        // ✨ Starfield
        rotation += 0.001;
        offCtx.save();
        offCtx.translate(centerX, centerY);
        offCtx.rotate(rotation);
        stars.forEach(star => {
          const x = Math.cos(star.angle) * star.distance;
          const y = Math.sin(star.angle) * star.distance;
          star.angle += star.speed;
          offCtx.beginPath();
          offCtx.arc(x, y, star.size, 0, Math.PI * 2);
          offCtx.fillStyle = `rgba(255, 255, 255, ${0.2 + bassLevel * 0.4})`;
          offCtx.fill();
        });
        offCtx.restore();

        // 🖼️ Album art (breathing)
        if (albumImage && albumImage.complete) {
          const baseSize = Math.min(width, height) * 0.6;
          const scale = 1 + Math.sin(frame * 0.03) * 0.02 + bassLevel * 0.1;
          const size = baseSize * scale;
          offCtx.save();
          offCtx.globalAlpha = 0.08;
          offCtx.translate(centerX, centerY);
          offCtx.drawImage(albumImage, -size / 2, -size / 2, size, size);
          offCtx.restore();
        }

        // 🌊 Top + Bottom waves
        drawReactiveWave(offCtx, width, height, bassLevel, frame, 'top');
        drawReactiveWave(offCtx, width, height, bassLevel, frame, 'bottom');

        // 📈 Waveform line
        offCtx.beginPath();
        const waveformGradient = offCtx.createLinearGradient(0, 0, canvas.width, 0);
        waveformGradient.addColorStop(0, getGradientColor(0));
        waveformGradient.addColorStop(1, getGradientColor(1));
        offCtx.strokeStyle = waveformGradient;
        offCtx.lineWidth = 3;
        for (let i = 0; i < waveform.length; i++) {
          const x = (i / waveform.length) * width;
          const y = (waveform[i] / 255) * height;
          if (i === 0) offCtx.moveTo(x, y);
          else offCtx.lineTo(x, y);
        }
        offCtx.stroke();

        // 💓 Organic center pulse
        const pulseRadius = 50 + bassLevel * 100;
        const segments = 60;
        offCtx.save();
        offCtx.translate(centerX, centerY);
        offCtx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const noise =
            Math.sin(i * 0.5 + frame * 0.05) +
            Math.cos(i * 0.3 + frame * 0.08 + Math.sin(frame * 0.02)) +
            (Math.random() - 0.5) * 0.5;
          const offset = noise * 10 * bassLevel;
          const r = pulseRadius + offset;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) offCtx.moveTo(x, y);
          else offCtx.lineTo(x, y);
        }
        offCtx.closePath();
        offCtx.fillStyle = getGradientColor(0.5, 0.35);
        offCtx.shadowColor = getGradientColor(1, 0.5);
        offCtx.shadowBlur = 40;
        offCtx.fill();
        offCtx.restore();

        // 🌊 Ripples
        if (pulseRadius > 120 && frame % 10 === 0) {
          ripples.push({ radius: pulseRadius, alpha: 0.5 });
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const ripple = ripples[i];
          ripple.radius += 4;
          ripple.alpha -= 0.003;
          if (ripple.alpha <= 0) {
            ripples.splice(i, 1);
            continue;
          }
          offCtx.beginPath();
          offCtx.arc(centerX, centerY, ripple.radius, 0, Math.PI * 2);
          offCtx.strokeStyle = `rgba(160, 60, 200, ${ripple.alpha})`;
          offCtx.lineWidth = 2;
          offCtx.stroke();
        }

        // 🌀 Blur based on ripple count
        if (!window._blurControl) window._blurControl = { amount: 0 };
        const rippleCount = ripples.length;
        const targetBlur = rippleCount > 10 ? 3 : 0;
        const blurSpeed = 0.05;
        window._blurControl.amount += (targetBlur - window._blurControl.amount) * blurSpeed;
        const blurAmount = window._blurControl.amount;

        ctx.clearRect(0, 0, width, height);
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(offscreenCanvas, 0, 0);
        ctx.filter = 'none';

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