'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useGameCharacter } from '@/hooks/useGameCharacter';
import toast from 'react-hot-toast';

export default function MintPage() {
  const { isConnected } = useAccount();
  const { mintCharacter, isMinting } = useGameCharacter();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const classes = [
    { id: 0, name: 'Warrior', emoji: '🗡️', desc: 'High Strength, focuses on melee damage.' },
    { id: 1, name: 'Mage', emoji: 'staff', desc: 'High Intelligence, casts powerful spells.' },
    { id: 2, name: 'Rogue', emoji: '🏹', desc: 'High Agility, fast and evasive.' }
  ];

  const handleMint = async () => {
    if (selectedClass === null) return;
    try {
      const hash = await mintCharacter(selectedClass);
      setTxHash(hash);
      toast.success('Mint transaction submitted!');
    } catch (error) {
      console.error(error);
      toast.error('Minting failed. Check console for details.');
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Mint Your Hero</h1>
        <p className="text-xl text-muted-foreground">Please connect your wallet to start minting.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Mint Your Champion</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose your path wisely. Your starting class determines your base stats and future progression in the game.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {classes.map((c) => (
          <motion.div
            key={c.id}
            onClick={() => setSelectedClass(c.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-2xl border-2 p-6 transition-colors ${selectedClass === c.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
              }`}
          >
            <div className="text-6xl text-center mb-6">{c.emoji}</div>
            <h3 className="text-2xl font-bold text-center mb-2">{c.name}</h3>
            <p className="text-center text-muted-foreground">{c.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="bg-secondary/10 px-6 py-4 rounded-xl border border-secondary/20 font-mono text-center">
          Mint Cost: <span className="font-bold text-primary">0.01 MATIC</span>
        </div>

        <button
          onClick={handleMint}
          disabled={selectedClass === null || isMinting || isWaiting}
          className="px-12 py-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto min-w-[300px]"
        >
          {isMinting || isWaiting ? 'Minting in progress...' : 'Mint Hero'}
        </button>

        {isSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-center w-full max-w-md">
            Successfully minted! View your hero in the Gallery.
          </div>
        )}
      </div>
    </div>
  );
}