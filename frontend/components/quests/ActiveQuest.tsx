'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SMART_QUEST_ENGINE_ABI = parseAbi([
    'function getActiveQuest(address player) view returns (tuple(uint256 questId, address player, string description, string aiExplanation, uint8 questType, uint8 difficulty, uint256 xpReward, uint256 tokenReward, uint256 createdAt, uint256 expiresAt, bool completed, bool claimed))',
    'function completeQuest(uint256 questId)',
    'function requestQuest()',
]);

const QUEST_TYPES = ['Breeding', 'Staking', 'Leveling', 'Social', 'Collection'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

export function ActiveQuest() {
    const { address } = useAccount();
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Read active quest
    const { data: quest, refetch } = useReadContract({
        address: process.env.NEXT_PUBLIC_SMART_QUEST_ENGINE_ADDRESS as `0x${string}`,
        abi: SMART_QUEST_ENGINE_ABI,
        functionName: 'getActiveQuest',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    // Complete quest mutation
    const { writeContract: completeQuest, isPending: isCompleting } = useWriteContract();

    // Calculate time remaining
    useEffect(() => {
        if (!quest) return;

        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = Number(quest.expiresAt);
            const remaining = expiresAt - now;

            if (remaining <= 0) {
                setTimeRemaining('Expired');
                clearInterval(interval);
            } else {
                const days = Math.floor(remaining / 86400);
                const hours = Math.floor((remaining % 86400) / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [quest]);

    const handleCompleteQuest = () => {
        if (!quest) return;

        completeQuest({
            address: process.env.NEXT_PUBLIC_SMART_QUEST_ENGINE_ADDRESS as `0x${string}`,
            abi: SMART_QUEST_ENGINE_ABI,
            functionName: 'completeQuest',
            args: [quest.questId],
        });
    };

    if (!address) {
        return (
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400">Connect your wallet to see quests</p>
            </div>
        );
    }

    // Handle quest as result of getActiveQuest
    // Viem returns tuple as array or object depending on ABI
    // Usually with parseAbi and named returns it's an object
    if (!quest || (quest && quest.description === "")) {
        return <RequestQuestButton />;
    }

    const questType = QUEST_TYPES[quest.questType];
    const difficulty = DIFFICULTIES[quest.difficulty];
    const difficultyColor = {
        Easy: 'text-green-500',
        Medium: 'text-yellow-500',
        Hard: 'text-orange-500',
        Expert: 'text-red-500',
    }[difficulty as keyof typeof difficultyColor] || 'text-gray-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="quest-card bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-6 rounded-lg border border-purple-500/30 shadow-xl"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs font-semibold text-purple-300 border border-purple-500/30">
                            {questType}
                        </span>
                        <span className={`px-3 py-1 bg-black/20 rounded-full text-xs font-semibold border border-white/5 ${difficultyColor}`}>
                            {difficulty}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{quest.description}</h3>
                </div>

                {/* Time remaining */}
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Time Left</p>
                    <p className="text-lg font-mono font-bold text-white">{timeRemaining}</p>
                </div>
            </div>

            {/* AI Explanation */}
            <div className="mb-6 p-4 bg-black/40 rounded-lg border-l-4 border-purple-500">
                <p className="text-sm text-gray-300 flex items-start gap-3 leading-relaxed">
                    <span className="text-xl bg-purple-500/20 p-1 rounded leading-none">🤖</span>
                    <span className="italic">"{quest.aiExplanation}"</span>
                </p>
            </div>

            {/* Rewards */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-black/30 p-4 rounded-lg text-center border border-white/5">
                    <p className="text-xs text-gray-400 uppercase mb-1">XP Reward</p>
                    <p className="text-2xl font-bold text-yellow-400">+{quest.xpReward.toString()}</p>
                </div>
                <div className="flex-1 bg-black/30 p-4 rounded-lg text-center border border-white/5">
                    <p className="text-xs text-gray-400 uppercase mb-1">Token Reward</p>
                    <p className="text-2xl font-bold text-green-400">
                        {formatEther(quest.tokenReward)} GAME
                    </p>
                </div>
            </div>

            {/* Action button */}
            {!quest.completed && (
                <button
                    onClick={handleCompleteQuest}
                    disabled={isCompleting}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-gray-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 disabled:cursor-not-allowed"
                >
                    {isCompleting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Completing...
                        </span>
                    ) : 'Complete Quest'}
                </button>
            )}

            {quest.completed && (
                <div className="w-full py-4 bg-green-500/20 text-green-400 font-bold rounded-xl text-center border border-green-500/30">
                    <span className="flex items-center justify-center gap-2">
                        <span>✅</span> Quest Completed!
                    </span>
                </div>
            )}
        </motion.div>
    );
}

function RequestQuestButton() {
    const { writeContract, isPending } = useWriteContract();

    const handleRequestQuest = () => {
        writeContract({
            address: process.env.NEXT_PUBLIC_SMART_QUEST_ENGINE_ADDRESS as `0x${string}`,
            abi: SMART_QUEST_ENGINE_ABI,
            functionName: 'requestQuest',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/40 p-10 rounded-xl border border-white/10 text-center backdrop-blur-sm"
        >
            <div className="mb-6 relative inline-block">
                <span className="text-7xl">🎯</span>
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 text-2xl"
                >
                    ✨
                </motion.div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">No Active Quest</h3>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                Your dynamic journey awaits. Request a personalized quest generated by AI specifically for your playstyle.
            </p>
            <button
                onClick={handleRequestQuest}
                disabled={isPending}
                className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 disabled:cursor-not-allowed group"
            >
                {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        Request AI Quest
                        <span className="group-hover:translate-x-1 transition-transform">✨</span>
                    </span>
                )}
            </button>
        </motion.div>
    );
}
