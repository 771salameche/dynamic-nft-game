'use client';

import { useState } from 'react';
import { useBreeding, useBreedingCosts } from '@/hooks/useBreeding';
import { useCharacterTraits } from '@/hooks/useGameCharacter';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { OffspringPreview } from '@/components/breeding/OffspringPreview';
import { BreedingHistorySection } from '@/components/breeding/BreedingHistorySection';
import { CharacterSelectionModal } from '@/components/breeding/CharacterSelectionModal';
import { FusionPanel } from '@/components/breeding/FusionPanel';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Dna, Zap, Loader2, AlertCircle } from 'lucide-react';
import { CharacterTraits } from '@/types/game';

export default function BreedingPage() {
  const { isConnected } = useAccount();
  const { breed, fuse, isLoading } = useBreeding();
  const { breedingCost, fusionCost } = useBreedingCosts();
  
  const [parent1Id, setParent1Id] = useState<bigint | null>(null);
  const [parent2Id, setParent2Id] = useState<bigint | null>(null);
  const [mode, setMode] = useState<'breed' | 'fuse'>('breed');

  const { data: traits1 } = useCharacterTraits(parent1Id || 0n);
  const { data: traits2 } = useCharacterTraits(parent2Id || 0n);

  const parent1Traits = traits1 as unknown as CharacterTraits | undefined;
  const parent2Traits = traits2 as unknown as CharacterTraits | undefined;

  const handleBreed = async () => {
    if (parent1Id && parent2Id) {
      await breed(parent1Id, parent2Id);
    }
  };

  const handleFuse = async () => {
    if (parent1Id && parent2Id) {
      await fuse(parent1Id, parent2Id);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <FlaskConical className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 uppercase tracking-tighter">Genesis Lab</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Connect your wallet to access the Laboratory and experiment with genetic inheritance.
          </p>
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20 text-[10px] font-black text-purple-500 uppercase tracking-widest">
              Experimental Facility
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Laboratory Console</h1>
          <p className="text-slate-500 font-medium">Engineer the next generation of blockchain heroes.</p>
        </div>
        <ConnectButton />
      </header>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-2">
          <button
            onClick={() => { setMode('breed'); setParent1Id(null); setParent2Id(null); }}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
              mode === 'breed' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Dna className="w-4 h-4" />
            Genetic Breeding
          </button>
          <button
            onClick={() => { setMode('fuse'); setParent1Id(null); setParent2Id(null); }}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
              mode === 'fuse' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            Force Evolution
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'breed' ? (
          <motion.div
            key="breed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            {/* Breeding Selection */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">1</span>
                    Primary Parent
                  </h3>
                  <CharacterSelectionModal 
                    title="Select Primary Parent" 
                    onSelect={setParent1Id} 
                    excludeId={parent2Id || undefined} 
                  />
                  {parent1Id && (
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-purple-400">Selected: #{parent1Id.toString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">2</span>
                    Secondary Parent
                  </h3>
                  <CharacterSelectionModal 
                    title="Select Secondary Parent" 
                    onSelect={setParent2Id} 
                    excludeId={parent1Id || undefined} 
                  />
                  {parent2Id && (
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-purple-400">Selected: #{parent2Id.toString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-500" />
                  Breeding Protocol
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-800">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Protocol Fee</span>
                    <span className="text-white font-black text-lg">{formatUnits(breedingCost, 18)} GAME</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-800">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Incubation Time</span>
                    <span className="text-white font-black">INSTANT</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-800">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Success Rate</span>
                    <span className="text-emerald-400 font-black tracking-widest">100%</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                  disabled={isLoading || !parent1Id || !parent2Id}
                  onClick={handleBreed}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Initializing...
                    </>
                  ) : "Begin Genesis Protocol"}
                </Button>
                
                <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-400 leading-relaxed font-medium">
                    Breeding requires parents to be off-cooldown. Siblings and ancestors within 2 generations cannot breed to prevent genetic decay.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <OffspringPreview traits1={parent1Traits} traits2={parent2Traits} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="fuse"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Fusion Subject 1
                  </h3>
                  <CharacterSelectionModal 
                    title="Select Fusion Subject" 
                    onSelect={setParent1Id} 
                    excludeId={parent2Id || undefined} 
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Fusion Subject 2
                  </h3>
                  <CharacterSelectionModal 
                    title="Select Fusion Subject" 
                    onSelect={setParent2Id} 
                    excludeId={parent1Id || undefined} 
                  />
                </div>
              </div>

              <FusionPanel 
                traits1={parent1Traits} 
                traits2={parent2Traits} 
                fusionCost={fusionCost}
                onFuse={handleFuse}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-12 border-t border-slate-900">
        <BreedingHistorySection tokenId={parent1Id || undefined} />
      </div>
    </div>
  );
}