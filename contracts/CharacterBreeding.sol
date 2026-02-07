// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

interface IGameCharacter {
    struct GeneticMarkers {
        bool strengthDominant;
        bool agilityDominant;
        bool intelligenceDominant;
        uint8 hiddenStrength;
        uint8 hiddenAgility;
        uint8 hiddenIntelligence;
    }

    struct CharacterTraits {
        uint256 level;
        uint256 strength;
        uint256 agility;
        uint256 intelligence;
        uint256 experience;
        uint40 lastTrainedAt;
        uint256 generation;
        string characterClass;
        GeneticMarkers genetics;
        uint8 mutationCount;
        uint8 breedCount;
    }
    function getCharacterTraits(uint256 tokenId) external view returns (CharacterTraits memory);
    function mintOffspring(address to, string memory characterClass, uint256 generation, uint256 strength, uint256 agility, uint256 intelligence, uint256 parent1, uint256 parent2, GeneticMarkers memory genetics, uint8 mutationCount, uint256 startingLevel) external returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function getParents(uint256 tokenId) external view returns (uint256[2] memory);
}

/**
 * @title CharacterBreeding
 * @dev Genetic breeding system for GameCharacters using Chainlink VRF.
 */
contract CharacterBreeding is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct BreedingPair {
        uint256 parent1;
        uint256 parent2;
        uint256 offspring;
        uint256 timestamp;
    }

    struct PendingBreed {
        address breeder;
        uint256 parent1Id;
        uint256 parent2Id;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    VRFCoordinatorV2Interface public COORDINATOR;
    IGameCharacter public gameCharacter;
    IERC20 public gameToken;

    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 10; // Increased random words for advanced genetics

    uint256 public breedingCost = 100 * 10**18;
    uint256 public baseCooldown = 7 days;
    uint8 public maxGeneration = 10;
    uint8 public maxBreedCount = 5;

    mapping(uint256 => uint256) public lastBredAt;
    mapping(uint256 => BreedingPair[]) public breedingHistory;
    mapping(uint256 => PendingBreed) public pendingBreeds;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event BreedingRequested(uint256 indexed requestId, address indexed breeder, uint256 parent1, uint256 parent2);
    event CharacterBred(uint256 indexed parent1, uint256 indexed parent2, uint256 offspring, uint256 generation);

    /*///////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    ///////////////////////////////////////////////////////////////*/

    constructor(
        address vrfCoordinator,
        address _gameCharacter,
        address _gameToken,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        gameCharacter = IGameCharacter(_gameCharacter);
        gameToken = IERC20(_gameToken);
        s_subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    /*///////////////////////////////////////////////////////////////
                            BREEDING LOGIC
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Initiates breeding between two owned characters.
     */
    function breed(uint256 parent1Id, uint256 parent2Id) external nonReentrant returns (uint256) {
        require(parent1Id != parent2Id, "Cannot breed with self");
        require(gameCharacter.ownerOf(parent1Id) == msg.sender, "Not owner of parent 1");
        require(gameCharacter.ownerOf(parent2Id) == msg.sender, "Not owner of parent 2");
        require(canBreed(parent1Id), "Parent 1 cannot breed");
        require(canBreed(parent2Id), "Parent 2 cannot breed");
        require(!_isSibling(parent1Id, parent2Id), "Cannot breed siblings");

        // Burn GAME tokens
        require(gameToken.transferFrom(msg.sender, address(this), breedingCost), "Token transfer failed");
        
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        pendingBreeds[requestId] = PendingBreed({
            breeder: msg.sender,
            parent1Id: parent1Id,
            parent2Id: parent2Id
        });

        lastBredAt[parent1Id] = block.timestamp;
        lastBredAt[parent2Id] = block.timestamp;

        emit BreedingRequested(requestId, msg.sender, parent1Id, parent2Id);
        return requestId;
    }

    /**
     * @dev VRF callback to finalize breeding.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        PendingBreed memory pending = pendingBreeds[requestId];
        require(pending.breeder != address(0), "Breed not found");

        IGameCharacter.CharacterTraits memory p1 = gameCharacter.getCharacterTraits(pending.parent1Id);
        IGameCharacter.CharacterTraits memory p2 = gameCharacter.getCharacterTraits(pending.parent2Id);

        uint256 offspringGen = (p1.generation > p2.generation ? p1.generation : p2.generation) + 1;
        uint256 startingLevel = 1;

        // Special Bonus: High level parents
        if (p1.level >= 50 && p2.level >= 50) {
            startingLevel = 5;
        }

        // Inherit class
        string memory offspringClass = p1.level >= p2.level ? p1.characterClass : p2.characterClass;

        // Calculate Genetics
        IGameCharacter.GeneticMarkers memory offspringGenetics;
        offspringGenetics.strengthDominant = (randomWords[0] % 100) < 75 ? p1.genetics.strengthDominant : p2.genetics.strengthDominant;
        offspringGenetics.agilityDominant = (randomWords[1] % 100) < 75 ? p1.genetics.agilityDominant : p2.genetics.agilityDominant;
        offspringGenetics.intelligenceDominant = (randomWords[2] % 100) < 75 ? p1.genetics.intelligenceDominant : p2.genetics.intelligenceDominant;
        
        // Calculate Stats
        uint256 strength = _calculateStat(p1.strength, p2.strength, randomWords[3]);
        uint256 agility = _calculateStat(p1.agility, p2.agility, randomWords[4]);
        uint256 intelligence = _calculateStat(p1.intelligence, p2.intelligence, randomWords[5]);

        // Mutation System
        uint8 mutationCount = 0;
        (strength, mutationCount) = _applyMutation(strength, randomWords[6], mutationCount);
        (agility, mutationCount) = _applyMutation(agility, randomWords[7], mutationCount);
        (intelligence, mutationCount) = _applyMutation(intelligence, randomWords[8], mutationCount);

        // Same Class Bonus
        if (keccak256(abi.encodePacked(p1.characterClass)) == keccak256(abi.encodePacked(p2.characterClass))) {
            if (keccak256(abi.encodePacked(offspringClass)) == keccak256(abi.encodePacked("Warrior"))) strength += 5;
            else if (keccak256(abi.encodePacked(offspringClass)) == keccak256(abi.encodePacked("Rogue"))) agility += 5;
            else intelligence += 5;
        }

        // Max Stat Guarantee
        if (p1.strength >= 100 && p2.strength >= 100 && strength < 90) strength = 90;
        if (p1.agility >= 100 && p2.agility >= 100 && agility < 90) agility = 90;
        if (p1.intelligence >= 100 && p2.intelligence >= 100 && intelligence < 90) intelligence = 90;

        uint256 offspringId = gameCharacter.mintOffspring(
            pending.breeder,
            offspringClass,
            offspringGen,
            strength,
            agility,
            intelligence,
            pending.parent1Id,
            pending.parent2Id,
            offspringGenetics,
            mutationCount,
            startingLevel
        );

        BreedingPair memory pair = BreedingPair({
            parent1: pending.parent1Id,
            parent2: pending.parent2Id,
            offspring: offspringId,
            timestamp: block.timestamp
        });

        breedingHistory[pending.parent1Id].push(pair);
        breedingHistory[pending.parent2Id].push(pair);
        breedingHistory[offspringId].push(pair);

        delete pendingBreeds[requestId];

        emit CharacterBred(pending.parent1Id, pending.parent2Id, offspringId, offspringGen);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function canBreed(uint256 tokenId) public view returns (bool) {
        IGameCharacter.CharacterTraits memory traits = gameCharacter.getCharacterTraits(tokenId);
        uint256 cooldown = baseCooldown + ((baseCooldown * 10 * traits.breedCount) / 100);
        
        return (
            block.timestamp >= lastBredAt[tokenId] + cooldown &&
            traits.generation < maxGeneration &&
            traits.breedCount < maxBreedCount
        );
    }

    function getBreedingHistory(uint256 tokenId) external view returns (BreedingPair[] memory) {
        return breedingHistory[tokenId];
    }

    function _isSibling(uint256 p1, uint256 p2) internal view returns (bool) {
        uint256[2] memory parents1 = gameCharacter.getParents(p1);
        uint256[2] memory parents2 = gameCharacter.getParents(p2);

        if (parents1[0] == 0 || parents2[0] == 0) return false;

        return (
            (parents1[0] == parents2[0] && parents1[1] == parents2[1]) ||
            (parents1[0] == parents2[1] && parents1[1] == parents2[0])
        );
    }

    function _calculateStat(uint256 s1, uint256 s2, uint256 random) internal pure returns (uint256) {
        // Weighted average: (p1 * 0.4) + (p2 * 0.4) + random(0, 20)
        uint256 base = (s1 * 40 / 100) + (s2 * 40 / 100);
        uint256 variance = random % 21;
        return base + variance;
    }

    function _applyMutation(uint256 stat, uint256 random, uint8 count) internal pure returns (uint256, uint8) {
        uint256 roll = random % 1000; // 0-999
        if (roll < 50) { // 5% Positive
            return (stat + 10, count + 1);
        } else if (roll < 70) { // 2% Negative
            return (stat > 5 ? stat - 5 : 0, count);
        } else if (roll == 999) { // 0.1% Legendary
            return (stat + 20, count + 1);
        }
        return (stat, count);
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function setBreedingCost(uint256 newCost) external onlyOwner {
        breedingCost = newCost;
    }

    function setBaseCooldown(uint256 newCooldown) external onlyOwner {
        baseCooldown = newCooldown;
    }

    function setMaxGeneration(uint8 newMax) external onlyOwner {
        maxGeneration = newMax;
    }

    function setVRFConfig(uint64 _subId, bytes32 _keyHash, uint32 _gasLimit) external onlyOwner {
        s_subscriptionId = _subId;
        keyHash = _keyHash;
        callbackGasLimit = _gasLimit;
    }
}
