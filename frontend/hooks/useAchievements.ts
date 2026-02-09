'use client';

import { useReadContract, useAccount } from 'wagmi';
import { ACHIEVEMENT_ADDRESS, ACHIEVEMENT_ABI } from '@/lib/contracts';
import { Address } from 'viem';

export function useAchievements() {
  // 1. Get player achievements
  const usePlayerAchievements = (owner?: Address) => {
    const { address: connectedAddress } = useAccount();
    const targetAddress = owner || connectedAddress;

    return useReadContract({
      address: ACHIEVEMENT_ADDRESS,
      abi: ACHIEVEMENT_ABI,
      functionName: 'getPlayerAchievements',
      args: targetAddress ? [targetAddress] : undefined,
      query: {
        enabled: !!targetAddress,
      }
    });
  };

  // 2. Get all achievements metadata (requires looping or specific contract view)
  const useAllAchievements = () => {
    return useReadContract({
      address: ACHIEVEMENT_ADDRESS,
      abi: ACHIEVEMENT_ABI,
      functionName: 'totalAchievements',
    });
  };

  // 3. Get achievement progress
  const useAchievementProgress = (owner: Address, achievementId: bigint) => {
    return useReadContract({
      address: ACHIEVEMENT_ADDRESS,
      abi: ACHIEVEMENT_ABI,
      functionName: 'getAchievementProgress',
      args: [owner, achievementId],
      query: {
        enabled: !!owner && achievementId !== undefined,
      }
    });
  };

  return {
    usePlayerAchievements,
    useAllAchievements,
    useAchievementProgress,
  };
}