'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useOwnedTokenIds, useCharacterTraits } from '@/hooks/useGameCharacter';
import { CharacterSprite } from '../character/CharacterSprite';
import { motion } from 'framer-motion';
import { Search, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { CharacterTraits } from '@/types/game';

interface CharacterSelectionModalProps {
  onSelect: (tokenId: bigint) => void;
  excludeId?: bigint;
  title: string;
}

export function CharacterSelectionModal({ onSelect, excludeId, title }: CharacterSelectionModalProps) {
  const { tokenIds } = useOwnedTokenIds();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter tokenIds based on exclusion and search (search is dummy here as we don't have all names/classes yet)
  const filteredIds = tokenIds.filter(id => id !== excludeId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full h-full min-h-[150px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
          <PlusCircle className="w-8 h-8 text-slate-700 group-hover:text-purple-500 mb-2" />
          <span className="text-slate-500 font-bold uppercase text-xs tracking-widest group-hover:text-purple-400">Select Character</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl uppercase tracking-tighter">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by ID or Class..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredIds.length > 0 ? (
              filteredIds.map((id) => (
                <CharacterGridItem 
                  key={id.toString()} 
                  tokenId={id} 
                  onSelect={() => {
                    onSelect(id);
                    setIsOpen(false);
                  }} 
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500 font-bold uppercase text-xs">
                No characters available
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CharacterGridItem({ tokenId, onSelect }: { tokenId: bigint, onSelect: () => void }) {
  const { data: traits, isLoading } = useCharacterTraits(tokenId);

  if (isLoading) return <div className="aspect-square bg-slate-900 rounded-2xl animate-pulse" />;
  if (!traits) return null;

  const characterTraits = traits as unknown as CharacterTraits;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-purple-500/50 transition-all group"
    >
      <div className="aspect-square mb-2 grayscale group-hover:grayscale-0 transition-all">
        <CharacterSprite traits={characterTraits} />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{tokenId.toString()}</p>
        <p className="text-xs font-bold text-white uppercase">{characterTraits.characterClass}</p>
        <p className="text-[10px] text-purple-400 font-mono">LVL {characterTraits.level.toString()}</p>
      </div>
    </motion.div>
  );
}
