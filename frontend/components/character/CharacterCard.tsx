'use client';

import { useCharacterTraits } from '@/hooks/useGameCharacter';
import { CharacterSprite } from './CharacterSprite';
import { StatBar, ProgressBar } from './StatBar';
import { motion } from 'framer-motion';
import { CharacterTraits } from '@/types/game';
import { useAccount, useReadContract } from 'wagmi';
import { GAME_CHARACTER_ADDRESS, GAME_CHARACTER_ABI } from '@/lib/contracts';
import { Address } from 'viem';

interface CharacterCardProps {
  tokenId: bigint;
  onClick?: () => void;
  showActions?: boolean;
  onStake?: (tokenId: bigint) => void;
  onUnstake?: (tokenId: bigint) => void;
}

export function CharacterCard({ tokenId, onClick, showActions, onStake, onUnstake }: CharacterCardProps) {
  const { data: traits, isLoading } = useCharacterTraits(tokenId);
  const { data: owner } = useReadContract({
    address: GAME_CHARACTER_ADDRESS,
    abi: GAME_CHARACTER_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  });

  const { address } = useAccount();
  const isOwner = owner === address;

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-slate-900 rounded-2xl border border-slate-800 animate-pulse flex items-center justify-center">
        <div className="text-slate-700">Loading Character...</div>
      </div>
    );
  }

  if (!traits) return null;

  const characterTraits = traits as unknown as CharacterTraits;
  const xpForNextLevel = Number(characterTraits.level) * 100;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-900 rounded-2xl border ${
        isOwner ? 'border-purple-500/50' : 'border-slate-800'
      } group cursor-pointer shadow-xl`}
    >
      {/* Card Header */}
      <div className="p-4 flex justify-between items-center bg-slate-950/50">
        <span className="text-xs font-mono text-slate-500">#{tokenId.toString()}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 ${
          characterTraits.characterClass === 'Warrior' ? 'text-red-400' :
          characterTraits.characterClass === 'Mage' ? 'text-blue-400' : 'text-green-400'
        }`}>
          {characterTraits.characterClass}
        </span>
      </div>

      {/* Character Image */}
      <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <CharacterSprite traits={characterTraits} />
      </div>

      {/* Stats Section */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatBar label="STR" value={characterTraits.strength} max={150} color="bg-red-500" />
          <StatBar label="AGI" value={characterTraits.agility} max={150} color="bg-green-500" />
          <StatBar label="INT" value={characterTraits.intelligence} max={150} color="bg-blue-500" />
        </div>

        <ProgressBar 
          label="Experience" 
          current={characterTraits.experience} 
          max={xpForNextLevel} 
          color="bg-purple-500" 
        />
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        <span>Generation {characterTraits.generation.toString()}</span>
        <span>Mutation {characterTraits.mutationCount}</span>
      </div>

      {/* Action Overlay (Hidden by default) */}
      {showActions && (
        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 space-y-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className="w-full py-2 bg-purple-600 rounded-lg font-bold hover:bg-purple-500 transition-colors"
          >
            View Details
          </button>
          {isOwner && onStake && (
            <button 
              onClick={(e) => { e.stopPropagation(); onStake(tokenId); }}
              className="w-full py-2 bg-emerald-600 rounded-lg font-bold hover:bg-emerald-500 transition-colors"
            >
              Stake Character
            </button>
          )}
          {isOwner && onUnstake && (
            <button 
              onClick={(e) => { e.stopPropagation(); onUnstake(tokenId); }}
              className="w-full py-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition-colors"
            >
              Unstake
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
