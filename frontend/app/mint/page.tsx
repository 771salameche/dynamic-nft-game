'use client';

import { useState, useEffect } from 'react';
import { useAccount, useEstimateGas } from 'wagmi';
import { motion } from 'framer-motion';
import { Sword, Wand2, Ghost, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatEther } from 'viem';

import { useGameCharacter } from '@/hooks/useGameCharacter';
import { ClassCard } from '@/components/mint/ClassCard';
import { CharacterPreview } from '@/components/mint/CharacterPreview';
import { ConnectButton } from '@/components/web3/ConnectButton';
import { Button } from '@/components/ui/button';
import { GAME_CHARACTER_ADDRESS } from '@/lib/contracts';

const CHARACTER_CLASSES = [
  {
    name: 'Warrior',
    description: 'Masters of brute force and physical endurance. High strength and defense.',
    icon: <Sword className="w-6 h-6" />,
    stats: { strength: 80, agility: 40, intelligence: 30 }
  },
  {
    name: 'Mage',
    description: 'Wielders of arcane energies. High intelligence and devastating spells.',
    icon: <Wand2 className="w-6 h-6" />,
    stats: { strength: 20, agility: 40, intelligence: 90 }
  },
  {
    name: 'Rogue',
    description: 'Shadow dwellers who strike with precision and speed. High agility.',
    icon: <Ghost className="w-6 h-6" />,
    stats: { strength: 40, agility: 90, intelligence: 50 }
  }
];

export default function MintPage() {
  const { isConnected, address } = useAccount();
  const [selectedClass, setSelectedClass] = useState(CHARACTER_CLASSES[0]);
  const [isVRFPending, setIsVRFPending] = useState(false);
  const { mintCharacter, isLoading, isSuccess } = useGameCharacter();

  // Gas estimation
  const { data: gasEstimate } = useEstimateGas({
    account: address,
    to: GAME_CHARACTER_ADDRESS,
  });

  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await mintCharacter(selectedClass.name);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVRFPending(true);
      toast.success('Mint transaction confirmed! Waiting for traits reveal...');
      
      timer = setTimeout(() => {
        setIsVRFPending(false);
        toast.success(`${selectedClass.name} traits have been revealed! Check your collection.`);
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, selectedClass.name]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Begin Your Adventure</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Connect your wallet to mint your first unique NFT character and start evolving in the ecosystem.
          </p>
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black mb-3 tracking-tight"
          >
            MINT YOUR HERO
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Choose a path and summon your unique warrior from the blockchain.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Class Selection */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CHARACTER_CLASSES.map((cls, idx) => (
                <motion.div
                  key={cls.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ClassCard
                    name={cls.name}
                    description={cls.description}
                    stats={cls.stats}
                    icon={cls.icon}
                    isSelected={selectedClass.name === cls.name}
                    onSelect={() => setSelectedClass(cls)}
                  />
                </motion.div>
              ))}
            </div>

            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Minting Information
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">Polygon Amoy Testnet</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Mint Price</span>
                  <span className="font-bold text-primary text-base">FREE</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Estimated Gas</span>
                  <span className="font-mono">
                    {gasEstimate ? `~${formatEther(gasEstimate)} MATIC` : 'Calculating...'}
                  </span>
                </div>
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>
                    Traits are generated using Chainlink VRF. This process can take up to 2 minutes after the transaction is confirmed.
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-8 text-lg font-bold h-14"
                disabled={isLoading || isVRFPending}
                onClick={handleMint}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Transacting...
                  </span>
                ) : isVRFPending ? (
                  "Waiting for VRF..."
                ) : (
                  `MINT ${selectedClass.name.toUpperCase()}`
                )}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full sticky top-24">
              <CharacterPreview 
                characterClass={selectedClass.name} 
                isMinting={isLoading}
                isVRFPending={isVRFPending}
              />
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                <div className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium mb-4">
                  PROTOTYPE PREVIEW
                </div>
                <p className="text-muted-foreground text-sm italic">
                  Visual representation may vary slightly after traits are revealed.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}