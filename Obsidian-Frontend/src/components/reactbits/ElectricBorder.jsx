import { useEffect, useRef } from 'react';

export default function ElectricBorder({
  children,
  color = '#7df9ff',
  speed = 1,
  chaos = 0.5,
  thickness = 2,
  style = {},
  className = '',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;

    let animationFrameId;
    let offset = 0;

    const drawElectricBorder = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const segments = 50;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;

      // Top border
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = (width / segments) * i;
        const y = Math.sin(offset + i * 0.5) * chaos * 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Right border
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = width - Math.sin(offset + i * 0.5) * chaos * 3;
        const y = (height / segments) * i;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bottom border
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = width - (width / segments) * i;
        const y = height - Math.sin(offset + i * 0.5) * chaos * 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Left border
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = Math.sin(offset + i * 0.5) * chaos * 3;
        const y = height - (height / segments) * i;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += 0.05 * speed;
      animationFrameId = requestAnimationFrame(drawElectricBorder);
    };

    drawElectricBorder();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed, chaos, thickness]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        padding: thickness * 2,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

