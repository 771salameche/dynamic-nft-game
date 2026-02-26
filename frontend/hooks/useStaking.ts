'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';

export const stakingAbi = parseAbi([
    "function stake(uint256 tokenId) external",
    "function unstake(uint256 tokenId) external",
    "function claimRewards(uint256 tokenId) external",
    "function calculateRewards(address account, uint256 tokenId) external view returns (uint256)",
    "function getStakedTokens(address account) external view returns (uint256[] memory)"
]);

export function useStaking() {
    const { address } = useAccount();
    const contractAddress = process.env.NEXT_PUBLIC_CHARACTER_STAKING_ADDRESS as `0x${string}`;

    const { writeContractAsync, isPending: isStakingTxPending } = useWriteContract();

    const stake = async (tokenId: bigint) => {
        return writeContractAsync({
            abi: stakingAbi,
            address: contractAddress,
            functionName: 'stake',
            args: [tokenId],
            account: address
        });
    };

    const unstake = async (tokenId: bigint) => {
        return writeContractAsync({
            abi: stakingAbi,
            address: contractAddress,
            functionName: 'unstake',
            args: [tokenId],
            account: address
        });
    };

    const claimRewards = async (tokenId: bigint) => {
        return writeContractAsync({
            abi: stakingAbi,
            address: contractAddress,
            functionName: 'claimRewards',
            args: [tokenId],
            account: address
        });
    };

    const useStakedTokens = () => {
        return useReadContract({
            abi: stakingAbi,
            address: contractAddress,
            functionName: 'getStakedTokens',
            args: address ? [address] : undefined,
            query: { enabled: !!address }
        });
    };

    const useCalculateRewards = (tokenId: bigint) => {
        return useReadContract({
            abi: stakingAbi,
            address: contractAddress,
            functionName: 'calculateRewards',
            args: address && tokenId ? [address, tokenId] : undefined,
            query: { enabled: !!address && !!tokenId, refetchInterval: 10000 } // Refetch every 10s
        });
    };

    return {
        stake,
        unstake,
        claimRewards,
        isStakingTxPending,
        useStakedTokens,
        useCalculateRewards
    };
}

export function useStakingStats(address: `0x${string}` | undefined) {
    const contractAddress = process.env.NEXT_PUBLIC_CHARACTER_STAKING_ADDRESS as `0x${string}`;

    const { data: stakedTokens } = useReadContract({
        abi: stakingAbi,
        address: contractAddress,
        functionName: 'getStakedTokens',
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    }) as { data: readonly bigint[] | undefined };

    return {
        totalStaked: stakedTokens ? stakedTokens.length : 0,
        totalRewards: 0n // Placeholder for now
    };
}
