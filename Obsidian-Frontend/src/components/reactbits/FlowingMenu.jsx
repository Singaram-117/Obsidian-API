import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlowingMenu({ items = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e, index) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setHoveredIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-gray-950 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dots opacity-5"></div>
      
      {/* Menu Items */}
      <div className="relative z-10 space-y-2">
        {items.map((item, index) => (
          <motion.a
            key={index}
            href={item.link}
            className="block relative group"
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseLeave={() => setHoveredIndex(null)}
            whileHover={{ x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center space-x-4 py-4 px-6">
              {/* Text */}
              <h2 className="font-merriweather text-5xl md:text-7xl font-black text-white/80 group-hover:text-white transition-colors duration-300">
                {item.text}
              </h2>
              
              {/* Arrow */}
              <motion.div
                className="text-4xl text-blue-500 opacity-0 group-hover:opacity-100"
                initial={{ x: -20, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                →
              </motion.div>
            </div>
            
            {/* Underline */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
        ))}
      </div>

      {/* Flowing Image Preview */}
      <AnimatePresence>
        {hoveredIndex !== null && items[hoveredIndex]?.image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: mousePosition.x - 150,
              y: mousePosition.y - 150,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute w-64 h-48 rounded-2xl overflow-hidden pointer-events-none z-50"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <img 
              src={items[hoveredIndex].image} 
              alt={items[hoveredIndex].text}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

