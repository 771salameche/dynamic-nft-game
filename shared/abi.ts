// Shared ABI definitions for frontend (viem/wagmi) and backend (ethers).
// Centralizes contract interfaces to avoid drift between layers.

import { parseAbi } from 'viem';

// GameCharacter
export const GameCharacterAbiViem = parseAbi([
  // Public mint for players
  'function mintCharacter(uint8 classType) external payable',
  // Traits accessor – return type omitted to avoid abitype tuple parsing issues
  'function getCharacterTraits(uint256 tokenId) external view',
]);

export const GameCharacterAbiEthers = [
  // Events
  'event CharacterMinted(uint256 indexed tokenId, address indexed owner, string characterClass)',
  'event TraitsRevealed(uint256 indexed tokenId, uint256[3] traits)',
  'event ArtMetadataSet(uint256 indexed tokenId, string imageURI, string prompt)',
  // Views
  'function getCharacterTraits(uint256 tokenId) view returns (tuple(uint256 level, uint256 strength, uint256 agility, uint256 intelligence, uint256 experience, uint40 lastTrainedAt, uint256 generation, string characterClass, tuple(bool strengthDominant, bool agilityDominant, bool intelligenceDominant, uint8 hiddenStrength, uint8 hiddenAgility, uint8 hiddenIntelligence) genetics, uint8 mutationCount, uint8 breedCount, bool isFused))',
  'function artMetadata(uint256 tokenId) view returns (string imageURI, uint256 generatedAt, bool isGenerated, string aiPrompt)',
  'function ownerOf(uint256 tokenId) view returns (address)',
] as const;

// ArtGenerator
export const ArtGeneratorAbiEthers = [
  'event ArtRequested(uint256 indexed tokenId, address requester)',
  'event ArtGenerated(uint256 indexed tokenId, string imageURI)',
  'function requestArt(uint256 tokenId) external',
  'function fulfillArt(uint256 tokenId, string memory imageURI, string memory prompt) external',
] as const;

// SmartQuestEngine
export const SmartQuestEngineAbiViem = parseAbi([
  // Return type omitted to avoid tuple parsing issues; frontend casts result.
  'function getActiveQuest(address player) view',
  'function getQuestHistory(address player) view returns (uint256[])',
  'function quests(uint256 questId) view',
  'function requestQuest() external',
  'function completeQuest(uint256 questId) external',
]);

export const SmartQuestEngineAbiEthers = [
  'event QuestRequested(address indexed player, uint256 timestamp)',
  'event QuestGenerated(uint256 indexed questId, address indexed player, uint8 questType, string description)',
  'event QuestCompleted(uint256 indexed questId, address indexed player, uint256 xpReward, uint256 tokenReward)',
  'function getActiveQuest(address player) view returns (tuple(uint256 questId, address player, string description, string aiExplanation, uint8 questType, uint8 difficulty, uint256 xpReward, uint256 tokenReward, uint256 createdAt, uint256 expiresAt, bool completed, bool claimed))',
  'function playerQuestHistory(address player, uint256 index) view returns (uint256)',
  'function playerQuestCount(address player) view returns (uint256)',
  'function requestQuest() external',
  'function fulfillQuest(address player, string memory description, string memory aiExplanation, uint8 questType, uint8 difficulty, uint256 xpReward, uint256 tokenReward, uint256 durationInDays) external',
  'function completeQuest(uint256 questId, uint256 tokenId) external',
] as const;

// CharacterStaking
export const CharacterStakingAbiViem = parseAbi([
  'function stake(uint256 tokenId) external',
  'function unstake(uint256 tokenId) external',
  'function claimRewards(uint256 tokenId) external',
  'function calculateRewards(address account, uint256 tokenId) external view returns (uint256)',
  'function getStakedTokens(address account) external view returns (uint256[] memory)',
]);

// CharacterBreeding
export const CharacterBreedingAbiViem = parseAbi([
  'function breed(uint256 parent1Id, uint256 parent2Id) external payable',
  'function canBreed(uint256 parent1Id, uint256 parent2Id) external view returns (bool)',
  'function getBreedingHistory(uint256 tokenId) external view',
]);

// AchievementTracker
export const AchievementTrackerAbiViem = parseAbi([
  'function getPlayerAchievements(address player) external view returns (uint256[] memory)',
  'function getProgress(address player, uint256 achievementId) external view returns (uint256 current, uint256 required, bool completed)',
]);

