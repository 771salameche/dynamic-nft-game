'use client';

import { CharacterCard } from './CharacterCard';
import { motion } from 'framer-motion';

interface CharacterGridProps {
  tokenIds: bigint[];
  onCharacterClick?: (tokenId: bigint) => void;
  isLoading?: boolean;
}

export function CharacterGrid({ tokenIds, onCharacterClick, isLoading }: CharacterGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-full h-[400px] bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tokenIds.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
        <p className="text-slate-500 font-medium italic">No characters found in this collection.</p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {tokenIds.map((id) => (
        <motion.div key={id.toString()} variants={item}>
          <CharacterCard 
            tokenId={id} 
            onClick={() => onCharacterClick?.(id)}
            showActions 
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
