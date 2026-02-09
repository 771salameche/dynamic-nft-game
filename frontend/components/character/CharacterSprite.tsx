'use client';

import { CharacterTraits } from '@/types/game';
import { motion } from 'framer-motion';

export function CharacterSprite({ traits }: { traits: CharacterTraits }) {
  const getClassColor = (characterClass: string) => {
    switch (characterClass) {
      case 'Warrior':
        return '#E63946'; // Red
      case 'Mage':
        return '#457B9D'; // Blue
      case 'Rogue':
        return '#2A9D8F'; // Green
      case 'Fused':
        return '#A855F7'; // Purple
      default:
        return '#6C757D'; // Gray
    }
  };

  const color = getClassColor(traits.characterClass);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full aspect-square flex items-center justify-center"
    >
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
        <defs>
          <radialGradient id={`grad-${traits.characterClass}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0f172a', stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        
        {/* Glow Effect */}
        <circle cx="100" cy="100" r="90" fill={`url(#grad-${traits.characterClass})`} opacity="0.3" />
        
        {/* Main Body */}
        <motion.circle
          cx="100"
          cy="100"
          r="70"
          fill={color}
          stroke="#1e293b"
          strokeWidth="4"
          animate={{
            r: [70, 72, 70],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Emblem */}
        <text
          x="100"
          y="115"
          textAnchor="middle"
          fill="white"
          fontSize="60"
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          {traits.characterClass[0]}
        </text>
        
        {/* Level Badge */}
        <rect x="70" y="145" width="60" height="25" rx="12" fill="#1e293b" />
        <text
          x="100"
          y="163"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          Lv.{traits.level.toString()}
        </text>
      </svg>
    </motion.div>
  );
}
