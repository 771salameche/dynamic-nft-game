'use client';

import { useState } from 'react';
import { useBreeding, useCanBreed } from '@/hooks/useBreeding';
import { useOwnedCharacters, useCharacterTraits } from '@/hooks/useGameCharacter';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { useAccount } from 'wagmi';
import { formatTokenAmount } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function BreedingPage() {
  const { isConnected } = useAccount();
  const { breed, fuse, isLoading } = useBreeding();
  const { balance } = useOwnedCharacters();
  
  const [parent1, setParent1] = useState<string>('');
  const [parent2, setParent2] = useState<string>('');
  const [mode, setMode] = useState<'breed' | 'fuse'>('breed');

  const handleAction = async () => {
    if (!parent1 || !parent2) {
      toast.error('Please enter both character IDs');
      return;
    }
    if (parent1 === parent2) {
      toast.error('Cannot select the same character');
      return;
    }

    const p1 = BigInt(parent1);
    const p2 = BigInt(parent2);

    if (mode === 'breed') {
      await breed(p1, p2);
    } else {
      await fuse(p1, p2);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold">Laboratory</h1>
            <p className="text-gray-400 mt-2">Create the next generation of heroes</p>
          </div>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <div className="text-center p-12 bg-slate-900 rounded-2xl border border-slate-800">
            <p className="text-xl text-gray-400">Please connect your wallet to access the Laboratory.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex bg-slate-900 p-1 rounded-xl w-fit mx-auto border border-slate-800">
              <button
                onClick={() => setMode('breed')}
                className={`px-8 py-2 rounded-lg font-bold transition-all ${
                  mode === 'breed' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Breeding
              </button>
              <button
                onClick={() => setMode('fuse')}
                className={`px-8 py-2 rounded-lg font-bold transition-all ${
                  mode === 'fuse' ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Fusion
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-semibold mb-4 text-purple-400">Subject 1</h3>
                  <input
                    type="number"
                    placeholder="Enter Token ID"
                    value={parent1}
                    onChange={(e) => setParent1(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>

                <div className="flex justify-center text-2xl font-bold text-gray-600">
                  {mode === 'breed' ? '+' : '×'}
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-semibold mb-4 text-purple-400">Subject 2</h3>
                  <input
                    type="number"
                    placeholder="Enter Token ID"
                    value={parent2}
                    onChange={(e) => setParent2(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    {mode === 'breed' ? 'Generate Offspring' : 'Force Evolution'}
                  </h2>
                  <div className="space-y-4 text-gray-400 mb-8">
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span className="text-white font-mono">{mode === 'breed' ? '100' : '500'} GAME</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate</span>
                      <span className="text-green-400 font-mono">100%</span>
                    </div>
                    <p className="text-sm italic mt-4">
                      {mode === 'breed' 
                        ? 'Combining two characters creates a new Gen+1 character with inherited traits and random mutations.'
                        : 'Fusing two level 50+ characters creates a powerful hybrid with massive stat boosts.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAction}
                  disabled={isLoading || !parent1 || !parent2}
                  className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
                    mode === 'breed'
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/40'
                      : 'bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-900/40'
                  } disabled:opacity-50 disabled:shadow-none`}
                >
                  {isLoading ? 'Processing...' : mode === 'breed' ? 'Start Breeding' : 'Initialize Fusion'}
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-900/20 border border-blue-800 rounded-xl">
              <p className="text-blue-300 text-sm flex items-center">
                <span className="mr-2">ℹ️</span>
                You own {balance?.toString() || '0'} characters. Check your profile for IDs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
