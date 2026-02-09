'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { GAME_CHARACTER_ADDRESS, GAME_CHARACTER_ABI } from '@/lib/contracts';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

export function useGameCharacter() {
  const { address } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintCharacter = async (characterClass: string) => {
    try {
      await writeContract({
        address: GAME_CHARACTER_ADDRESS,
        abi: GAME_CHARACTER_ABI,
        functionName: 'mintCharacter',
        args: [characterClass],
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to mint character');
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Character minted successfully!');
    }
    if (error) {
      toast.error(error.message || 'Transaction failed');
    }
  }, [isSuccess, error]);

  return {
    mintCharacter,
    isLoading: isPending || isConfirming,
    hash,
  };
}

export function useCharacterTraits(tokenId: bigint) {
  const { data, isLoading, refetch } = useReadContract({
    address: GAME_CHARACTER_ADDRESS,
    abi: GAME_CHARACTER_ABI,
    functionName: 'getCharacterTraits',
    args: [tokenId],
  });

  return { traits: data, isLoading, refetch };
}

export function useUserCharacters() {
  const { address } = useAccount();
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: GAME_CHARACTER_ADDRESS,
    abi: GAME_CHARACTER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Note: Finding all token IDs for a user might require an indexer or 
  // Enumeration if the contract supports it. If not, we might need a custom hook 
  // that scans events or uses a subgraph.
  
  return { balance, isLoading: isLoadingBalance };
}
