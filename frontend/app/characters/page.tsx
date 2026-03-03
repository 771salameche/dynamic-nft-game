'use client';

import { useAccount } from 'wagmi';
import { useGameCharacter } from '@/hooks/useGameCharacter';
import { CharacterCard } from '@/components/CharacterCard';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

export default function GalleryPage() {
    const { isConnected } = useAccount();
    const { useOwnedCharacters } = useGameCharacter();
    const { data: ownedTokensData, isLoading, isError } = useOwnedCharacters();
    const ownedTokens = ownedTokensData as bigint[] | undefined;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!isConnected) {
        return (
            <div className="container mx-auto px-4 py-32 text-center">
                <h1 className="text-4xl font-bold mb-4">Your Gallery</h1>
                <p className="text-xl text-muted-foreground">Please connect your wallet to view your heroes.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">My Heroes</h1>
                    <p className="text-muted-foreground">Manage and view your Morpheum collection.</p>
                </div>
                <Link
                    href="/mint"
                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
                >
                    Mint New
                </Link>
            </div>

            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
                            <Skeleton className="w-full h-48 rounded-lg" />
                            <Skeleton className="h-6 w-1/2" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <div className="p-8 text-center bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-semibold">
                    Error loading your NFTs. Are you on the right network?
                </div>
            )}

            {ownedTokens && ownedTokens.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-card/50">
                    <p className="text-2xl font-semibold mb-4 text-muted-foreground">No heroes found in your wallet.</p>
                    <Link
                        href="/mint"
                        className="text-primary hover:underline font-bold text-lg"
                    >
                        Head to the Mint page to get started!
                    </Link>
                </div>
            )}

            {ownedTokens && ownedTokens.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ownedTokens.map((tokenId: bigint) => (
                        <CharacterCard key={tokenId.toString()} tokenId={tokenId} />
                    ))}
                </div>
            )}
        </div>
    );
}
