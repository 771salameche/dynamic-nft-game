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

  const breed = async (parent1Id: bigint, parent2Id: bigint) => {
    try {
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

  const fuse = async (token1Id: bigint, token2Id: bigint) => {
    try {
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

export function useBreedingCosts() {
  const { data: breedingCost } = useReadContract({
    address: BREEDING_ADDRESS,
    abi: BREEDING_ABI,
    functionName: 'breedingCost',
  });

  const { data: fusionCost } = useReadContract({
    address: BREEDING_ADDRESS,
    abi: BREEDING_ABI,
    functionName: 'fusionCost',
  });

  return { breedingCost, fusionCost };
}
