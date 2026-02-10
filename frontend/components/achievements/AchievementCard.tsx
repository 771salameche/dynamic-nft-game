'use client';

import { Achievement, PlayerAchievement } from '@/types/game';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Trophy, Lock, CheckCircle2, Star } from 'lucide-react';
import { formatUnits } from 'viem';
import { formatDate, cn } from '@/lib/utils';
import { ProgressBar } from '../character/StatBar';

interface AchievementCardProps {
  achievement: Achievement;
  playerProgress?: PlayerAchievement;
}

export function AchievementCard({ achievement, playerProgress }: AchievementCardProps) {
  const unlocked = playerProgress?.isUnlocked || false;
  const progress = Number(playerProgress?.progress || 0);

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'text-orange-500 bg-orange-500/10 border-orange-500/20'; // Bronze
      case 2: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'; // Silver
      case 3: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'; // Gold
      case 4: return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'; // Platinum
      case 5: return 'text-purple-500 bg-purple-500/10 border-purple-500/20'; // Diamond
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getTierName = (tier: number) => {
    const tiers = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return tiers[tier] || 'Standard';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "relative p-6 rounded-3xl border transition-all duration-300",
        unlocked 
          ? "bg-slate-900 border-purple-500/30 shadow-lg shadow-purple-500/5" 
          : "bg-slate-900/50 border-slate-800 opacity-75"
      )}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          unlocked ? "bg-purple-600 shadow-lg shadow-purple-900/40" : "bg-slate-800"
        )}>
          {unlocked ? (
            <Trophy className="w-6 h-6 text-white" />
          ) : (
            <Lock className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
          getTierColor(achievement.tier)
        )}>
          {getTierName(achievement.tier)}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{achievement.name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{achievement.description}</p>
      </div>

      {!unlocked && progress > 0 && (
        <div className="mb-6 space-y-2">
          <ProgressBar
            current={progress}
            max={100}
            label="Progress"
            color="bg-purple-500"
          />
        </div>
      )}

      {unlocked && (
        <div className="flex items-center gap-2 mb-6 text-emerald-400 text-xs font-bold uppercase">
          <CheckCircle2 className="w-4 h-4" />
          Unlocked {playerProgress?.unlockedAt ? formatDate(playerProgress.unlockedAt) : ''}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs font-bold text-white">+{achievement.xpReward.toString()} XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-primary" />
            <span className="text-xs font-bold text-white">+{formatUnits(achievement.tokenReward, 18)} GAME</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <UsersIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase">{achievement.unlockedCount.toString()} Unlocks</span>
        </div>
      </div>

      {unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
