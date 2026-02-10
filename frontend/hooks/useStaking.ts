'use client';

import { useState, useEffect } from 'react';
import { 
    useReadContract, 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useAccount,
} from 'wagmi';
import { Address, erc721Abi } from 'viem';
import { STAKING_ADDRESS, STAKING_ABI, GAME_CHARACTER_ADDRESS } from '@/lib/contracts';
import { toast } from 'react-hot-toast';
import { StakeInfo } from '@/types/game';

export function useStaking() {
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // 1. Stake character (with approval)
    const stake = async (tokenId: bigint) => {
        try {
            await writeContract({
                address: GAME_CHARACTER_ADDRESS,
                abi: erc721Abi,
                functionName: 'approve',
                args: [STAKING_ADDRESS, tokenId],
            });

            await writeContract({
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'stake',
                args: [tokenId],
            });
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Failed to stake');
        }
    };

    // 2. Unstake
    const unstake = async (tokenId: bigint) => {
        try {
            await writeContract({
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'unstake',
                args: [tokenId],
            });
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Failed to unstake');
        }
    };

    // 3. Claim rewards
    const claimRewards = async () => {
        try {
            await writeContract({
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'claimRewards',
            });
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Failed to claim rewards');
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
        error
    };
}

export function useStakedCharacters(owner?: Address) {
    const { address: connectedAddress } = useAccount();
    const targetAddress = owner || connectedAddress;

    return useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'getUserStakes',
        args: targetAddress ? [targetAddress] : undefined,
        query: {
            enabled: !!targetAddress,
        }
    });
}

export function usePendingRewards(owner?: Address) {
    const { address: connectedAddress } = useAccount();
    const targetAddress = owner || connectedAddress;
    
    const { data: baseRewardRate } = useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'baseRewardRate',
    });

    const { data: stakes } = useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'getUserStakes',
        args: targetAddress ? [targetAddress] : undefined,
    });

    const [realTimeRewards, setRealTimeRewards] = useState<bigint>(0n);

    useEffect(() => {
        if (!stakes || !baseRewardRate) return;

        const interval = setInterval(() => {
            const now = BigInt(Math.floor(Date.now() / 1000));
            let total = 0n;

            (stakes as StakeInfo[]).forEach(stake => {
                const timeDiff = now - BigInt(stake.lastClaimAt);
                if (timeDiff > 0n) {
                    total += timeDiff * (baseRewardRate as bigint);
                }
            });

            setRealTimeRewards(total);
        }, 1000);

        return () => clearInterval(interval);
    }, [stakes, baseRewardRate]);

    return { realTimeRewards };
}

export function useCalculateRewards(tokenId: bigint) {
    return useReadContract({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'calculateRewards',
        args: [tokenId],
        query: {
            enabled: !!tokenId,
            refetchInterval: 5000,
        }
    });
}

export function useCurrentTime() {
    const [now, setNow] = useState(0);
    
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(Math.floor(Date.now() / 1000));
        const interval = setInterval(() => {
            setNow(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return now;
}
