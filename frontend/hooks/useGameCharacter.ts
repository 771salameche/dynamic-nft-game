'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseAbi } from 'viem';

// ABI for GameCharacter
export const gameCharacterAbi = parseAbi([
  "function mintCharacter(uint8 classType) external payable",
  "function getCharacterTraits(uint256 tokenId) external view returns (uint256 level, uint256 strength, uint256 agility, uint256 intelligence, uint8 classType)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function tokensOfOwner(address owner) external view returns (uint256[] memory)"
]);

export function useGameCharacter() {
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_GAME_CHARACTER_ADDRESS as `0x${string}`;

  const { writeContractAsync, isPending } = useWriteContract();

  const mintCharacter = async (classType: number) => {
    // Basic mint cost is 0.01 MATIC based on standard setup, adjust as needed or fetch dynamically
    const mintCost = parseEther("0.01");
    return writeContractAsync({
      abi: gameCharacterAbi,
      address: contractAddress,
      functionName: 'mintCharacter',
      args: [classType],
      value: mintCost,
      account: address
    });
  };

  const useOwnedCharacters = () => {
    return useReadContract({
      abi: gameCharacterAbi,
      address: contractAddress,
      functionName: 'tokensOfOwner',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      }
    });
  };
  return {
    mintCharacter,
    isMinting: isPending,
    useOwnedCharacters,
  };
}

export function useCharacterTraits(tokenId: bigint) {
  const contractAddress = process.env.NEXT_PUBLIC_GAME_CHARACTER_ADDRESS as `0x${string}`;

  return useReadContract({
    abi: gameCharacterAbi,
    address: contractAddress,
    functionName: 'getCharacterTraits',
    args: [tokenId]
  });
}

export function useOwnedTokenIds(address: `0x${string}` | undefined) {
  const contractAddress = process.env.NEXT_PUBLIC_GAME_CHARACTER_ADDRESS as `0x${string}`;

  const { data: tokenIds, isLoading, error } = useReadContract({
    abi: gameCharacterAbi,
    address: contractAddress,
    functionName: 'tokensOfOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  }) as { data: readonly bigint[] | undefined, isLoading: boolean, error: any };

  return {
    tokenIds: tokenIds || [],
    isLoading,
    error
  };
}