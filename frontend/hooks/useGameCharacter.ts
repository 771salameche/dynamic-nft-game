'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { GAME_CHARACTER_ADDRESS, GAME_CHARACTER_ABI } from '@/lib/contracts';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { Address } from 'viem';

export function useGameCharacter() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Mint character
  const mintCharacter = async (characterClass: string) => {
    try {
      await writeContract({
        address: GAME_CHARACTER_ADDRESS,
        abi: GAME_CHARACTER_ABI,
        functionName: 'mintCharacter',
        args: [characterClass],
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to mint character');
    }
  };

  // Gain experience
  const gainExperience = async (tokenId: bigint, amount: number) => {
    try {
      await writeContract({
        address: GAME_CHARACTER_ADDRESS,
        abi: GAME_CHARACTER_ABI,
        functionName: 'gainExperience',
        args: [tokenId, amount],
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to gain experience');
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Transaction successful!');
    }
    if (error) {
      toast.error(error.message || 'Transaction failed');
    }
  }, [isSuccess, error]);

  return {
    mintCharacter,
    gainExperience,
    isLoading: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

export function useCharacterTraits(tokenId: bigint) {
  return useReadContract({
    address: GAME_CHARACTER_ADDRESS,
    abi: GAME_CHARACTER_ABI,
    functionName: 'getCharacterTraits',
    args: [tokenId],
    query: {
      enabled: !!tokenId,
    }
  });
}

export function useOwnedCharacters(owner?: Address) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = owner || connectedAddress;

  // We can use useWatchContractEvent to listen for Transfer events
  // or a more robust solution like a subgraph. 
  // For a basic implementation, we'll rely on the balance and events.
  
  const { data: balance } = useReadContract({
    address: GAME_CHARACTER_ADDRESS,
    abi: GAME_CHARACTER_ABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    }
  });

  // Note: To actually get all token IDs without ERC721Enumerable, 
  // we would normally need to index events. 
  // This is a simplified placeholder that would ideally be replaced 
  // by a call to an indexer or a multicall if we knew the ID range.
  
  return { 
    balance: balance as bigint | undefined,
    tokenIds: [],
    isLoading: !balance && !!targetAddress 
  };
}