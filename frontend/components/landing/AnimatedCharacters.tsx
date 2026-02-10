'use client';

import { motion } from 'framer-motion';
import { CharacterSprite } from '../character/CharacterSprite';
import { CharacterTraits } from '@/types/game';
import { useEffect, useState } from 'react';

export function AnimatedCharacters() {
  const [isClient, setIsClient] = useState(false);
  const classes = ['Warrior', 'Mage', 'Rogue'];

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const getMockTraits = (className: string): CharacterTraits => ({
    level: 10n,
    strength: 50n,
    agility: 50n,
    intelligence: 50n,
    experience: 0n,
    lastTrainedAt: 0,
    generation: 1n,
    characterClass: className,
    genetics: {
      strengthDominant: false,
      agilityDominant: false,
      intelligenceDominant: false,
      hiddenStrength: 0,
      hiddenAgility: 0,
      hiddenIntelligence: 0,
    },
    mutationCount: 0,
    breedCount: 0,
    isFused: false,
  });

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center pointer-events-none select-none">
      {/* Background Particles Simulation */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {isClient && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, "-10%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-purple-500 rounded-full"
          />
        ))}
      </div>

      <div className="relative flex items-center justify-center gap-4 lg:gap-12">
        {classes.map((cls, i) => (
          <motion.div
            key={cls}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: i === 1 ? 1.2 : 0.8, 
              y: 0,
              rotate: i === 0 ? -10 : i === 2 ? 10 : 0
            }}
            transition={{ 
              duration: 0.8, 
              delay: i * 0.2,
              type: "spring",
              stiffness: 100 
            }}
            className={cls === 'Mage' ? 'z-20' : 'z-10'}
          >
            <motion.div
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                delay: i * 0.5,
                ease: "easeInOut" 
              }}
              className="w-32 h-32 lg:w-48 lg:h-48 drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]"
            >
              <CharacterSprite traits={getMockTraits(cls)} />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}