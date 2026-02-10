'use client';

import { useParams } from 'next/navigation';
import { Address, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useOwnedTokenIds } from '@/hooks/useGameCharacter';
import { useAchievements } from '@/hooks/useAchievements';
import { useStakingStats } from '@/hooks/useStaking';
import { StatCard } from '@/components/ui/StatCard';
import { CharacterCard } from '@/components/character/CharacterCard';
import { ActivityTimeline } from '@/components/profile/ActivityTimeline';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Users, Trophy, Settings, Coins } from 'lucide-react';
import { truncateAddress, formatDate } from '@/lib/utils';
import { useState, useMemo } from 'react';

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as Address;
  const { address: connectedAddress } = useAccount();
  const isOwnProfile = address?.toLowerCase() === connectedAddress?.toLowerCase();
  
  const { tokenIds } = useOwnedTokenIds(address);
  const { playerAchievements } = useAchievements(address);
  const { totalStaked, totalRewards } = useStakingStats(address);
  
  const [sortBy, setSortBy] = useState<'level' | 'power'>('level');

  const achievementPoints = useMemo(() => {
    return Array.from(playerAchievements.values()).filter(pa => pa.isUnlocked).length * 100;
  }, [playerAchievements]);

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
        
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-2xl shrink-0">
          <div className="w-full h-full rounded-full flex items-center justify-center text-4xl font-black text-slate-700 bg-slate-900/50">
            {address?.substring(2, 4).toUpperCase()}
          </div>
        </div>

        <div className="flex-grow text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
              {truncateAddress(address)}
            </h1>
            {isOwnProfile && (
              <div className="px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-[10px] font-black text-purple-500 uppercase tracking-widest w-fit mx-auto md:mx-0">
                Connected
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-500" />
              <span>{tokenIds.length} Heroes</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              <span>{Array.from(playerAchievements.values()).filter(pa => pa.isUnlocked).length} Unlocked</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-emerald-500" />
              <span>Explorer</span>
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <Button variant="outline" className="rounded-2xl border-slate-800 hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px] h-12 px-6 shrink-0">
            <Settings size={14} className="mr-2" />
            Edit Profile
          </Button>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Heroes" value={tokenIds.length} icon="👥" />
        <StatCard label="Highest LVL" value="--" icon="📈" />
        <StatCard label="Total Staked" value={totalStaked} icon="🔒" />
        <StatCard label="GAME Earned" value={totalRewards ? Number(formatUnits(totalRewards, 18)).toFixed(2) : "0"} icon="💎" />
        <StatCard label="Breeding" value="--" icon="🧬" />
        <StatCard label="Ach. Points" value={achievementPoints} icon="🏆" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          {/* Character Collection */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Hero Collection</h2>
              <div className="flex gap-2">
                <Button 
                  variant={sortBy === 'level' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="text-[10px] font-black uppercase" 
                  onClick={() => setSortBy('level')}
                >
                  By Level
                </Button>
                <Button 
                  variant={sortBy === 'power' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="text-[10px] font-black uppercase" 
                  onClick={() => setSortBy('power')}
                >
                  By Power
                </Button>
              </div>
            </div>
            
            {tokenIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {tokenIds.map(id => (
                  <CharacterCard key={id.toString()} tokenId={id} showActions />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No heroes found in this collection</p>
              </div>
            )}
          </section>

          {/* Activity Timeline */}
          <section className="space-y-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Recent Activity</h2>
            <ActivityTimeline address={address} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          {/* Progress Overview */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Season 1 Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>Total Completion</span>
                <span>{achievementPoints / 100}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${achievementPoints / 100}%` }} />
              </div>
            </div>
          </section>

          {/* Hall of Fame Snippet */}
          <section className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Top Achievements</h3>
            <div className="space-y-4">
              {/* Only show first 3 unlocked achievements */}
              {Array.from(playerAchievements.values())
                .filter(pa => pa.isUnlocked)
                .slice(0, 3)
                .map(pa => (
                  <div key={pa.achievementId.toString()} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                      <Trophy size={18} className="text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white uppercase truncate">Achievement #{pa.achievementId.toString()}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{formatDate(pa.unlockedAt)}</p>
                    </div>
                  </div>
                ))}
              <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest border border-slate-800 rounded-xl h-12">
                View All Achievements
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}