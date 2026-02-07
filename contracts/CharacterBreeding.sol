// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

interface IAchievementTrigger {
    function checkBreedingAchievements(address player, uint256 offspringId, uint256 gen, uint256 s, uint256 a, uint256 i) external;
    function checkFusionAchievements(address player, uint256 fusedTokenId) external;
}

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
        bool isFused;
    }
    function getCharacterTraits(uint256 tokenId) external view returns (CharacterTraits memory);
    function mintOffspring(address to, string memory characterClass, uint256 generation, uint256 strength, uint256 agility, uint256 intelligence, uint256 parent1, uint256 parent2, GeneticMarkers memory genetics, uint8 mutationCount, uint256 startingLevel, bool isFused) external returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function getParents(uint256 tokenId) external view returns (uint256[2] memory);
    function burn(uint256 tokenId) external;
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

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    VRFCoordinatorV2Interface public COORDINATOR;
    IGameCharacter public gameCharacter;
    IERC20 public gameToken;
    IAchievementTrigger public achievementTrigger;

    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 1000000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 10;

    uint256 public breedingCost = 100 * 10**18;
    uint256 public fusionCost = 500 * 10**18;
    uint256 public baseCooldown = 7 days;
    uint8 public maxGeneration = 10;
    uint8 public maxBreedCount = 5;

    mapping(uint256 => uint256) public lastBredAt;
    mapping(uint256 => BreedingPair[]) public breedingHistory;
    
    mapping(uint256 => address) public requestToBreeder;
    mapping(uint256 => uint256) public requestToParent1;
    mapping(uint256 => uint256) public requestToParent2;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event BreedingRequested(uint256 indexed requestId, address indexed breeder, uint256 parent1, uint256 parent2);
    event CharacterBred(uint256 indexed parent1, uint256 indexed parent2, uint256 offspring, uint256 generation);
    event CharactersFused(uint256 indexed token1, uint256 indexed token2, uint256 fusedToken, uint256 totalStats);

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

    function breed(uint256 parent1Id, uint256 parent2Id) external nonReentrant returns (uint256) {
        require(parent1Id != parent2Id, "Cannot breed with self");
        require(gameCharacter.ownerOf(parent1Id) == msg.sender, "Not owner of parent 1");
        require(gameCharacter.ownerOf(parent2Id) == msg.sender, "Not owner of parent 2");
        require(canBreed(parent1Id), "Parent 1 cannot breed");
        require(canBreed(parent2Id), "Parent 2 cannot breed");
        require(!_isSibling(parent1Id, parent2Id), "Cannot breed siblings");

        require(gameToken.transferFrom(msg.sender, address(this), breedingCost), "Token transfer failed");
        
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestToBreeder[requestId] = msg.sender;
        requestToParent1[requestId] = parent1Id;
        requestToParent2[requestId] = parent2Id;

        lastBredAt[parent1Id] = block.timestamp;
        lastBredAt[parent2Id] = block.timestamp;

        emit BreedingRequested(requestId, msg.sender, parent1Id, parent2Id);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address breeder = requestToBreeder[requestId];
        require(breeder != address(0), "Breed not found");

        uint256 p1Id = requestToParent1[requestId];
        uint256 p2Id = requestToParent2[requestId];

        IGameCharacter.CharacterTraits memory p1 = gameCharacter.getCharacterTraits(p1Id);
        IGameCharacter.CharacterTraits memory p2 = gameCharacter.getCharacterTraits(p2Id);

        uint256 offspringGen = (p1.generation > p2.generation ? p1.generation : p2.generation) + 1;
        uint256 startingLevel = (p1.level >= 50 && p2.level >= 50) ? 5 : 1;
        string memory offspringClass = p1.level >= p2.level ? p1.characterClass : p2.characterClass;

        IGameCharacter.GeneticMarkers memory offspringGenetics;
        offspringGenetics.strengthDominant = (randomWords[0] % 100) < 75 ? p1.genetics.strengthDominant : p2.genetics.strengthDominant;
        offspringGenetics.agilityDominant = (randomWords[1] % 100) < 75 ? p1.genetics.agilityDominant : p2.genetics.agilityDominant;
        offspringGenetics.intelligenceDominant = (randomWords[2] % 100) < 75 ? p1.genetics.intelligenceDominant : p2.genetics.intelligenceDominant;
        
        uint256 strength = _calculateStat(p1.strength, p2.strength, randomWords[3]);
        uint256 agility = _calculateStat(p1.agility, p2.agility, randomWords[4]);
        uint256 intelligence = _calculateStat(p1.intelligence, p2.intelligence, randomWords[5]);

        uint8 mutationCount = 0;
        (strength, mutationCount) = _applyMutation(strength, randomWords[6], mutationCount);
        (agility, mutationCount) = _applyMutation(agility, randomWords[7], mutationCount);
        (intelligence, mutationCount) = _applyMutation(intelligence, randomWords[8], mutationCount);

        if (keccak256(abi.encodePacked(p1.characterClass)) == keccak256(abi.encodePacked(p2.characterClass))) {
            if (keccak256(abi.encodePacked(offspringClass)) == keccak256(abi.encodePacked("Warrior"))) strength += 5;
            else if (keccak256(abi.encodePacked(offspringClass)) == keccak256(abi.encodePacked("Rogue"))) agility += 5;
            else intelligence += 5;
        }

        if (p1.strength >= 100 && p2.strength >= 100 && strength < 90) strength = 90;
        if (p1.agility >= 100 && p2.agility >= 100 && agility < 90) agility = 90;
        if (p1.intelligence >= 100 && p2.intelligence >= 100 && intelligence < 90) intelligence = 90;

        uint256 offspringId = gameCharacter.mintOffspring(
            breeder, offspringClass, offspringGen, strength, agility, intelligence, p1Id, p2Id,
            offspringGenetics, mutationCount, startingLevel, false
        );

        BreedingPair memory pair = BreedingPair(p1Id, p2Id, offspringId, block.timestamp);
        breedingHistory[p1Id].push(pair);
        breedingHistory[p2Id].push(pair);
        breedingHistory[offspringId].push(pair);

        delete requestToBreeder[requestId];
        delete requestToParent1[requestId];
        delete requestToParent2[requestId];

        emit CharacterBred(p1Id, p2Id, offspringId, offspringGen);
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
        uint256 base = (s1 * 40 / 100) + (s2 * 40 / 100);
        return base + (random % 21);
    }

    function _applyMutation(uint256 stat, uint256 random, uint8 count) internal pure returns (uint256, uint8) {
        uint256 roll = random % 1000;
        if (roll < 50) return (stat + 10, count + 1);
        if (roll < 70) return (stat > 5 ? stat - 5 : 0, count);
        if (roll == 999) return (stat + 20, count + 1);
        return (stat, count);
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function setBreedingCost(uint256 newCost) external onlyOwner { breedingCost = newCost; }
    function setBaseCooldown(uint256 newCooldown) external onlyOwner { baseCooldown = newCooldown; }
    function setMaxGeneration(uint8 newMax) external onlyOwner { maxGeneration = newMax; }
    function setVRFConfig(uint64 _subId, bytes32 _keyHash, uint32 _gasLimit) external onlyOwner {
        s_subscriptionId = _subId;
        keyHash = _keyHash;
        callbackGasLimit = _gasLimit;
    }

    function setAchievementTrigger(address _trigger) external onlyOwner {
        achievementTrigger = IAchievementTrigger(_trigger);
    }

    /*///////////////////////////////////////////////////////////////
                            FUSION LOGIC
    ///////////////////////////////////////////////////////////////*/

    function fuse(uint256 token1, uint256 token2) external nonReentrant returns (uint256) {
        (bool possible, string memory reason) = canFuse(token1, token2);
        require(possible, reason);

        IGameCharacter.CharacterTraits memory t1 = gameCharacter.getCharacterTraits(token1);
        IGameCharacter.CharacterTraits memory t2 = gameCharacter.getCharacterTraits(token2);

        uint256 totalStats = t1.strength + t1.agility + t1.intelligence + t2.strength + t2.agility + t2.intelligence;
        uint256 cost = fusionCost;
        if (totalStats > 600) cost *= 3;
        else if (totalStats > 500) cost *= 2;

        require(gameToken.transferFrom(msg.sender, address(this), cost), "Token transfer failed");

        uint256 strength = _calculateFusedStat(t1.strength, t2.strength);
        uint256 agility = _calculateFusedStat(t1.agility, t2.agility);
        uint256 intelligence = _calculateFusedStat(t1.intelligence, t2.intelligence);
        uint256 gen = (t1.generation > t2.generation ? t1.generation : t2.generation) + 1;

        gameCharacter.burn(token1);
        gameCharacter.burn(token2);

        uint256 fusedTokenId = gameCharacter.mintOffspring(
            msg.sender, "Fused", gen, strength, agility, intelligence, token1, token2,
            IGameCharacter.GeneticMarkers(false, false, false, 0, 0, 0), 0, 1, true
        );

        if (address(achievementTrigger) != address(0)) {
            achievementTrigger.checkFusionAchievements(msg.sender, fusedTokenId);
        }

        emit CharactersFused(token1, token2, fusedTokenId, totalStats);
        return fusedTokenId;
    }

    function canFuse(uint256 token1, uint256 token2) public view returns (bool, string memory) {
        if (token1 == token2) return (false, "Same token");
        if (gameCharacter.ownerOf(token1) != msg.sender || gameCharacter.ownerOf(token2) != msg.sender) 
            return (false, "Not owner");
        IGameCharacter.CharacterTraits memory t1 = gameCharacter.getCharacterTraits(token1);
        IGameCharacter.CharacterTraits memory t2 = gameCharacter.getCharacterTraits(token2);
        if (t1.isFused || t2.isFused) return (false, "Cannot fuse fused");
        if (t1.level < 50 || t2.level < 50) return (false, "Lvl 50 required");
        return (true, "");
    }

    function _calculateFusedStat(uint256 s1, uint256 s2) internal pure returns (uint256) {
        uint256 stat = ((s1 + s2) * 120) / 100;
        return stat > 150 ? 150 : stat;
    }
}
