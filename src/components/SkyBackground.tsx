import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function SkyBackground() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_#0d1d31_0%,_#0c0d13_100%)]">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.1, 0.8, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
      
      {/* Falling star effect */}
      <FallingStars />
    </div>
  );
}

function FallingStars() {
  const [fStars, setFStars] = useState<{ id: number; left: number; top: number; delay: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFStars(prev => [
        ...prev.slice(-5),
        { id: Date.now(), left: Math.random() * 100, top: Math.random() * 50, delay: 0 }
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {fStars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute h-[1px] w-[60px] bg-gradient-to-r from-transparent via-white/80 to-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            transform: "rotate(35deg)",
          }}
          initial={{ x: -100, y: -100, opacity: 0 }}
          animate={{ x: 300, y: 300, opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, ease: "linear" }}
        />
      ))}
    </>
  );
}
