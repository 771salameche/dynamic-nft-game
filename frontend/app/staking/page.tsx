'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useGameCharacter } from '@/hooks/useGameCharacter';
import { useStaking } from '@/hooks/useStaking';
import { CharacterCard } from '@/components/CharacterCard';
import { formatEther } from 'viem';
import toast from 'react-hot-toast';

function StakedCharacter({ tokenId }: { tokenId: bigint }) {
  const { unstake, claimRewards, useCalculateRewards } = useStaking();
  const { data: rewards } = useCalculateRewards(tokenId);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  const handleUnstake = async () => {
    try {
      const hash = await unstake(tokenId);
      setTxHash(hash);
      toast.success('Unstake transaction submitted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to unstake.');
    }
  };

  const handleClaim = async () => {
    try {
      const hash = await claimRewards(tokenId);
      setTxHash(hash);
      toast.success('Claim transaction submitted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to claim rewards.');
    }
  };

  return (
    <div className="relative group">
      <CharacterCard tokenId={tokenId} showLink={false} />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 rounded-xl gap-4">

        <div className="text-center mb-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pending Rewards</p>
          <p className="text-2xl font-bold text-primary">
            {rewards ? Number(formatEther(rewards)).toFixed(4) : '0.0000'} <span className="text-sm">🔥</span>
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={handleClaim}
            disabled={isWaiting || !rewards || rewards === 0n}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded font-medium disabled:opacity-50"
          >
            Claim
          </button>
          <button
            onClick={handleUnstake}
            disabled={isWaiting}
            className="flex-1 bg-destructive/90 hover:bg-destructive text-destructive-foreground py-2 rounded font-medium disabled:opacity-50"
          >
            Unstake
          </button>
        </div>
      </div>
    </div>
  );
}

function UnstakedCharacter({ tokenId }: { tokenId: bigint }) {
  const { stake } = useStaking();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  const handleStake = async () => {
    try {
      const hash = await stake(tokenId);
      setTxHash(hash);
      toast.success('Stake transaction submitted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to stake.');
    }
  };

  return (
    <div className="relative group">
      <CharacterCard tokenId={tokenId} showLink={false} />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 rounded-xl">
        <button
          onClick={handleStake}
          disabled={isWaiting}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
        >
          {isWaiting ? 'Staking...' : 'Stake Hero'}
        </button>
      </div>
    </div>
  );
}

export default function StakingDashboard() {
  const { isConnected } = useAccount();
  const { useOwnedCharacters } = useGameCharacter();
  const { useStakedTokens } = useStaking();

  const { data: ownedTokens } = useOwnedCharacters();
  const { data: stakedTokens } = useStakedTokens();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Staking Dashboard</h1>
        <p className="text-xl text-muted-foreground">Connect your wallet to manage your stakes and earn rewards.</p>
      </div>
    );
  }

  // Filter out the tokens that are actually staked, because tokensOfOwner might include them or not depending on staking implementation (usually staking transfers the NFT).
  // Assuming the Staking contract uses transferFrom, useOwnedCharacters only shows unstaked ones.
  // If it doesn't transfer, we would filter here.
  const unstakedTokens = ownedTokens || [];
  const currentlyStakedTokens = stakedTokens || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Staking Barracks</h1>
        <p className="text-xl text-muted-foreground">Stake your heroes to earn daily Game Tokens.</p>
      </div>

      <div className="space-y-12">

        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <h2 className="text-2xl font-bold">Currently Staked</h2>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
              {currentlyStakedTokens.length}
            </span>
          </div>

          {currentlyStakedTokens.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">You don&apos;t have any heroes staked currently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentlyStakedTokens.map((tokenId) => (
                <StakedCharacter key={tokenId.toString()} tokenId={tokenId} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <h2 className="text-2xl font-bold">Available to Stake</h2>
            <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-bold">
              {unstakedTokens.length}
            </span>
          </div>

          {unstakedTokens.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">You don&apos;t have any available heroes to stake.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {unstakedTokens.map((tokenId) => (
                <UnstakedCharacter key={tokenId.toString()} tokenId={tokenId} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}