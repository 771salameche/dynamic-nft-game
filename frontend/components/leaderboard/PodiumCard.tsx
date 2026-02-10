'use client';

import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { truncateAddress } from '@/lib/utils';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodiumCardProps {
  rank: number;
  entry: LeaderboardEntry;
  highlighted: boolean;
}

export function PodiumCard({ rank, entry, highlighted }: PodiumCardProps) {
  const isFirst = rank === 1;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.2 }}
      className={cn(
        "relative flex flex-col items-center p-6 rounded-3xl border transition-all duration-500",
        isFirst ? "bg-gradient-to-b from-yellow-500/20 to-slate-900 border-yellow-500/50 scale-110 z-10" : "bg-slate-900/80 border-slate-800",
        highlighted && "ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
        rank === 2 && "order-first md:mt-8",
        rank === 3 && "md:mt-12"
      )}
    >
      <div className="absolute -top-6 w-12 h-12 rounded-full bg-slate-900 border-2 border-inherit flex items-center justify-center shadow-xl">
        <span className={cn(
          "font-black text-xl",
          rank === 1 ? "text-yellow-500" : rank === 2 ? "text-slate-300" : "text-orange-500"
        )}>
          {rank}
        </span>
      </div>

      <div className="mt-4 mb-6 relative">
        <div className={cn(
          "w-20 h-20 rounded-full border-4 border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden",
          isFirst && "border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
        )}>
          {/* Avatar simulation */}
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
            <Trophy className={cn(
              "w-8 h-8",
              rank === 1 ? "text-yellow-500" : rank === 2 ? "text-slate-400" : "text-orange-600"
            )} />
          </div>
        </div>
        {isFirst && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-2 border-2 border-dashed border-yellow-500/30 rounded-full"
          />
        )}
      </div>

      <h3 className="font-black text-white uppercase tracking-tight mb-1">
        {truncateAddress(entry.address)}
      </h3>
      
      <div className="flex items-center gap-2 mb-4">
        <RankChange change={entry.change} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entry.charactersCount} Heroes</span>
      </div>

      <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800/50">
        <span className={cn(
          "text-2xl font-black",
          isFirst ? "text-yellow-500" : "text-white"
        )}>
          {entry.score.toLocaleString()}
        </span>
        <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">pts</span>
      </div>
    </motion.div>
  );
}

function RankChange({ change }: { change: LeaderboardEntry['change'] }) {
  switch (change) {
    case 'up': return <ArrowUp className="w-3 h-3 text-emerald-500" />;
    case 'down': return <ArrowDown className="w-3 h-3 text-red-500" />;
    default: return <Minus className="w-3 h-3 text-slate-600" />;
  }
}
