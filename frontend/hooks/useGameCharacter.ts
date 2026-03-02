'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { usePlayerStats } from './useSubgraph';
import { GameCharacterAbiViem } from '../../shared/abi';

// ABI for GameCharacter used by viem
export const gameCharacterAbi = GameCharacterAbiViem;

const CLASS_NAMES = ['Warrior', 'Mage', 'Rogue'] as const;

export function useGameCharacter() {
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_GAME_CHARACTER_ADDRESS as `0x${string}`;

  const { writeContractAsync, isPending } = useWriteContract();

  const mintCharacter = async (classTypeIndex: number) => {
    const mintCost = parseEther('0.01'); // keep in sync with mintPrice on-chain

    return writeContractAsync({
      abi: gameCharacterAbi,
      address: contractAddress,
      functionName: 'mintCharacter',
      args: [classTypeIndex],
      value: mintCost,
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