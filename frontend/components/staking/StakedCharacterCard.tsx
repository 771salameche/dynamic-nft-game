'use client';

import { useCharacterTraits } from '@/hooks/useGameCharacter';
import { useCalculateRewards, useCurrentTime } from '@/hooks/useStaking';
import { CharacterSprite } from '../character/CharacterSprite';
import { ProgressBar } from '../character/StatBar';
import { Button } from '../ui/button';
import { formatUnits } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { CharacterTraits, StakeInfo } from '@/types/game';

interface StakedCharacterCardProps {
  stake: StakeInfo;
  onUnstake: (tokenId: bigint) => void;
}

export function StakedCharacterCard({ stake, onUnstake }: StakedCharacterCardProps) {
  const { data: traits } = useCharacterTraits(stake.tokenId);
  const { data: rewards } = useCalculateRewards(stake.tokenId);
  const now = useCurrentTime();
  
  // Simulated milestone (e.g., 30 days for a level up or bonus)
  const MILESTONE = 30 * 24 * 60 * 60; // 30 days in seconds
  const stakeDuration = now - Number(stake.stakedAt);
  const progress = stakeDuration % MILESTONE;
  
  if (!traits) return (
    <div className="h-48 bg-slate-900 rounded-xl animate-pulse" />
  );

  const characterTraits = traits as unknown as CharacterTraits;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-purple-500/30 rounded-2xl overflow-hidden group shadow-lg hover:shadow-purple-500/10 transition-all"
    >
      <div className="grid grid-cols-2">
        <div className="p-4 bg-slate-950/50 flex items-center justify-center">
          <div className="w-24 h-24">
            <CharacterSprite traits={characterTraits} />
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-black text-white text-sm">#{stake.tokenId.toString()} {characterTraits.characterClass}</h4>
            <p className="text-[10px] text-slate-500">Staked {formatDistanceToNow(Number(stake.stakedAt) * 1000)} ago</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Earned</p>
            <p className="text-lg font-black text-emerald-400 leading-none">
              {rewards ? Number(formatUnits(rewards as bigint, 18)).toFixed(4) : '0.0000'}
              <span className="text-[10px] ml-1">GAME</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-950/30 border-t border-slate-800 space-y-4">
        <ProgressBar 
          label="Next Bonus Milestone"
          current={progress}
          max={MILESTONE}
          color="bg-emerald-500"
        />
        
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full font-bold uppercase tracking-widest text-[10px]"
          onClick={() => onUnstake(stake.tokenId)}
        >
          Unstake Character
        </Button>
      </div>
    </motion.div>
  );
}
