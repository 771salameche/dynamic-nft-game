'use client';

import { CharacterTraits } from '@/types/game';
import { useCharacterTraits } from '@/hooks/useGameCharacter';
import { CharacterSprite } from './CharacterSprite';
import { StatBar, ProgressBar } from './StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Zap, Brain, Dna, Info } from 'lucide-react';

interface CharacterDetailProps {
  tokenId: bigint;
  onClose: () => void;
}

export function CharacterDetail({ tokenId, onClose }: CharacterDetailProps) {
  const { data: traits, isLoading } = useCharacterTraits(tokenId);

  if (!traits && !isLoading) return null;

  const characterTraits = traits as unknown as CharacterTraits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Left Side: Sprite and Basic Info */}
        <div className="w-full md:w-1/2 p-8 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center">
          <div className="w-full max-w-[300px]">
            {characterTraits && <CharacterSprite traits={characterTraits} />}
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Character #{tokenId.toString()}
            </h2>
            <div className="flex items-center justify-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-slate-800 ${
                characterTraits?.characterClass === 'Warrior' ? 'text-red-400' :
                characterTraits?.characterClass === 'Mage' ? 'text-blue-400' : 'text-green-400'
              }`}>
                {characterTraits?.characterClass}
              </span>
              <span className="text-slate-500 font-mono text-sm">
                Gen {characterTraits?.generation.toString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Stats and Genetics */}
        <div className="w-full md:w-1/2 p-8 md:p-12 space-y-8 overflow-y-auto max-h-[80vh] md:max-h-none">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-slate-800 rounded w-1/2" />
              <div className="h-32 bg-slate-800 rounded w-full" />
              <div className="h-32 bg-slate-800 rounded w-full" />
            </div>
          ) : (
            <>
              {/* Primary Stats */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <Shield size={18} className="text-purple-400" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Combat Stats</h3>
                </div>
                <div className="space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <StatBar label="Strength" value={characterTraits.strength} max={150} color="bg-red-500" />
                  <StatBar label="Agility" value={characterTraits.agility} max={150} color="bg-green-500" />
                  <StatBar label="Intelligence" value={characterTraits.intelligence} max={150} color="bg-blue-500" />
                </div>
              </section>

              {/* Progress */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <Zap size={18} className="text-yellow-400" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Experience</h3>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <ProgressBar 
                    current={characterTraits.experience} 
                    max={Number(characterTraits.level) * 100} 
                    label={`Level ${characterTraits.level}`}
                    color="bg-yellow-500"
                  />
                </div>
              </section>

              {/* Genetics */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <Dna size={18} className="text-pink-400" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Genetic Markers</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Breeds</p>
                    <p className="text-lg font-mono text-white">{characterTraits.breedCount} / 5</p>
                  </div>
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Mutations</p>
                    <p className="text-lg font-mono text-white">{characterTraits.mutationCount}</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
