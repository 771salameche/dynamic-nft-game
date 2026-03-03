'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useGameCharacter } from '@/hooks/useGameCharacter';
import { useBreeding } from '@/hooks/useBreeding';
import { CharacterCard } from '@/components/CharacterCard';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function BreedingPage() {
  const { isConnected } = useAccount();
  const { useOwnedCharacters } = useGameCharacter();
  const { data: ownedTokens } = useOwnedCharacters();

  const { breed, isBreedingTxPending } = useBreeding();

  const [parent1, setParent1] = useState<bigint | null>(null);
  const [parent2, setParent2] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleSelect = (tokenId: bigint) => {
    if (parent1 === tokenId) {
      setParent1(null);
    } else if (parent2 === tokenId) {
      setParent2(null);
    } else if (!parent1) {
      setParent1(tokenId);
    } else if (!parent2) {
      setParent2(tokenId);
    } else {
      toast.error('You can only select two parents.');
    }
  };

  const isSelected = (tokenId: bigint) => tokenId === parent1 || tokenId === parent2;

  const handleBreed = async () => {
    if (parent1 === null || parent2 === null) return;
    try {
      const hash = await breed(parent1, parent2);
      setTxHash(hash);
      toast.success('Breeding ritual initiated!');
    } catch (error) {
      console.error(error);
      toast.error('Breeding failed. Check console.');
    }
  };

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Breeding Sanctum</h1>
        <p className="text-xl text-muted-foreground">Connect your wallet to combine your heroes.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Breeding Sanctum</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select two max-level heroes to combine their genetics and potentially spawn a superior offspring.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">

        {/* Parent 1 */}
        <div className="w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-card">
          {parent1 ? (
            <div className="w-full relative group">
              <CharacterCard tokenId={parent1} showLink={false} />
              <button
                onClick={() => setParent1(null)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground font-medium">Select Parent 1</p>
          )}
        </div>

        {/* Action Center */}
        <div className="flex flex-col items-center">
          <div className="bg-primary/20 text-primary p-4 rounded-full mb-4">
            <span className="text-3xl">❤️</span>
          </div>

          <button
            onClick={handleBreed}
            disabled={parent1 === null || parent2 === null || isBreedingTxPending || isWaiting}
            className="px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg disabled:opacity-50 transition-all min-w-[200px]"
          >
            {isBreedingTxPending || isWaiting ? 'Breeding...' : 'Breed Heroes'}
          </button>
        </div>

        {/* Parent 2 */}
        <div className="w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-card">
          {parent2 ? (
            <div className="w-full relative group">
              <CharacterCard tokenId={parent2} showLink={false} />
              <button
                onClick={() => setParent2(null)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground font-medium">Select Parent 2</p>
          )}
        </div>

      </div>

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 text-green-500 p-6 rounded-xl text-center max-w-2xl mx-auto mb-16"
        >
          <h3 className="text-2xl font-bold mb-2">Success!</h3>
          <p>The ritual is complete. A new hero has been added to your gallery.</p>
        </motion.div>
      )}

      <div className="border-t border-border pt-12">
        <h2 className="text-2xl font-bold mb-6">Your Available Heroes</h2>

        {ownedTokens && ownedTokens.length < 2 && (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">You need at least 2 heroes to breed.</p>
            <a href="/mint" className="text-primary hover:underline font-bold">Go mint more heroes</a>
          </div>
        )}

        {ownedTokens && ownedTokens.length >= 2 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {ownedTokens.map((tokenId) => (
              <div
                key={tokenId.toString()}
                onClick={() => handleSelect(tokenId)}
                className={`cursor-pointer rounded-xl transition-all ${isSelected(tokenId)
                    ? 'ring-4 ring-primary scale-95 opacity-50'
                    : 'hover:scale-105'
                  }`}
              >
                <CharacterCard tokenId={tokenId} showLink={false} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
