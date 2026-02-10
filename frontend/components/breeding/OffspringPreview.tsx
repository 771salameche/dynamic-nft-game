'use client';

import { CharacterTraits } from '@/types/game';
import { CharacterSprite } from '../character/CharacterSprite';
import { StatBar } from '../character/StatBar';
import { motion } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';

interface OffspringPreviewProps {
  traits1?: CharacterTraits;
  traits2?: CharacterTraits;
}

export function OffspringPreview({ traits1, traits2 }: OffspringPreviewProps) {
  if (!traits1 || !traits2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 h-full min-h-[400px]">
        <Sparkles className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">
          Select two parents to see<br />offspring prediction
        </p>
      </div>
    );
  }

  // Calculate predicted offspring stats (average ± 10% simulated in UI for flavor)
  const predictedStats: CharacterTraits = {
    level: 1n,
    strength: (traits1.strength + traits2.strength) / 2n,
    agility: (traits1.agility + traits2.agility) / 2n,
    intelligence: (traits1.intelligence + traits2.intelligence) / 2n,
    experience: 0n,
    lastTrainedAt: 0,
    generation: (traits1.generation > traits2.generation ? traits1.generation : traits2.generation) + 1n,
    characterClass: traits1.level >= traits2.level ? traits1.characterClass : traits2.characterClass,
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/50 border border-purple-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4">
        <Sparkles className="w-6 h-6 text-yellow-500/50 animate-pulse" />
      </div>

      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
        Offspring Prediction
      </h3>

      <div className="flex flex-col items-center mb-8">
        <div className="w-48 h-48 opacity-70 filter brightness-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <CharacterSprite traits={predictedStats} />
        </div>
        <div className="mt-4 px-4 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
          <span className="text-xs font-black text-purple-400 uppercase tracking-widest">
            GEN {predictedStats.generation.toString()} {predictedStats.characterClass}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2">
          <Info className="w-3 h-3" />
          Estimated Stats (±10% variance)
        </div>
        
        <StatBar label="Predicted STR" value={predictedStats.strength} max={100} color="bg-red-500" />
        <StatBar label="Predicted AGI" value={predictedStats.agility} max={100} color="bg-green-500" />
        <StatBar label="Predicted INT" value={predictedStats.intelligence} max={100} color="bg-blue-500" />
      </div>

      <div className="mt-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Genetic Potential</p>
        <div className="flex gap-2">
          {traits1.characterClass === traits2.characterClass ? (
            <div className="px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
              Class Purebred Bonus
            </div>
          ) : (
            <div className="px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20 text-[10px] text-blue-400 font-bold">
              Hybridization
            </div>
          )}
          {(traits1.strength > 90n && traits2.strength > 90n) && (
            <div className="px-2 py-1 bg-red-500/10 rounded border border-red-500/20 text-[10px] text-red-400 font-bold">
              Elite Strength Line
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
