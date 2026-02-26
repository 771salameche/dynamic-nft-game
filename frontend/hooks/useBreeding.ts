'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';

export const breedingAbi = [
  "function breed(uint256 parent1Id, uint256 parent2Id) external payable",
  "function canBreed(uint256 parent1Id, uint256 parent2Id) external view returns (bool)",
  "function getBreedingHistory(uint256 tokenId) external view returns (uint256[] memory)"
] as const;

export function useBreeding() {
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_CHARACTER_BREEDING_ADDRESS as `0x${string}`;

  const { writeContractAsync, isPending: isBreedingTxPending } = useWriteContract();

  const breed = async (parent1Id: bigint, parent2Id: bigint) => {
    return writeContractAsync({
      abi: breedingAbi,
      address: contractAddress,
      functionName: 'breed',
      args: [parent1Id, parent2Id]
    });
  };

  const useCanBreed = (parent1Id: bigint, parent2Id: bigint) => {
    return useReadContract({
      abi: breedingAbi,
      address: contractAddress,
      functionName: 'canBreed',
      args: [parent1Id, parent2Id],
      query: { enabled: !!parent1Id && !!parent2Id }
    });
  };

  const useBreedingHistory = (tokenId: bigint) => {
    return useReadContract({
      abi: breedingAbi,
      address: contractAddress,
      functionName: 'getBreedingHistory',
      args: [tokenId],
      query: { enabled: !!tokenId }
    });
  };

  return {
    breed,
    isBreedingTxPending,
    useCanBreed,
    useBreedingHistory
  };
}
