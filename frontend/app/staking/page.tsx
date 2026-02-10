'use client';

import { useStaking, useStakedCharacters, usePendingRewards } from '@/hooks/useStaking';
import { useOwnedTokenIds } from '@/hooks/useGameCharacter';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { StatCard } from '@/components/ui/StatCard';
import { StakedCharacterCard } from '@/components/staking/StakedCharacterCard';
import { CharacterCard } from '@/components/character/CharacterCard';
import { StakingInfoPanel } from '@/components/staking/StakingInfoPanel';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Loader2, Sparkles } from 'lucide-react';
import { StakeInfo } from '@/types/game';

export default function StakingPage() {
  const { isConnected } = useAccount();
  const { stake, unstake, claimRewards, isLoading: isActionPending } = useStaking();
  const { data: stakes, isLoading: isLoadingStakes } = useStakedCharacters();
  const { realTimeRewards: pendingRewards } = usePendingRewards();
  const { tokenIds: ownedTokenIds } = useOwnedTokenIds();

  // Filter out characters that are already staked
  const stakedTokenIds = stakes ? (stakes as StakeInfo[]).map(s => BigInt(s.tokenId)) : [];
  const unstakedCharacters = ownedTokenIds.filter(id => !stakedTokenIds.includes(id));

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Coins className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter">Staking Vault</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Connect your wallet to access the vault, stake your heroes and earn passive GAME rewards.
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
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Staking Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage your staked heroes and harvest GAME rewards.</p>
        </div>
        <ConnectButton />
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Heroes Staked"
          value={stakes?.length || 0}
          icon="🔒"
        />
        <StatCard
          label="Pending Rewards"
          value={pendingRewards ? Number(formatUnits(pendingRewards, 18)).toFixed(4) : "0.0000"}
          suffix="GAME"
          icon="💎"
        />
        <StatCard
          label="Reward Rate"
          value="1.0"
          suffix="GAME / h / lvl"
          icon="📈"
        />
      </div>

      {/* Claim Section */}
      <motion.div 
        layout
        className="p-8 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Total Rewards Available</h2>
            <p className="text-purple-200 text-lg font-bold">
              {pendingRewards ? formatUnits(pendingRewards, 18) : "0.00"} <span className="text-sm opacity-60">GAME</span>
            </p>
          </div>
        </div>
        
        <Button
          size="lg"
          onClick={() => claimRewards()}
          disabled={isActionPending || !pendingRewards || pendingRewards === 0n}
          className="h-16 px-12 text-lg font-black uppercase tracking-widest shadow-xl bg-white text-purple-900 hover:bg-slate-200 transition-all"
        >
          {isActionPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : "Claim All Rewards"}
        </Button>
      </motion.div>

      {/* Staked Characters */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Staked Characters ({stakes?.length || 0})</h2>
        </div>
        
        {isLoadingStakes ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-slate-700 animate-spin" />
          </div>
        ) : stakes && (stakes as StakeInfo[]).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {(stakes as StakeInfo[]).map((stakeInfo) => (
                <StakedCharacterCard
                  key={stakeInfo.tokenId.toString()}
                  stake={stakeInfo}
                  onUnstake={unstake}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No characters currently staked</p>
          </div>
        )}
      </section>

      {/* Available to Stake */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Available to Stake ({unstakedCharacters.length})</h2>
        
        {unstakedCharacters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {unstakedCharacters.map((id) => (
              <CharacterCard
                key={id.toString()}
                tokenId={id}
                showActions
                onStake={stake}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">All your characters are working</p>
            <p className="text-xs text-slate-600 mt-2">Mint more characters to increase your reward rate</p>
          </div>
        )}
      </section>

      {/* Mechanics Info */}
      <StakingInfoPanel />
    </div>
  );
}