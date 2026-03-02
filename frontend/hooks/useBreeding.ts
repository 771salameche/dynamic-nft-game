'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { CharacterBreedingAbiViem } from '../../shared/abi';

export const breedingAbi = CharacterBreedingAbiViem;

export function useBreeding() {
  const contractAddress = process.env.NEXT_PUBLIC_CHARACTER_BREEDING_ADDRESS as `0x${string}`;

  const { writeContractAsync, isPending: isBreedingTxPending } = useWriteContract();

  const breed = async (parent1Id: bigint, parent2Id: bigint) => {
    return writeContractAsync({
      abi: breedingAbi,
      address: contractAddress,
      functionName: 'breed',
      args: [parent1Id, parent2Id],
    });
  };

  const useCanBreed = (parent1Id: bigint, parent2Id: bigint) => {
    return useReadContract({
      abi: breedingAbi,
      address: contractAddress,
      functionName: 'canBreed',
      args: [parent1Id, parent2Id],
      query: { enabled: !!parent1Id && !!parent2Id },
    });
  };

  return {
    breed,
    isBreedingTxPending,
    useCanBreed,
  };
}

export function useBreedingHistory(tokenId: bigint) {
  const contractAddress = process.env.NEXT_PUBLIC_CHARACTER_BREEDING_ADDRESS as `0x${string}`;

  return useReadContract({
    abi: CharacterBreedingAbiViem,
    address: contractAddress,
    functionName: 'getBreedingHistory',
    args: [tokenId],
    query: { enabled: !!tokenId },
  });
}
