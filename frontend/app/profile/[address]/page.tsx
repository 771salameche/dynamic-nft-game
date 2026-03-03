'use client';

import { useParams, useRouter } from 'next/navigation';
import { Address, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useOwnedTokenIds } from '@/hooks/useGameCharacter';
import { useAchievements } from '@/hooks/useAchievements';
import { useStakingStats } from '@/hooks/useStaking';
import { StatCard } from '@/components/ui/StatCard';
import { CharacterCard } from '@/components/character/CharacterCard';
import { ActivityTimeline } from '@/components/profile/ActivityTimeline';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, Settings, Coins, LayoutGrid, History, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { truncateAddress, formatDate } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';

type TabType = 'collection' | 'activity' | 'achievements';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as Address;
  const { address: connectedAddress } = useAccount();
  const isOwnProfile = address?.toLowerCase() === connectedAddress?.toLowerCase();
  
  const { tokenIds } = useOwnedTokenIds(address);
  const { playerAchievements } = useAchievements(address);
  const { totalStaked, totalRewards } = useStakingStats(address);
  
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const achievementPoints = useMemo(() => {
    return Array.from(playerAchievements.values()).filter(pa => pa.isUnlocked).length * 100;
  }, [playerAchievements]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Dynamic Header Background */}
      <div className="h-64 w-full bg-gradient-to-b from-purple-900/20 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/images/grid.png')] opacity-20" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10 space-y-8">
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Avatar with Glow */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-950 border-4 border-slate-900 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent flex items-center justify-center text-4xl font-black text-purple-500/50">
                   {address?.substring(2, 6).toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg border border-purple-400/50">
                Lv. {Math.floor(achievementPoints / 500) + 1}
              </div>
            </div>

            <div className="flex-grow text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                  {truncateAddress(address)}
                </h1>
                {isOwnProfile && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                    Main Identity
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Badge icon={<Shield size={12} />} label="Morphean Explorer" color="text-purple-400" />
                <Badge icon={<Trophy size={12} />} label={`${totalStaked} Staked Assets`} color="text-yellow-400" />
                <Badge icon={<Coins size={12} />} label="Early Adopter" color="text-emerald-400" />
              </div>
            </div>

            <div className="flex gap-3">
              {isOwnProfile ? (
                <Button className="rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] h-12 px-8">
                  <Settings size={14} className="mr-2" />
                  Settings
                </Button>
              ) : (
                <Button className="rounded-2xl bg-purple-600 text-white hover:bg-purple-500 font-black uppercase tracking-widest text-[10px] h-12 px-8">
                  Follow
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Collection" value={tokenIds.length} icon="👥" />
          <StatCard label="Staked" value={totalStaked} icon="🔒" />
          <StatCard label="GAME Earned" value={totalRewards ? Number(formatUnits(totalRewards, 18)).toFixed(2) : "0"} icon="💎" />
          <StatCard label="Ach. Points" value={achievementPoints} icon="🏆" />
          <StatCard label="Global Rank" value="#42" icon="👑" />
          <StatCard label="Quest Streak" value="7d" icon="⚡" />
        </div>

        {/* Tabbed Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-white/5 rounded-2xl w-fit mx-auto md:mx-0">
          <TabButton 
            active={activeTab === 'collection'} 
            onClick={() => setActiveTab('collection')}
            icon={<LayoutGrid size={16} />}
            label="Gallery"
          />
          <TabButton 
            active={activeTab === 'achievements'} 
            onClick={() => setActiveTab('achievements')}
            icon={<Trophy size={16} />}
            label="Achievements"
          />
          <TabButton 
            active={activeTab === 'activity'} 
            onClick={() => setActiveTab('activity')}
            icon={<History size={16} />}
            label="History"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === 'collection' && (
                <motion.div
                  key="collection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {tokenIds.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {tokenIds.map((id: bigint) => (
                        <CharacterCard key={id.toString()} tokenId={id} showActions />
                      ))}
                    </div>
                  ) : (
                    <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem]">
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                        <Sparkles size={32} className="text-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase">Void Collection</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Begin your legacy by forging your first hero.</p>
                      </div>
                      <Button 
                        onClick={() => router.push('/mint')}
                        className="rounded-2xl bg-purple-600 hover:bg-purple-500 font-black uppercase tracking-widest text-xs h-12 px-10"
                      >
                        Summon Hero
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {Array.from(playerAchievements.values()).map((pa) => (
                    <div key={pa.achievementId.toString()} className={`p-6 rounded-3xl border flex items-center gap-6 transition-all ${
                      pa.isUnlocked ? 'bg-purple-900/20 border-purple-500/30 shadow-lg shadow-purple-500/10' : 'bg-slate-900/50 border-white/5 opacity-50 grayscale'
                    }`}>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                        pa.isUnlocked ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Trophy size={28} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black uppercase tracking-tighter">Archon #{pa.achievementId.toString()}</h4>
                          {pa.isUnlocked && <span className="text-[8px] bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase">Unlocked</span>}
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          {pa.isUnlocked ? `Claimed on ${formatDate(pa.unlockedAt)}` : 'Objective Locked'}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ActivityTimeline address={address} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Seasonal Rank</h3>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-black uppercase">Gold II</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Next: Gold III (240 XP)</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Archon Progress</span>
                  <span className="text-2xl font-black">{achievementPoints / 100}%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${achievementPoints / 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full" 
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Account Metadata</h4>
                <div className="space-y-3">
                  <MetadataItem label="Forged" value="Feb 2026" />
                  <MetadataItem label="Network" value="Amoy Testnet" />
                  <MetadataItem label="Status" value="Verified Citizen" />
                </div>
              </div>
            </div>

            {/* Banner CTA */}
            <div className="relative group overflow-hidden rounded-[2.5rem] h-48 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex flex-col justify-end cursor-pointer">
              <div className="absolute top-4 right-4 text-white/20 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
                <Sparkles size={80} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">Upgrade Your Vault</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                Explore Premium Rewards <ChevronRight size={12} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
          : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetadataItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
      <span className="text-[10px] font-black uppercase text-white">{value}</span>
    </div>
  );
}