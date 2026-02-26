'use client';

import { useAccount } from 'wagmi';
import { useAchievements } from '@/hooks/useAchievements';
import { Trophy, Medal, Star, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const ALL_ACHIEVEMENTS = [
  { id: 1n, name: 'First Blood', desc: 'Secure your first victory in battle.', icon: <Target className="w-8 h-8 text-primary" /> },
  { id: 2n, name: 'Veteran Staker', desc: 'Stake a hero for 7 consecutive days.', icon: <Star className="w-8 h-8 text-secondary" /> },
  { id: 3n, name: 'Master Breeder', desc: 'Successfully breed a new generation hero.', icon: <Trophy className="w-8 h-8 text-yellow-500" /> },
  { id: 4n, name: 'Legendary Status', desc: 'Reach level 50 with any character.', icon: <Medal className="w-8 h-8 text-purple-500" /> },
];

function AchievementCard({ achievement, completed }: { achievement: typeof ALL_ACHIEVEMENTS[0], completed: boolean }) {
  const { useProgress } = useAchievements();
  const { data: progressData } = useProgress(achievement.id);

  const [current, required, isCompletedFromContract] = progressData || [0n, 1n, false];
  const progressPercent = Math.min((Number(current) / Number(required)) * 100, 100);

  const actuallyCompleted = completed || isCompletedFromContract;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border ${actuallyCompleted ? 'border-primary bg-primary/5' : 'border-border bg-card opacity-70'
        } p-6 flex flex-col items-center text-center transition-all`}
    >
      {actuallyCompleted && (
        <div className="absolute top-0 right-0 p-2 opacity-20">
          <Target className="w-16 h-16 text-primary" />
        </div>
      )}

      <div className={`mb-4 p-4 rounded-full ${actuallyCompleted ? 'bg-primary/20' : 'bg-secondary/10 grayscale'}`}>
        {achievement.icon}
      </div>

      <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
      <p className="text-sm text-muted-foreground mb-6 h-10">{achievement.desc}</p>

      <div className="w-full mt-auto">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>PROGRESS</span>
          <span>{actuallyCompleted ? 'COMPLETE' : `${current.toString()} / ${required.toString()}`}</span>
        </div>
        <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${actuallyCompleted ? 'bg-primary' : 'bg-muted-foreground'}`}
            style={{ width: `${actuallyCompleted ? 100 : progressPercent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function AchievementsPage() {
  const { isConnected } = useAccount();
  const { usePlayerAchievements } = useAchievements();
  const { data: completedIds } = usePlayerAchievements();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Achievement Library</h1>
        <p className="text-xl text-muted-foreground">Connect your wallet to track your progress.</p>
      </div>
    );
  }

  const completedSet = new Set((completedIds as readonly bigint[])?.map((id: bigint) => Number(id)) || []);

  const unlockedCount = completedSet.size;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Hall of Feats</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Unlock soulbound badges by completing epic quests across the ecosystem.
        </p>

        <div className="inline-flex items-center gap-4 bg-card border border-border px-6 py-4 rounded-full shadow-sm">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span className="font-bold text-lg">Completion Rate:</span>
          <div className="text-2xl font-black text-primary">
            {unlockedCount} / {totalCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ALL_ACHIEVEMENTS.map((achievement) => (
          <AchievementCard
            key={Number(achievement.id)}
            achievement={achievement}
            completed={completedSet.has(Number(achievement.id))}
          />
        ))}
      </div>
    </div>
  );
}
