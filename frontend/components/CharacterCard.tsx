'use client';

import { motion } from 'framer-motion';
import { useCharacterTraits } from '@/hooks/useGameCharacter';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface CharacterCardProps {
    tokenId: bigint;
    showLink?: boolean;
}

const CLASS_NAMES = ['Warrior', 'Mage', 'Rogue'];
const CLASS_COLORS = ['text-red-500', 'text-blue-500', 'text-green-500'];

export function CharacterCard({ tokenId, showLink = true }: CharacterCardProps) {
    const { data: traits, isLoading, isError } = useCharacterTraits(tokenId);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <Skeleton className="w-full h-48 rounded-lg" />
                <Skeleton className="h-6 w-1/2" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        );
    }

    if (isError || !traits) {
        return (
            <div className="rounded-xl border border-destructive bg-card p-4 text-center">
                Error loading traits for #{tokenId.toString()}
            </div>
        );
    }

    const [level, strength, agility, intelligence, classType] = traits as [bigint, bigint, bigint, bigint, number];

    const CardContent = (
        <motion.div
            whileHover={showLink ? { scale: 1.02 } : {}}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-4xl font-black">#{tokenId.toString()}</span>
            </div>

            <div className="aspect-square w-full rounded-lg bg-secondary/10 flex items-center justify-center mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-0" />
                <span className="text-6xl z-10 filter drop-shadow-md">
                    {classType === 0 ? '🗡️' : classType === 1 ? 'staff' : '🏹'}
                </span>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Class</span>
                        <p className={`text-lg font-bold ${CLASS_COLORS[classType] || 'text-foreground'}`}>
                            {CLASS_NAMES[classType] || 'Unknown'}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Level</span>
                        <p className="text-lg font-bold">Lvl {level.toString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                    <div className="text-center bg-background rounded p-1">
                        <p className="text-xs text-muted-foreground">STR</p>
                        <p className="font-semibold text-sm">{strength.toString()}</p>
                    </div>
                    <div className="text-center bg-background rounded p-1">
                        <p className="text-xs text-muted-foreground">AGI</p>
                        <p className="font-semibold text-sm">{agility.toString()}</p>
                    </div>
                    <div className="text-center bg-background rounded p-1">
                        <p className="text-xs text-muted-foreground">INT</p>
                        <p className="font-semibold text-sm">{intelligence.toString()}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    if (showLink) {
        return <Link href={`/character/${tokenId.toString()}`}>{CardContent}</Link>;
    }

    return CardContent;
}
