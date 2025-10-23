import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';

export default function ChromaGrid({ 
  items = [], 
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = "power3.out" 
}) {
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: damping * 100, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-950"
      style={{ perspective: '1000px' }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      
      {/* Items */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              className="relative group cursor-pointer"
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              whileHover={{ scale: 1.05, z: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Glow Effect */}
              <motion.div
                className="absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: item.gradient || item.borderColor,
                }}
              />
              
              {/* Card */}
              <div 
                className="relative glass rounded-2xl p-1 overflow-hidden"
                style={{
                  borderColor: item.borderColor || '#3B82F6',
                  borderWidth: '2px',
                }}
              >
                <div className="relative rounded-xl overflow-hidden">
                  {/* Image */}
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: item.gradient || `linear-gradient(145deg, ${item.borderColor}, #000)`,
                      mixBlendMode: 'multiply',
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="p-4 bg-gray-900/90 backdrop-blur">
                  <h3 className="font-merriweather text-lg font-bold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {item.subtitle}
                  </p>
                  {item.handle && (
                    <p className="text-xs" style={{ color: item.borderColor }}>
                      {item.handle}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

