import React, { useEffect, useRef } from 'react';

export default function BackgroundCanvas({ zIndex = -1, position = 'fixed' }: { zIndex?: number, position?: 'fixed' | 'absolute' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2 for performance
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Lightweight floating geometries
    const shapes = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 30 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.01,
      type: Math.random() > 0.5 ? 'rect' : 'circle',
      depth: Math.random()
    }));

    let time = 0;

    const render = () => {
      time += 0.003;

      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Soft subtle ambient glow (Single batch)
      const cx2 = width * 0.8 + Math.cos(time * 0.8) * 100;
      const cy2 = height * 0.7 + Math.sin(time * 0.6) * 100;

      const grad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 400);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.03)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 400, 0, Math.PI * 2);
      ctx.fill();

      // 2. Mouse interactive glow (white)
      if (mouseX > -500) {
        const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250);
        mouseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        mouseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = mouseGrad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 250, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Optimized floating geometric outlines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 1;

      shapes.forEach(shape => {
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rotation += shape.vRot;

        if (shape.x < -60) shape.x = width + 60;
        if (shape.x > width + 60) shape.x = -60;
        if (shape.y < -60) shape.y = height + 60;
        if (shape.y > height + 60) shape.y = -60;

        const pX = (mouseX - width / 2) * shape.depth * 0.015;
        const pY = (mouseY - height / 2) * shape.depth * 0.015;

        ctx.save();
        ctx.translate(shape.x + pX, shape.y + pY);
        ctx.rotate(shape.rotation);
        
        ctx.beginPath();
        if (shape.type === 'rect') {
          ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
        } else {
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  );
}
