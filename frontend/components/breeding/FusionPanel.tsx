'use client';

import { CharacterTraits } from '@/types/game';
import { CharacterSprite } from '../character/CharacterSprite';
import { StatBar } from '../character/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, ArrowRight, Flame } from 'lucide-react';
import { formatUnits } from 'viem';

interface FusionPanelProps {
  traits1?: CharacterTraits;
  traits2?: CharacterTraits;
  fusionCost: bigint;
  onFuse: () => void;
  isLoading: boolean;
}

export function FusionPanel({ traits1, traits2, fusionCost, onFuse, isLoading }: FusionPanelProps) {
  const canFuse = traits1 && traits2 && traits1.level >= 50n && traits2.level >= 50n && !traits1.isFused && !traits2.isFused;

  // Predict fused stats: ((s1 + s2) * 1.2) capped at 150
  const predictStat = (s1: bigint, s2: bigint) => {
    const fused = ((s1 + s2) * 120n) / 100n;
    return fused > 150n ? 150n : fused;
  };

  const fusedStats = traits1 && traits2 ? {
    strength: predictStat(traits1.strength, traits2.strength),
    agility: predictStat(traits1.agility, traits2.agility),
    intelligence: predictStat(traits1.intelligence, traits2.intelligence),
    level: 1n,
    generation: (traits1.generation > traits2.generation ? traits1.generation : traits2.generation) + 1n,
    characterClass: 'Fused',
  } : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Input Character 1 */}
        <div className="relative group">
          <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 flex flex-col items-center">
            {traits1 ? (
              <>
                <div className="w-32 h-32 mb-4">
                  <CharacterSprite traits={traits1} />
                </div>
                <h4 className="font-black text-white uppercase text-sm">LVL {traits1.level.toString()} {traits1.characterClass}</h4>
                {traits1.level < 50n && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-2">Level 50 Required</p>
                )}
              </>
            ) : (
              <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
                <span className="text-slate-700 text-[10px] font-black uppercase">Subject A</span>
              </div>
            )}
          </div>
        </div>

        {/* Fusion Core */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full" />
          <div className="relative z-10 w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(219,39,119,0.5)] animate-pulse">
            <Zap className="w-10 h-10 text-white fill-current" />
          </div>
          <div className="mt-6 flex gap-4 text-pink-500">
            <Flame className="w-6 h-6 animate-bounce" />
            <Flame className="w-6 h-6 animate-bounce delay-100" />
            <Flame className="w-6 h-6 animate-bounce delay-200" />
          </div>
        </div>

        {/* Input Character 2 */}
        <div className="relative group">
          <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 flex flex-col items-center">
            {traits2 ? (
              <>
                <div className="w-32 h-32 mb-4">
                  <CharacterSprite traits={traits2} />
                </div>
                <h4 className="font-black text-white uppercase text-sm">LVL {traits2.level.toString()} {traits2.characterClass}</h4>
                {traits2.level < 50n && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-2">Level 50 Required</p>
                )}
              </>
            ) : (
              <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
                <span className="text-slate-700 text-[10px] font-black uppercase">Subject B</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {fusedStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 border border-pink-500/30 rounded-3xl p-8 shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-pink-500/10 rounded-full border border-pink-500/20">
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Fusion Result</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <StatBar label="Projected STR" value={fusedStats.strength} max={150} color="bg-pink-500" />
                  <StatBar label="Projected AGI" value={fusedStats.agility} max={150} color="bg-pink-500" />
                  <StatBar label="Projected INT" value={fusedStats.intelligence} max={150} color="bg-pink-500" />
                </div>

                <div className="flex items-start gap-2 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500 text-xs">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Fusion is permanent. Parent NFTs will be burned and cannot be recovered.</p>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Requirement Check</div>
                <div className="flex gap-2 mb-6">
                  <RequirementBadge label="LVL 50+" met={traits1!.level >= 50n && traits2!.level >= 50n} />
                  <RequirementBadge label="Not Fused" met={!traits1!.isFused && !traits2!.isFused} />
                </div>

                <div className="mb-8">
                  <span className="text-slate-400 text-xs uppercase font-black">Fusion Cost</span>
                  <div className="text-3xl font-black text-white">{formatUnits(fusionCost, 18)} GAME</div>
                </div>

                <button
                  disabled={!canFuse || isLoading}
                  onClick={onFuse}
                  className="w-full h-16 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      Initialize Fusion
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RequirementBadge({ label, met }: { label: string, met: boolean }) {
  return (
    <div className={`px-2 py-1 rounded border text-[10px] font-black uppercase ${
      met ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
    }`}>
      {label}
    </div>
  );
}
