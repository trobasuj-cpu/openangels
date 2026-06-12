import React, { useEffect, useState } from 'react';

export default function BackgroundAnimation() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Use requestAnimationFrame for smoother performance
      requestAnimationFrame(() => {
        setMousePos({
          x: e.clientX,
          y: e.clientY,
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white dark:bg-zinc-950">
      {/* Subtle grid background to give a "data" feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]" />
      
      {/* Dynamic mouse-following glow (Spotlight effect) */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] transition-transform duration-700 ease-out will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.1) 40%, transparent 70%)',
          transform: `translate(${mousePos.x - 400}px, ${mousePos.y - 400}px)`
        }}
      />
    </div>
  );
}
