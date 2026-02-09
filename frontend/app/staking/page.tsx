'use client';

import { useStaking, useUserStakes, useClaimableRewards } from '@/hooks/useStaking';
import { useUserCharacters } from '@/hooks/useGameCharacter';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { useAccount } from 'wagmi';
import { formatTokenAmount } from '@/lib/utils';

export default function StakingPage() {
  const { isConnected } = useAccount();
  const { stake, unstake, claimRewards, isLoading } = useStaking();
  const { stakes, isLoading: isLoadingStakes } = useUserStakes();
  const { claimableAmount, isLoading: isLoadingRewards } = useClaimableRewards();
  const { balance: charBalance } = useUserCharacters();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Character Staking</h1>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <div className="text-center p-12 bg-slate-900 rounded-2xl border border-slate-800">
            <p className="text-xl text-gray-400">Please connect your wallet to view staking.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                <h3 className="text-gray-400 mb-2">Total Staked</h3>
                <p className="text-4xl font-bold text-purple-500">{stakes?.length || 0}</p>
              </div>
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                <h3 className="text-gray-400 mb-2">Claimable Rewards</h3>
                <p className="text-4xl font-bold text-pink-500">
                  {claimableAmount ? formatTokenAmount(claimableAmount) : '0.00'} GAME
                </p>
              </div>
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
                <button
                  onClick={() => claimRewards()}
                  disabled={isLoading || !claimableAmount || claimableAmount === 0n}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  Claim All Rewards
                </button>
              </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800">
              <h2 className="text-2xl font-bold mb-6">Your Stakes</h2>
              {isLoadingStakes ? (
                <p>Loading stakes...</p>
              ) : stakes && stakes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stakes.map((stakeInfo) => (
                    <div key={stakeInfo.tokenId.toString()} className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                      <div className="aspect-square bg-slate-700 rounded-lg mb-4 flex items-center justify-center text-4xl">
                        🛡️
                      </div>
                      <h4 className="font-bold mb-2">Character #{stakeInfo.tokenId.toString()}</h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Staked at: {new Date(Number(stakeInfo.stakedAt) * 1000).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => unstake(stakeInfo.tokenId)}
                        disabled={isLoading}
                        className="w-full py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      >
                        Unstake
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No characters currently staked.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
