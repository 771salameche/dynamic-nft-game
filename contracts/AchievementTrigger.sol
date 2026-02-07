// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IAchievementTracker {
    function unlockAchievement(address player, uint256 achievementId, uint256 tokenId) external;
    function getUnlockedCount(address player) external view returns (uint256);
    function getAchievementProgress(address player, uint256 achievementId) external view returns (uint256);
    function updateProgress(address player, uint256 achievementId, uint256 progress, uint256 tokenId) external;
}

interface IGameCharacter {
    function balanceOf(address owner) external view returns (uint256);
    function getCharacterTraits(uint256 tokenId) external view returns (
        uint256 level,
        uint256 strength,
        uint256 agility,
        uint256 intelligence,
        uint256 experience,
        uint40 lastTrainedAt,
        uint256 generation,
        string memory characterClass,
        bool strengthDominant,
        bool agilityDominant,
        bool intelligenceDominant,
        uint8 hiddenStrength,
        uint8 hiddenAgility,
        uint8 hiddenIntelligence,
        uint8 mutationCount,
        uint8 breedCount,
        bool isFused
    );
}

interface ICharacterStaking {
    struct StakeInfo {
        uint256 tokenId;
        uint256 stakedAt;
        uint256 lastClaimAt;
    }
    function getUserStakes(address user) external view returns (StakeInfo[] memory);
}

contract AchievementTrigger is Ownable {
    
    IAchievementTracker public tracker;
    IGameCharacter public character;
    ICharacterStaking public staking;

    // --- Achievement IDs ---
    // Collection
    uint256 public constant FIRST_STEPS = 1;
    uint256 public constant COLLECTOR = 2; // Own 5
    uint256 public constant HOARDER = 3;   // Own 25
    uint256 public constant MASTER_COLLECTOR = 4; // Own 100

    // Progression
    uint256 public constant ROOKIE = 5;    // Lvl 10
    uint256 public constant VETERAN = 6;   // Lvl 25
    uint256 public constant ELITE = 7;     // Lvl 50
    uint256 public constant LEGENDARY = 8; // Lvl 75
    uint256 public constant MAX_POWER = 9; // Lvl 100

    // Breeding
    uint256 public constant BREEDER = 10;
    uint256 public constant GENETICS_EXPERT = 11; // 10 offspring (tracked via progress)
    uint256 public constant BLOODLINE_MASTER = 12; // Gen 5
    uint256 public constant FUSION_PIONEER = 13;
    uint256 public constant PERFECT_SPECIMEN = 14; // All stats 90+

    // Staking
    uint256 public constant HODLER = 15; // 7 days
    uint256 public constant COMMITTED = 16; // 30 days
    uint256 public constant WHALE = 17; // 10 staked
    uint256 public constant DIAMOND_HANDS = 18; // 180 days

    // Mapping to track authorized callers (Game contracts)
    mapping(address => bool) public authorizedCallers;

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Unauthorized");
        _;
    }

    constructor(address _tracker, address _character, address _staking) Ownable(msg.sender) {
        tracker = IAchievementTracker(_tracker);
        character = IGameCharacter(_character);
        staking = ICharacterStaking(_staking);
    }

    function setAuthorizedCaller(address _caller, bool _status) external onlyOwner {
        authorizedCallers[_caller] = _status;
    }

    // --- Trigger Logic ---

    function checkMintAchievements(address player, uint256 tokenId) external onlyAuthorized {
        // First Steps
        tracker.unlockAchievement(player, FIRST_STEPS, tokenId);

        // Collection Checks
        uint256 balance = character.balanceOf(player);
        if (balance >= 5) tracker.unlockAchievement(player, COLLECTOR, tokenId);
        if (balance >= 25) tracker.unlockAchievement(player, HOARDER, tokenId);
        if (balance >= 100) tracker.unlockAchievement(player, MASTER_COLLECTOR, tokenId);
    }

    function checkLevelAchievements(address player, uint256 tokenId, uint256 level) external onlyAuthorized {
        if (level >= 10) tracker.unlockAchievement(player, ROOKIE, tokenId);
        if (level >= 25) tracker.unlockAchievement(player, VETERAN, tokenId);
        if (level >= 50) tracker.unlockAchievement(player, ELITE, tokenId);
        if (level >= 75) tracker.unlockAchievement(player, LEGENDARY, tokenId);
        if (level >= 100) tracker.unlockAchievement(player, MAX_POWER, tokenId);
    }

    function checkBreedingAchievements(address player, uint256 offspringId, uint256 gen, uint256 s, uint256 a, uint256 i) external onlyAuthorized {
        tracker.unlockAchievement(player, BREEDER, offspringId);
        
        // Genetics Expert (Breed 10) - Increment progress by 10% per breed
        uint256 current = tracker.getAchievementProgress(player, GENETICS_EXPERT);
        if (current < 100) {
            tracker.updateProgress(player, GENETICS_EXPERT, current + 10, offspringId);
        }

        // Bloodline Master
        if (gen >= 5) tracker.unlockAchievement(player, BLOODLINE_MASTER, offspringId);

        // Perfect Specimen
        if (s >= 90 && a >= 90 && i >= 90) {
            tracker.unlockAchievement(player, PERFECT_SPECIMEN, offspringId);
        }
    }

    function checkFusionAchievements(address player, uint256 fusedTokenId) external onlyAuthorized {
        tracker.unlockAchievement(player, FUSION_PIONEER, fusedTokenId);
    }

    function checkStakingAchievements(address player) external onlyAuthorized {
        ICharacterStaking.StakeInfo[] memory stakes = staking.getUserStakes(player);
        
        // Whale
        if (stakes.length >= 10) {
            tracker.unlockAchievement(player, WHALE, 0);
        }

        // Time-based checks
        for (uint256 k = 0; k < stakes.length; k++) {
            uint256 duration = block.timestamp - stakes[k].stakedAt;
            if (duration >= 7 days) tracker.unlockAchievement(player, HODLER, stakes[k].tokenId);
            if (duration >= 30 days) tracker.unlockAchievement(player, COMMITTED, stakes[k].tokenId);
            if (duration >= 180 days) tracker.unlockAchievement(player, DIAMOND_HANDS, stakes[k].tokenId);
        }
    }
}
