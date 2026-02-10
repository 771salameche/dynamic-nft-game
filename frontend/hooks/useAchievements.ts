'use client';

import { useReadContract, useReadContracts, useAccount, useWatchContractEvent } from 'wagmi';
import { ACHIEVEMENT_ADDRESS, ACHIEVEMENT_ABI } from '@/lib/contracts';
import { Address } from 'viem';
import { Achievement, PlayerAchievement } from '@/types/game';
import { useMemo } from 'react';
import { showAchievementToast } from '@/components/achievements/AchievementNotification';
import { formatUnits } from 'viem';

export function useAchievements(owner?: Address) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = owner || connectedAddress;

  // 1. Get total achievements count
  const { data: totalAchievements } = useReadContract({
    address: ACHIEVEMENT_ADDRESS,
    abi: ACHIEVEMENT_ABI,
    functionName: 'totalAchievements',
  });

  // 2. Prepare multicall for all achievements metadata
  const achievementRequests = useMemo(() => {
    if (!totalAchievements) return [];
    const requests = [];
    for (let i = 1n; i <= (totalAchievements as bigint); i++) {
      requests.push({
        address: ACHIEVEMENT_ADDRESS as Address,
        abi: ACHIEVEMENT_ABI,
        functionName: 'achievements',
        args: [i],
      });
    }
    return requests;
  }, [totalAchievements]);

  const { data: allAchievementsData, isLoading: isLoadingMetadata } = useReadContracts({
    contracts: achievementRequests,
    query: {
      enabled: achievementRequests.length > 0,
    }
  });

  // 3. Get all player achievements progress/unlock status
  const { data: playerAchievementsData, refetch: refetchPlayerAchievements, isLoading: isLoadingPlayer } = useReadContract({
    address: ACHIEVEMENT_ADDRESS,
    abi: ACHIEVEMENT_ABI,
    functionName: 'getPlayerAchievements',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    }
  });

  const achievements = useMemo(() => {
    if (!allAchievementsData) return [];
    return allAchievementsData
      .filter(res => res.status === 'success')
      .map((res) => {
        const [id, name, description, category, tier, xpReward, tokenReward, isActive, unlockedCount] = res.result as unknown as [bigint, string, string, string, number, bigint, bigint, boolean, bigint];
        return {
          achievementId: id,
          name,
          description,
          category,
          tier,
          xpReward,
          tokenReward,
          isActive,
          unlockedCount
        } as Achievement;
      });
  }, [allAchievementsData]);

  const playerAchievements = useMemo(() => {
    if (!playerAchievementsData) return new Map<bigint, PlayerAchievement>();
    const map = new Map<bigint, PlayerAchievement>();
    (playerAchievementsData as PlayerAchievement[]).forEach(pa => {
      map.set(pa.achievementId, pa);
    });
    return map;
  }, [playerAchievementsData]);

  return {
    achievements,
    playerAchievements,
    totalAchievements: totalAchievements as bigint | undefined,
    isLoading: isLoadingMetadata || isLoadingPlayer,
    refetchPlayerAchievements,
  };
}

export function useAchievementNotifications() {
  const { address } = useAccount();
  
  useWatchContractEvent({
    address: ACHIEVEMENT_ADDRESS,
    abi: ACHIEVEMENT_ABI,
    eventName: 'AchievementUnlocked',
    onLogs(logs) {
      logs.forEach((log) => {
        const { player, achievementId, xpReward, tokenReward } = log.args as { player: Address, achievementId: bigint, xpReward: bigint, tokenReward: bigint };
        if (player === address) {
          showAchievementToast(
            `Secret Achievement #${achievementId}`, 
            xpReward.toString(), 
            formatUnits(tokenReward, 18)
          );
        }
      });
    },
  });
}
