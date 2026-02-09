'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { BREEDING_ADDRESS, BREEDING_ABI, GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI } from '@/lib/contracts';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { erc20Abi } from 'viem';

export function useBreeding() {
  const { address } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 1. Breed characters
  const breed = async (parent1Id: bigint, parent2Id: bigint) => {
    try {
      // Logic: 
      // 1. Get breeding cost
      // 2. Approve GAME tokens
      // 3. Call breed
      // For simplicity in hook, we trigger the sequence
      
      const breedingCost = 100n * 10n**18n; // Should fetch from contract normally

      await writeContract({
        address: GAME_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [BREEDING_ADDRESS, breedingCost],
      });

      await writeContract({
        address: BREEDING_ADDRESS,
        abi: BREEDING_ABI,
        functionName: 'breed',
        args: [parent1Id, parent2Id],
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to breed');
    }
  };

  // 2. Fuse characters
  const fuse = async (token1Id: bigint, token2Id: bigint) => {
    try {
      const fusionCost = 500n * 10n**18n; // Should fetch from contract normally

      await writeContract({
        address: GAME_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [BREEDING_ADDRESS, fusionCost],
      });

      await writeContract({
        address: BREEDING_ADDRESS,
        abi: BREEDING_ABI,
        functionName: 'fuse',
        args: [token1Id, token2Id],
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to fuse');
    }
  };

  useEffect(() => {
    if (isSuccess) toast.success('Operation successful!');
    if (error) toast.error(error.message || 'Transaction failed');
  }, [isSuccess, error]);

  return {
    breed,
    fuse,
    isLoading: isPending || isConfirming,
    hash,
  };
}

// 3. Check breeding eligibility
export function useCanBreed(tokenId: bigint) {
  return useReadContract({
    address: BREEDING_ADDRESS,
    abi: BREEDING_ABI,
    functionName: 'canBreed',
    args: [tokenId],
    query: {
        enabled: !!tokenId,
    }
  });
}

// 4. Get breeding history
export function useBreedingHistory(tokenId: bigint) {
  return useReadContract({
    address: BREEDING_ADDRESS,
    abi: BREEDING_ABI,
    functionName: 'getBreedingHistory',
    args: [tokenId],
    query: {
        enabled: !!tokenId,
    }
  });
}