import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash screen for 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center z-50 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        {/* Logo with shadow effect (reduced gap, align image top to avoid asset padding) */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',    
            delay: 0.2,
          }}
          className="relative drop-shadow-2xl"
        >
          <img
            src="/logo(1).png"
            alt="School System Logo"
            className="w-96 h-96 object-contain object-top filter drop-shadow-2xl mb-0"
          />
        </motion.div>

        {/* Text animation (pulled up slightly) */}
        <motion.div
          className="text-center -mt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.4,
            ease: 'easeOut',
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-1">School System</h1>
          <p className="text-blue-100 text-sm tracking-widest">
            Educational Management Platform
          </p>
        </motion.div>

        {/* Loading indicator (smaller top margin) */}
        <motion.div
          className="mt-4 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
