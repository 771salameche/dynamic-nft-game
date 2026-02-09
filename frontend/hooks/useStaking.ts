'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    useReadContract, 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useAccount,
    useWatchContractEvent
} from 'wagmi';
import { erc721Abi } from 'viem';
import { STAKING_ADDRESS, STAKING_ABI, GAME_CHARACTER_ADDRESS } from '@/lib/contracts';
import { toast } from 'react-hot-toast';

export function useStaking() {
    const { address } = useAccount();
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const stake = async (tokenId: bigint) => {
        try {
            // In a real UI, we should check allowance/approval first
            // For brevity, we assume approval is handled or requested
            await writeContract({
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'stake',
                args: [tokenId],
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to stake');
        }
    };

    const unstake = async (tokenId: bigint) => {
        try {
            await writeContract({
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'unstake',
                args: [tokenId],
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to unstake');
        }
    };

    const claimRewards = async () => {
        try {
            await writeContract({
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'claimRewards',
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to claim rewards');
        }
    };

    useEffect(() => {
        if (isSuccess) toast.success('Transaction successful!');
        if (error) toast.error(error.message || 'Transaction failed');
    }, [isSuccess, error]);

    return {
        stake,
        unstake,
        claimRewards,
        isLoading: isPending || isConfirming,
        hash,
    };
}

export function useUserStakes() {
    const { address } = useAccount();
    const { data, isLoading, refetch } = useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'getUserStakes',
        args: address ? [address] : undefined,
    });

    return { stakes: data, isLoading, refetch };
}

export function useClaimableRewards() {
    const { address } = useAccount();
    const { data, isLoading, refetch } = useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'calculateRewards',
        args: address ? [address] : undefined,
    });

    return { claimableAmount: data as bigint | undefined, isLoading, refetch };
}
