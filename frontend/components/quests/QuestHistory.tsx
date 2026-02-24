'use client';

import { useAccount, useReadContract } from 'wagmi';
import { parseAbi, formatEther } from 'viem';
import { motion } from 'framer-motion';

const SMART_QUEST_ENGINE_ABI = parseAbi([
    'function getQuestHistory(address player) view returns (uint256[])',
    'function quests(uint256 questId) view returns (tuple(uint256 questId, address player, string description, string aiExplanation, uint8 questType, uint8 difficulty, uint256 xpReward, uint256 tokenReward, uint256 createdAt, uint256 expiresAt, bool completed, bool claimed))',
]);

const QUEST_TYPES = ['Breeding', 'Staking', 'Leveling', 'Social', 'Collection'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

export function QuestHistory() {
    const { address } = useAccount();

    const { data: questIds } = useReadContract({
        address: process.env.NEXT_PUBLIC_SMART_QUEST_ENGINE_ADDRESS as `0x${string}`,
        abi: SMART_QUEST_ENGINE_ABI,
        functionName: 'getQuestHistory',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    if (!address) return null;

    if (!questIds || questIds.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-900/40 rounded-xl border border-dashed border-gray-700">
                <span className="text-4xl grayscale opacity-50 block mb-3">📜</span>
                <p className="text-gray-500 font-medium">No completed quests in your annals yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Legendary Deeds</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...questIds].reverse().map((questId, index) => (
                    <QuestHistoryItem
                        key={questId.toString()}
                        questId={questId}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

function QuestHistoryItem({ questId, index }: { questId: bigint; index: number }) {
    const { data: quest } = useReadContract({
        address: process.env.NEXT_PUBLIC_SMART_QUEST_ENGINE_ADDRESS as `0x${string}`,
        abi: SMART_QUEST_ENGINE_ABI,
        functionName: 'quests',
        args: [questId],
    });

    if (!quest) return null;

    const questType = QUEST_TYPES[quest.questType];
    const difficulty = DIFFICULTIES[quest.difficulty];

    const difficultyColors = {
        Easy: 'bg-green-500/10 text-green-400 border-green-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        Hard: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        Expert: 'bg-red-500/10 text-red-400 border-red-500/20',
    }[difficulty as keyof typeof difficultyColors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-gray-800/30 hover:bg-gray-800/50 p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all cursor-default"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold tracking-widest">
                            {questType}
                        </span>
                        <span className={`px-2.5 py-0.5 border rounded-md text-[10px] uppercase font-bold tracking-widest ${difficultyColors}`}>
                            {difficulty}
                        </span>
                    </div>
                    <p className="text-white font-semibold group-hover:text-purple-300 transition-colors">{quest.description}</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold mb-1">
                        <span className="text-[10px]">✨</span> SUCCESS
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter">
                        {new Date(Number(quest.createdAt) * 1000).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]"></div>
                        <span className="text-xs font-bold text-yellow-500/80">+{quest.xpReward.toString()} XP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>
                        <span className="text-xs font-bold text-green-500/80">+{formatEther(quest.tokenReward)} GAME</span>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-gray-500">ID: #{quest.questId.toString().padStart(4, '0')}</span>
                </div>
            </div>
        </motion.div>
    );
}
