'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';
import { usePlayerStats } from './useSubgraph';

// ABI for GameCharacter that matches the on-chain contract
export const gameCharacterAbi = parseAbi([
  // Minting (owner-only, string-based class)
  'function mintCharacter(string characterClass) external',

  // Traits accessor – we omit the return type to avoid abitype tuple parsing issues
  'function getCharacterTraits(uint256 tokenId) external view',
]);

const CLASS_NAMES = ['Warrior', 'Mage', 'Rogue'] as const;

export function useGameCharacter() {
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_GAME_CHARACTER_ADDRESS as `0x${string}`;

  const { writeContractAsync, isPending } = useWriteContract();

  const mintCharacter = async (classTypeIndex: number) => {
    const characterClass = CLASS_NAMES[classTypeIndex];

    return writeContractAsync({
      abi: gameCharacterAbi,
      address: contractAddress,
      functionName: 'mintCharacter',
      args: [characterClass],
      account: address,
    });
  };

  const useOwnedCharacters = () => {
    const { address } = useAccount();
    const { data, loading, error } = usePlayerStats(address);

    const tokenIds =
      (data?.player?.characters ?? []).map((c: { tokenId: string }) => BigInt(c.tokenId)) ??
      [];

    return {
      data: tokenIds as readonly bigint[],
      isLoading: loading,
      isError: !!error,
      error,
    };
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
    args: [tokenId],
  });
}

export function useOwnedTokenIds(address?: `0x${string}` | undefined) {
  const { address: connectedAddress } = useAccount();
  const effectiveAddress = address ?? connectedAddress;

  const { data, loading, error } = usePlayerStats(effectiveAddress);

  const tokenIds =
    (data?.player?.characters ?? []).map((c: { tokenId: string }) => BigInt(c.tokenId)) ?? [];

  return {
    tokenIds,
    isLoading: loading,
    error,
  };
}