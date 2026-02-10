'use client';

import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { truncateAddress, cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface LeaderboardRowProps {
  rank: number;
  entry: LeaderboardEntry;
  highlighted: boolean;
}

export function LeaderboardRow({ rank, entry, highlighted }: LeaderboardRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (rank % 10) * 0.05 }}
      className={cn(
        "group border-b border-slate-800/50 transition-colors",
        highlighted ? "bg-purple-500/10" : "hover:bg-slate-900/50"
      )}
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-black text-sm w-6",
            rank <= 3 ? "text-purple-400" : "text-slate-500"
          )}>
            {rank}
          </span>
          <RankChange change={entry.change} />
        </div>
      </td>
      
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
            {entry.address.substring(2, 4).toUpperCase()}
          </div>
          <span className={cn(
            "font-bold",
            highlighted ? "text-purple-400" : "text-white"
          )}>
            {truncateAddress(entry.address)}
            {highlighted && <span className="ml-2 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded uppercase">You</span>}
          </span>
        </div>
      </td>

      <td className="py-4 px-6">
        <span className="text-sm font-medium text-slate-400">{entry.charactersCount}</span>
      </td>

      <td className="py-4 px-6 text-right">
        <span className="font-mono font-bold text-white">{entry.score.toLocaleString()}</span>
      </td>
    </motion.tr>
  );
}

function RankChange({ change }: { change: LeaderboardEntry['change'] }) {
  switch (change) {
    case 'up': return <ArrowUp className="w-3 h-3 text-emerald-500" />;
    case 'down': return <ArrowDown className="w-3 h-3 text-red-500" />;
    default: return <Minus className="w-3 h-3 text-slate-600" />;
  }
}
