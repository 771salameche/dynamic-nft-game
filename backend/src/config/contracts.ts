import { ethers } from 'ethers';
import { config } from './env';

// --- ABI Fragments ---
// Only include the functions/events we need, not the full ABI

export const GAME_CHARACTER_ABI = [
    // Events
    'event CharacterMinted(uint256 indexed tokenId, address indexed owner, string characterClass)',
    'event TraitsRevealed(uint256 indexed tokenId, uint256[3] traits)',
    'event ArtMetadataSet(uint256 indexed tokenId, string imageURI, string prompt)',

    // View functions
    'function getCharacterTraits(uint256 tokenId) view returns (tuple(uint256 level, uint256 strength, uint256 agility, uint256 intelligence, uint256 experience, uint40 lastTrainedAt, uint256 generation, string characterClass, tuple(bool strengthDominant, bool agilityDominant, bool intelligenceDominant, uint8 hiddenStrength, uint8 hiddenAgility, uint8 hiddenIntelligence) genetics, uint8 mutationCount, uint8 breedCount, bool isFused))',
    'function artMetadata(uint256 tokenId) view returns (string imageURI, uint256 generatedAt, bool isGenerated, string aiPrompt)',
    'function ownerOf(uint256 tokenId) view returns (address)',
];

export const ART_GENERATOR_ABI = [
    // Events
    'event ArtRequested(uint256 indexed tokenId, address requester)',
    'event ArtGenerated(uint256 indexed tokenId, string imageURI)',

    // Functions
    'function requestArt(uint256 tokenId) external',
    'function fulfillArt(uint256 tokenId, string memory imageURI, string memory prompt) external',
];

export const SMART_QUEST_ENGINE_ABI = [
    // Events
    'event QuestRequested(address indexed player, uint256 timestamp)',
    'event QuestGenerated(uint256 indexed questId, address indexed player, uint8 questType, string description)',
    'event QuestCompleted(uint256 indexed questId, address indexed player, uint256 xpReward, uint256 tokenReward)',

    // View functions
    'function getActiveQuest(address player) view returns (tuple(uint256 questId, address player, string description, string aiExplanation, uint8 questType, uint8 difficulty, uint256 xpReward, uint256 tokenReward, uint256 createdAt, uint256 expiresAt, bool completed, bool claimed))',
    'function playerQuestHistory(address player, uint256 index) view returns (uint256)',
    'function playerQuestCount(address player) view returns (uint256)',

    // Functions
    'function requestQuest() external',
    'function fulfillQuest(address player, string memory description, string memory aiExplanation, uint8 questType, uint8 difficulty, uint256 xpReward, uint256 tokenReward, uint256 durationInDays) external',
    'function completeQuest(uint256 questId, uint256 tokenId) external',
];

// --- Provider & Signer ---

export function getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(config.POLYGON_AMOY_RPC_URL);
}

export function getSigner(): ethers.Wallet {
    const provider = getProvider();
    return new ethers.Wallet(config.PRIVATE_KEY, provider);
}

// --- Contract Instances ---

export function getGameCharacterContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
    const connection = signerOrProvider || getProvider();
    return new ethers.Contract(config.GAME_CHARACTER_ADDRESS, GAME_CHARACTER_ABI, connection);
}

export function getArtGeneratorContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
    const connection = signerOrProvider || getSigner();
    return new ethers.Contract(config.ART_GENERATOR_ADDRESS, ART_GENERATOR_ABI, connection);
}

export function getSmartQuestContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
    const connection = signerOrProvider || getSigner();
    return new ethers.Contract(config.SMART_QUEST_ENGINE_ADDRESS, SMART_QUEST_ENGINE_ABI, connection);
}

export default {
    getProvider,
    getSigner,
    getGameCharacterContract,
    getArtGeneratorContract,
    getSmartQuestContract,
};
