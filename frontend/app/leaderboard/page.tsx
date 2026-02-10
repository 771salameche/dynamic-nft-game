'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLeaderboard, useYourRank } from '@/hooks/useLeaderboard';
import { PodiumCard } from '@/components/leaderboard/PodiumCard';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Zap, Heart, Shield, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'level' | 'power' | 'staking' | 'breeding';
type Timeframe = 'all' | 'week' | 'month';

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [category, setCategory] = useState<Category>('level');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  
  const { data: leaderboard, isLoading } = useLeaderboard(category, timeframe);
  const { rank: userRank } = useYourRank(address, category);

  const categories = [
    { id: 'level' as Category, label: 'Top Level', icon: <Target size={14} /> },
    { id: 'power' as Category, label: 'Highest Power', icon: <Zap size={14} /> },
    { id: 'staking' as Category, label: 'Master Stakers', icon: <Shield size={14} /> },
    { id: 'breeding' as Category, label: 'Pro Breeders', icon: <Heart size={14} /> },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 text-white">Global Arena</h1>
          <p className="text-slate-500 font-medium">Behold the legends of the decentralized frontier.</p>
        </div>
        <ConnectButton />
      </header>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800">
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                category === cat.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" 
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {(['all', 'week', 'month'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeframe === tf ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Loading Rankings...</p>
        </div>
      ) : (
        <div className="space-y-20">
          {/* Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4">
            {leaderboard.slice(0, 3).map((entry, index) => (
              <PodiumCard
                key={entry.address}
                rank={index + 1}
                entry={entry}
                highlighted={entry.address === address}
              />
            ))}
          </div>

          {/* Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Player</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Collection</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                      {category === 'level' ? 'Highest Level' : category === 'power' ? 'Total Power' : 'Points'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence mode="popLayout">
                    {leaderboard.map((entry, index) => (
                      <LeaderboardRow
                        key={entry.address}
                        rank={index + 1}
                        entry={entry}
                        highlighted={entry.address === address}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Your Stats */}
          {address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Your Standing</h3>
                    <p className="text-purple-200 text-sm font-bold uppercase tracking-widest opacity-60">Rank #{userRank || '---'} in {category}</p>
                  </div>
                </div>
                <Button 
                  className="h-14 px-8 bg-white text-purple-900 hover:bg-slate-200 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-3"
                  onClick={() => window.location.href = `/profile/${address}`}
                >
                  View Your Profile
                  <ArrowRight size={18} />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
