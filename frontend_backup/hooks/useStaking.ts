import { useState, useEffect, useMemo } from 'react';
import { 
    useReadContract, 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useAccount,
    useWatchContractEvent
} from 'wagmi';
import { Address, erc721Abi, parseEther } from 'viem';

// These should be imported from your contract deployment artifacts or a config file
// For now, these are placeholders
export const CHARACTER_STAKING_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
export const GAME_CHARACTER_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

// Minimal ABIs (You should replace these with full ABIs from artifacts)
const STAKING_ABI = [
    {
        name: 'stake',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
    },
    {
        name: 'unstake',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
    },
    {
        name: 'claimRewards',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
    },
    {
        name: 'calculateRewards',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'getUserStakes',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{
            components: [
                { name: 'tokenId', type: 'uint256' },
                { name: 'stakedAt', type: 'uint256' },
                { name: 'lastClaimAt', type: 'uint256' }
            ],
            type: 'tuple[]'
        }],
    },
    {
        name: 'baseRewardRate',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    }
] as const;

export interface StakeInfo {
    tokenId: bigint;
    stakedAt: bigint;
    lastClaimAt: bigint;
}

// 1. useStake
export function useStake(tokenId: bigint) {
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isWaitingForApproval, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash });

    const { writeContract: approve, data: approveHash } = useWriteContract();
    const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });

    const stake = async () => {
        try {
            // First Approve
            await approve({
                address: GAME_CHARACTER_ADDRESS,
                abi: erc721Abi,
                functionName: 'approve',
                args: [CHARACTER_STAKING_ADDRESS, tokenId],
            });

            // Then Stake (Note: In a real UI, you might wait for approval success first)
            await writeContract({
                address: CHARACTER_STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'stake',
                args: [tokenId],
            });
        } catch (e) {
            console.error("Stake error:", e);
        }
    };

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    return {
        stake,
        isLoading: isPending || isConfirming || isApproving,
        isSuccess: !isPending && hash,
        error
    };
}

// 2. useUnstake
export function useUnstake(tokenId: bigint) {
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const unstake = async () => {
        writeContract({
            address: CHARACTER_STAKING_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'unstake',
            args: [tokenId],
        });
    };

    return { unstake, isLoading: isPending || isConfirming, isSuccess, error };
}

// 3. useClaimRewards
export function useClaimRewards() {
    const { address } = useAccount();
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const { data: claimableAmount, refetch } = useReadContract({
        address: CHARACTER_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'calculateRewards',
        args: address ? [address] : undefined,
    });

    const claimRewards = async () => {
        writeContract({
            address: CHARACTER_STAKING_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'claimRewards',
        });
    };

    useEffect(() => {
        if (isSuccess) refetch();
    }, [isSuccess, refetch]);

    return { 
        claimRewards, 
        claimableAmount: claimableAmount as bigint | undefined, 
        isLoading: isPending || isConfirming, 
        isSuccess, 
        error 
    };
}

// 4. useStakedCharacters
export function useStakedCharacters(address?: Address) {
    const { address: connectedAddress } = useAccount();
    const targetAddress = address || connectedAddress;

    const { data: stakedNfts, refetch, isLoading } = useReadContract({
        address: CHARACTER_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'getUserStakes',
        args: targetAddress ? [targetAddress] : undefined,
    });

    // Refresh on events
    useWatchContractEvent({
        address: CHARACTER_STAKING_ADDRESS,
        abi: STAKING_ABI,
        eventName: 'Staked',
        onLogs() { refetch(); },
    });

    useWatchContractEvent({
        address: CHARACTER_STAKING_ADDRESS,
        abi: STAKING_ABI,
        eventName: 'Unstaked',
        onLogs() { refetch(); },
    });

    return { 
        stakedNfts: stakedNfts as StakeInfo[] | undefined, 
        isLoading, 
        refetch 
    };
}

// 5. useStakingStats
export function useStakingStats(address?: Address) {
    const { stakedNfts } = useStakedCharacters(address);
    const { claimableAmount } = useClaimRewards();

    const stats = useMemo(() => {
        if (!stakedNfts) return null;
        
        return {
            totalStaked: stakedNfts.length,
            pendingRewards: claimableAmount || 0n,
            // Average APY calculation would require rewardRate and floor price of NFTs
            // Placeholder for demonstration
            apy: "15%" 
        };
    }, [stakedNfts, claimableAmount]);

    return stats;
}

// 6. useRewardCalculation
export function useRewardCalculation(address?: Address) {
    const { address: connectedAddress } = useAccount();
    const targetAddress = address || connectedAddress;
    const { stakedNfts } = useStakedCharacters(targetAddress);
    
    const { data: baseRewardRate } = useReadContract({
        address: CHARACTER_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'baseRewardRate',
    });

    const [realTimeRewards, setRealTimeRewards] = useState<bigint>(0n);

    useEffect(() => {
        if (!stakedNfts || !baseRewardRate) return;

        const interval = setInterval(() => {
            const now = BigInt(Math.floor(Date.now() / 1000));
            let total = 0n;

            stakedNfts.forEach(stake => {
                const timeDiff = now - stake.lastClaimAt;
                if (timeDiff > 0n) {
                    // This is a simplified calculation (ignoring level multipliers for real-time display)
                    total += timeDiff * (baseRewardRate as bigint);
                }
            });

            setRealTimeRewards(total);
        }, 1000);

        return () => clearInterval(interval);
    }, [stakedNfts, baseRewardRate]);

    const projections = useMemo(() => {
        if (!baseRewardRate || !stakedNfts) return null;
        const ratePerSec = (baseRewardRate as bigint) * BigInt(stakedNfts.length);
        
        return {
            daily: ratePerSec * 86400n,
            weekly: ratePerSec * 604800n,
            monthly: ratePerSec * 2592000n,
        };
    }, [baseRewardRate, stakedNfts]);

    return { realTimeRewards, projections };
}
