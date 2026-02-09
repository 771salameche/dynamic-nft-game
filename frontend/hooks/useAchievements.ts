'use client';

import { useReadContract, useAccount } from 'wagmi';
import { ACHIEVEMENT_ADDRESS, ACHIEVEMENT_ABI } from '@/lib/contracts';

export function usePlayerAchievements() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    address: ACHIEVEMENT_ADDRESS,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getPlayerAchievements',
    args: address ? [address] : undefined,
  });

  return { playerAchievements: data, isLoading, refetch };
}

export function useAchievementMetadata(achievementId: bigint) {
  const { data, isLoading } = useReadContract({
    address: ACHIEVEMENT_ADDRESS,
    abi: ACHIEVEMENT_ABI,
    functionName: 'achievements',
    args: [achievementId],
  });

  return { achievement: data, isLoading };
}

export function useAchievementsByCategory(category: string) {
  const { data, isLoading } = useReadContract({
    address: ACHIEVEMENT_ADDRESS,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getAchievementsByCategory',
    args: [category],
  });

  return { achievements: data, isLoading };
}
