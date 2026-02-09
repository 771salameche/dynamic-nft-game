'use client';

import { useState } from 'react';
import { useGameCharacter } from '@/hooks/useGameCharacter';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { useAccount } from 'wagmi';

const CLASSES = ['Warrior', 'Mage', 'Rogue'];

export default function MintPage() {
  const { isConnected } = useAccount();
  const { mintCharacter, isLoading } = useGameCharacter();
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);

  const handleMint = async () => {
    await mintCharacter(selectedClass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Mint New Character</h1>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <div className="text-center p-12 bg-slate-900 rounded-2xl border border-slate-800">
            <p className="text-xl text-gray-400">Please connect your wallet to mint characters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <h2 className="text-2xl font-semibold mb-4">Choose Your Class</h2>
                <div className="space-y-4">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`w-full p-4 text-left rounded-xl border transition-all ${
                        selectedClass === cls
                          ? 'bg-purple-600 border-purple-400 scale-[1.02]'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-lg font-bold">{cls}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleMint}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Minting...' : 'Mint Character'}
              </button>
            </div>

            <div className="flex items-center justify-center p-12 bg-slate-900 rounded-2xl border border-dashed border-slate-700">
              <div className="text-center">
                <div className="w-48 h-48 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-slate-700">
                  <span className="text-6xl">?</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-500">Preview</h3>
                <p className="text-gray-600 mt-2">Your character's traits will be randomized on-chain.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
