'use client';

import { useReadContract, useWriteContract } from 'wagmi';

export const breedingAbi = [
  'function breed(uint256 parent1Id, uint256 parent2Id) external payable',
  'function canBreed(uint256 parent1Id, uint256 parent2Id) external view returns (bool)',
] as const;

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
    abi: [
      'function getBreedingHistory(uint256 tokenId) external view returns (uint256[] memory)',
    ] as const,
    address: contractAddress,
    functionName: 'getBreedingHistory',
    args: [tokenId],
    query: { enabled: !!tokenId },
  });
}
