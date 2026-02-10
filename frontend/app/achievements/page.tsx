'use client';

import { useAchievements, useAchievementNotifications } from '@/hooks/useAchievements';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Target, Search, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';

const CATEGORIES = ["All", "Combat", "Breeding", "Social", "Collection", "Progression"];

export default function AchievementsPage() {
  const { isConnected } = useAccount();
  const { achievements, playerAchievements, isLoading } = useAchievements();
  useAchievementNotifications();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = Array.from(playerAchievements.values()).filter(pa => pa.isUnlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percentage };
  }, [achievements, playerAchievements]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           a.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [achievements, selectedCategory, searchTerm]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter text-white">Honor Hall</h1>
          <p className="text-slate-400 mb-8 text-lg">
            Connect your wallet to track your progress and claim your rewards.
          </p>
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 text-white">Achievements</h1>
          <p className="text-slate-500 font-medium">Earn experience and tokens by completing challenges.</p>
        </div>
        <ConnectButton />
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatSummaryCard
          label="Total Unlocked"
          value={`${stats.unlocked} / ${stats.total}`}
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          progress={stats.percentage}
        />
        <StatSummaryCard
          label="Completion"
          value={`${stats.percentage}%`}
          icon={<Target className="w-5 h-5 text-purple-500" />}
          progress={stats.percentage}
        />
        <StatSummaryCard
          label="Active Challenges"
          value={achievements.filter(a => a.isActive).length.toString()}
          icon={<Star className="w-5 h-5 text-emerald-500" />}
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                selectedCategory === cat 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" 
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-white"
          />
        </div>
      </div>

      {/* Achievements Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Synchronizing Hall of Fame...</p>
        </div>
      ) : filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAchievements.map((achievement) => (
              <motion.div
                key={achievement.achievementId.toString()}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <AchievementCard
                  achievement={achievement}
                  playerProgress={playerAchievements.get(achievement.achievementId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No achievements found in this category</p>
        </div>
      )}
    </div>
  );
}

function StatSummaryCard({ label, value, icon, progress }: { label: string, value: string, icon: React.ReactNode, progress?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      )}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        {icon}
      </div>
    </div>
  );
}
