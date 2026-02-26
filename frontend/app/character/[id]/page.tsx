'use client';

import { useParams } from 'next/navigation';
import { useCharacterTraits } from '@/hooks/useGameCharacter';
import { CharacterCard } from '@/components/CharacterCard';
import { motion } from 'framer-motion';

export default function CharacterDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const tokenId = BigInt(id);

    const { data: traits, isLoading } = useCharacterTraits(tokenId);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="w-64 h-64 bg-primary/10 rounded-xl"></div>
                    <div className="h-8 bg-primary/10 rounded w-1/3"></div>
                </div>
            </div>
        );
    }

    if (!traits) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold text-destructive">Character NotFound</h1>
            </div>
        );
    }

    const [level, strength, agility, intelligence, classType] = traits as [bigint, bigint, bigint, bigint, number];

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-start">

                {/* Left Column - Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-md mx-auto w-full"
                >
                    <CharacterCard tokenId={tokenId} showLink={false} />
                </motion.div>

                {/* Right Column - Details */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    <div>
                        <h1 className="text-5xl font-black mb-2">Hero #{id}</h1>
                        <p className="text-xl text-muted-foreground">Dynamic NFT dynamically shifting entirely entirely on-chain.</p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-xl font-bold mb-4 border-b border-border/50 pb-2">Stats Breakdown</h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-sm">Strength</span>
                                    <span className="text-sm">{strength.toString()} / 100</span>
                                </div>
                                <div className="w-full bg-secondary/20 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(Number(strength), 100)}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-sm">Agility</span>
                                    <span className="text-sm">{agility.toString()} / 100</span>
                                </div>
                                <div className="w-full bg-secondary/20 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(Number(agility), 100)}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-sm">Intelligence</span>
                                    <span className="text-sm">{intelligence.toString()} / 100</span>
                                </div>
                                <div className="w-full bg-secondary/20 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(Number(intelligence), 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-2">Actions</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Take this character to other parts of the ecosystem to level them up and earn rewards.
                        </p>
                        <div className="flex gap-4">
                            <a href="/staking" className="text-sm bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors font-medium">
                                Stake
                            </a>
                            <a href="/breeding" className="text-sm bg-secondary/20 hover:bg-secondary/30 text-secondary px-4 py-2 rounded-lg transition-colors font-medium">
                                Breed
                            </a>
                        </div>
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
