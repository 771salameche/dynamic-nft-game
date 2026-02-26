'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { parseAbi } from 'viem';

export const achievementAbi = parseAbi([
  "function getPlayerAchievements(address player) external view returns (uint256[] memory)",
  "function getProgress(address player, uint256 achievementId) external view returns (uint256 current, uint256 required, bool completed)"
]);

export function useAchievements(playerAddress?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const addressToUse = playerAddress || connectedAddress;
  const contractAddress = process.env.NEXT_PUBLIC_ACHIEVEMENT_TRACKER_ADDRESS as `0x${string}`;

  const usePlayerAchievements = () => {
    return useReadContract({
      abi: achievementAbi,
      address: contractAddress,
      functionName: 'getPlayerAchievements',
      args: addressToUse ? [addressToUse] : undefined,
      query: { enabled: !!addressToUse }
    });
  };

  const useProgress = (achievementId: bigint) => {
    return useReadContract({
      abi: achievementAbi,
      address: contractAddress,
      functionName: 'getProgress',
      args: addressToUse && achievementId ? [addressToUse, achievementId] : undefined,
      query: { enabled: !!addressToUse && !!achievementId }
    });
  };

  // For ProfilePage compatibility (pre-computed map if playerAddress provided)
  const { data: achievementIds } = useReadContract({
    abi: achievementAbi,
    address: contractAddress,
    functionName: 'getPlayerAchievements',
    args: playerAddress ? [playerAddress] : undefined,
    query: { enabled: !!playerAddress }
  }) as { data: readonly bigint[] | undefined };

  const playerAchievements = useMemo(() => {
    const map = new Map();
    if (achievementIds) {
      achievementIds.forEach(id => {
        map.set(id.toString(), {
          achievementId: id,
          isUnlocked: true,
          unlockedAt: new Date() // Placeholder
        });
      });
    }
    return map;
  }, [achievementIds]);

  return {
    usePlayerAchievements,
    useProgress,
    playerAchievements
  };
}
