import { motion } from 'framer-motion';

export default function AnimatedCard({ 
  children, 
  className = '',
  delay = 0,
  ...props 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      className={`relative glass-dark rounded-2xl p-6 border border-gray-800/50 backdrop-blur-xl overflow-hidden group ${className}`}
      {...props}
    >
      {/* Gradient Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Border Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(145deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

