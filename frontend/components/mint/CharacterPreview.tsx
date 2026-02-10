'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CharacterSprite } from '../character/CharacterSprite';
import { CharacterTraits } from '@/types/game';
import { Loader2, Sparkles } from 'lucide-react';

interface CharacterPreviewProps {
  characterClass: string;
  isMinting: boolean;
  isVRFPending?: boolean;
}

export function CharacterPreview({ characterClass, isMinting, isVRFPending }: CharacterPreviewProps) {
  // Create mock traits for preview
  const previewTraits: CharacterTraits = {
    level: 1n,
    strength: 0n,
    agility: 0n,
    intelligence: 0n,
    experience: 0n,
    lastTrainedAt: 0,
    generation: 0n,
    characterClass: characterClass,
    genetics: {
      strengthDominant: false,
      agilityDominant: false,
      intelligenceDominant: false,
      hiddenStrength: 0,
      hiddenAgility: 0,
      hiddenIntelligence: 0,
    },
    mutationCount: 0,
    breedCount: 0,
    isFused: false,
  };

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={characterClass + (isMinting ? '-minting' : '-idle')}
          initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 1.1, rotateY: 20 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full h-full flex items-center justify-center"
        >
          <div className={isMinting ? "animate-bounce" : ""}>
            <CharacterSprite traits={previewTraits} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Status Overlay */}
      <AnimatePresence>
        {(isMinting || isVRFPending) && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-background/40 border border-primary/20"
          >
            <div className="bg-card p-6 rounded-2xl shadow-2xl border border-primary/20 text-center max-w-[80%]">
              {isVRFPending ? (
                <>
                  <div className="relative mb-4 inline-block">
                    <Sparkles className="w-12 h-12 text-yellow-500 animate-pulse" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-2 border-2 border-dashed border-yellow-500/50 rounded-full"
                    />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Summoning Randomness</h4>
                  <p className="text-sm text-muted-foreground">
                    Chainlink VRF is determining your character&apos;s unique traits...
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <h4 className="text-xl font-bold mb-2">Minting Character</h4>
                  <p className="text-sm text-muted-foreground">
                    Confirm the transaction in your wallet to begin your journey.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40 rounded-tl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40 rounded-br" />
    </div>
  );
}
