export interface GeneticMarkers {
  strengthDominant: boolean;
  agilityDominant: boolean;
  intelligenceDominant: boolean;
  hiddenStrength: number;
  hiddenAgility: number;
  hiddenIntelligence: number;
}

export interface CharacterTraits {
  level: bigint;
  strength: bigint;
  agility: bigint;
  intelligence: bigint;
  experience: bigint;
  lastTrainedAt: number;
  generation: bigint;
  characterClass: string;
  genetics: GeneticMarkers;
  mutationCount: number;
  breedCount: number;
  isFused: boolean;
}

export interface StakeInfo {
  tokenId: bigint;
  stakedAt: bigint;
  lastClaimAt: bigint;
}

export interface Achievement {
  achievementId: bigint;
  name: string;
  description: string;
  category: string;
  tier: number;
  xpReward: bigint;
  tokenReward: bigint;
  isActive: boolean;
  unlockedCount: bigint;
}

export interface PlayerAchievement {
  achievementId: bigint;
  unlockedAt: bigint;
  progress: bigint;
  isUnlocked: boolean;
}

export interface BreedingPair {
  parent1: bigint;
  parent2: bigint;
  offspring: bigint;
  timestamp: bigint;
}
