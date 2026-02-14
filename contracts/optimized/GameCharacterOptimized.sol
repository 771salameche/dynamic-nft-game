// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface ICharacterStaking {
    function tokenOwner(uint256 tokenId) external view returns (address);
}

interface IAchievementTrigger {
    function checkMintAchievements(address player, uint256 tokenId) external;
    function checkLevelAchievements(address player, uint256 tokenId, uint256 level) external;
}

/**
 * @title GameCharacterOptimized
 * @dev Optimized version of GameCharacter with gas-saving techniques.
 */
/// @custom:oz-upgrades-unsafe-allow constructor
/// @custom:oz-upgrades-unsafe-allow state-variable-immutable
contract GameCharacterOptimized is ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, VRFConsumerBaseV2, AutomationCompatible {
    
    /*///////////////////////////////////////////////////////////////
                            CUSTOM ERRORS
    ///////////////////////////////////////////////////////////////*/
    error InvalidCharacterClass(string characterClass);
    error UnauthorizedCaller(address caller);
    error CharacterDoesNotExist(uint256 tokenId);
    error MaxLevelReached(uint256 tokenId, uint8 maxLevel);
    error NotCharacterOwner(uint256 tokenId, address caller);

    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct GeneticMarkers {
        uint8 hiddenStrength;
        uint8 hiddenAgility;
        uint8 hiddenIntelligence;
        bool strengthDominant;
        bool agilityDominant;
        bool intelligenceDominant;
    }

    struct CharacterTraits {
        uint16 experience;     // 2 bytes
        uint32 lastTrainedAt;  // 4 bytes
        uint8 level;           // 1 byte
        uint8 strength;        // 1 byte
        uint8 agility;         // 1 byte
        uint8 intelligence;    // 1 byte
        uint8 generation;      // 1 byte
        uint8 mutationCount;   // 1 byte
        uint8 breedCount;      // 1 byte
        bool isFused;          // 1 byte
        string characterClass; // separate slot
    }

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/
    event CharacterMinted(uint256 indexed tokenId, address indexed owner, string characterClass);
    event TraitsUpdated(uint256 indexed tokenId, uint256 level, uint256 strength, uint256 agility, uint256 intelligence, uint256 experience);
    event LevelUp(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);
    event ExperienceGained(uint256 indexed tokenId, uint16 amount, uint256 newTotalExperience);
    event MintRequested(uint256 indexed requestId, uint256 indexed tokenId);
    event TraitsRevealed(uint256 indexed tokenId, uint256[3] traits);
    event UpkeepPerformed(uint256 timestamp);
    event PassiveXPGranted(uint256 indexed tokenId, uint256 amount);

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/
    uint256 private _tokenIds;
    uint8 private constant _MAX_LEVEL = 100;

    mapping(uint256 => CharacterTraits) private _characterTraits;
    mapping(uint256 => GeneticMarkers) private _genetics;
    mapping(uint256 => uint256[2]) private _parents;
    mapping(address => bool) private _authorizedAddresses;

    VRFCoordinatorV2Interface public COORDINATOR;
    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;

    mapping(uint256 => uint256) public requestToTokenId;
    mapping(uint256 => address) public requestToMinter;

    uint256 public lastUpdateTimestamp;
    uint256 public updateInterval;
    uint256 public passiveXPAmount;
    mapping(uint256 => bool) public isAutoXPEnabled;
    ICharacterStaking public stakingContract;
    IAchievementTrigger public achievementTrigger;

    /*///////////////////////////////////////////////////////////////
                            MODIFIERS
    ///////////////////////////////////////////////////////////////*/
    modifier onlyAuthorized() {
        if (!_authorizedAddresses[msg.sender] && owner() != msg.sender) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    /*///////////////////////////////////////////////////////////////
                            INITIALIZER
    ///////////////////////////////////////////////////////////////*/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address vrfCoordinator) VRFConsumerBaseV2(vrfCoordinator) {
        _disableInitializers();
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 _keyHash
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = 2000000;
        requestConfirmations = 3;
        numWords = 3;

        updateInterval = 1 days;
        passiveXPAmount = 5;
        lastUpdateTimestamp = block.timestamp;
        
        _tokenIds = 1;
    }

    /*///////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function mintCharacter(string calldata characterClass) external onlyOwner nonReentrant returns (uint256) {
        if (!_isValidCharacterClass(characterClass)) revert InvalidCharacterClass(characterClass);

        uint256 newTokenId = _tokenIds;
        unchecked { _tokenIds = newTokenId + 1; }

        _safeMint(msg.sender, newTokenId);

        _characterTraits[newTokenId] = CharacterTraits({
            level: 1,
            strength: 10,
            agility: 10,
            intelligence: 10,
            experience: 0,
            lastTrainedAt: uint32(block.timestamp),
            generation: 1,
            characterClass: characterClass,
            mutationCount: 0,
            breedCount: 0,
            isFused: false
        });

        uint256 requestId = COORDINATOR.requestRandomWords(keyHash, s_subscriptionId, requestConfirmations, callbackGasLimit, numWords);
        requestToTokenId[requestId] = newTokenId;
        requestToMinter[requestId] = msg.sender;

        emit MintRequested(requestId, newTokenId);
        emit CharacterMinted(newTokenId, msg.sender, characterClass);

        if (address(achievementTrigger) != address(0)) {
            achievementTrigger.checkMintAchievements(msg.sender, newTokenId);
        }

        return newTokenId;
    }

    function batchMint(string calldata characterClass, uint256 count) external onlyOwner {
        if (!_isValidCharacterClass(characterClass)) revert InvalidCharacterClass(characterClass);
        uint256 currentId = _tokenIds;
        
        for (uint256 i = 0; i < count; ) {
            uint256 tokenId = currentId + i;
            _safeMint(msg.sender, tokenId);
            
            _characterTraits[tokenId] = CharacterTraits({
                level: 1,
                strength: 10,
                agility: 10,
                intelligence: 10,
                experience: 0,
                lastTrainedAt: uint32(block.timestamp),
                generation: 1,
                characterClass: characterClass,
                mutationCount: 0,
                breedCount: 0,
                isFused: false
            });
            
            emit CharacterMinted(tokenId, msg.sender, characterClass);
            unchecked { ++i; }
        }
        unchecked { _tokenIds = currentId + count; }
    }

    function gainExperience(uint256 tokenId, uint16 xpAmount) external onlyAuthorized {
        if (!_exists(tokenId)) revert CharacterDoesNotExist(tokenId);
        CharacterTraits storage traits = _characterTraits[tokenId];
        if (traits.level >= _MAX_LEVEL) revert MaxLevelReached(tokenId, _MAX_LEVEL);

        uint256 amount = xpAmount;
        if (traits.isFused) {
            unchecked { amount = (amount * 150) / 100; }
        }

        unchecked { traits.experience += uint16(amount); }
        emit ExperienceGained(tokenId, uint16(amount), traits.experience);

        _checkLevelUp(tokenId);
    }

    function _checkLevelUp(uint256 tokenId) internal {
        CharacterTraits storage traits = _characterTraits[tokenId];
        uint8 oldLevel = traits.level;

        while (traits.level < _MAX_LEVEL) {
            uint256 requiredXP;
            unchecked { requiredXP = uint256(traits.level) * 100; }

            if (traits.experience >= requiredXP) {
                unchecked {
                    traits.experience -= uint16(requiredXP);
                    traits.level++;
                    traits.strength += 2;
                    traits.agility += 2;
                    traits.intelligence += 2;
                }
                emit LevelUp(tokenId, oldLevel, traits.level);
                if (address(achievementTrigger) != address(0)) {
                    achievementTrigger.checkLevelAchievements(ownerOf(tokenId), tokenId, traits.level);
                }
                oldLevel = traits.level;
            } else {
                break;
            }
        }
        
        emit TraitsUpdated(tokenId, traits.level, traits.strength, traits.agility, traits.intelligence, traits.experience);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tokenId = requestToTokenId[requestId];
        if (!_exists(tokenId)) revert CharacterDoesNotExist(tokenId);

        CharacterTraits storage traits = _characterTraits[tokenId];
        unchecked {
            traits.strength = uint8((randomWords[0] % 51) + 50);
            traits.agility = uint8((randomWords[1] % 51) + 50);
            traits.intelligence = uint8((randomWords[2] % 51) + 50);
        }

        emit TraitsRevealed(tokenId, [uint256(traits.strength), traits.agility, traits.intelligence]);
        emit TraitsUpdated(tokenId, traits.level, traits.strength, traits.agility, traits.intelligence, traits.experience);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/
    function getCharacterTraits(uint256 tokenId) external view returns (CharacterTraits memory) {
        if (!_exists(tokenId)) revert CharacterDoesNotExist(tokenId);
        return _characterTraits[tokenId];
    }

    function getCharacterPower(uint256 tokenId) external view returns (uint256) {
        if (!_exists(tokenId)) revert CharacterDoesNotExist(tokenId);
        CharacterTraits storage traits = _characterTraits[tokenId];
        unchecked {
            return (uint256(traits.strength) + traits.agility + traits.intelligence) * traits.level;
        }
    }

    function _isValidCharacterClass(string memory characterClass) internal pure returns (bool) {
        bytes32 classHash = keccak256(bytes(characterClass));
        return (
            classHash == keccak256(bytes("Warrior")) ||
            classHash == keccak256(bytes("Mage")) ||
            classHash == keccak256(bytes("Rogue"))
        );
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastUpdateTimestamp) >= updateInterval;
        performData = "";
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpdateTimestamp) < updateInterval) return;
        lastUpdateTimestamp = block.timestamp;
        _distributePassiveXP();
        emit UpkeepPerformed(block.timestamp);
    }

    function _distributePassiveXP() internal {
        uint256 lastTokenId;
        unchecked { lastTokenId = _tokenIds - 1; }
        for (uint256 i = 1; i <= lastTokenId; ) {
            if (_exists(i) && isAutoXPEnabled[i] && _isStaked(i)) {
                CharacterTraits storage traits = _characterTraits[i];
                if (traits.level < _MAX_LEVEL) {
                    uint256 amount;
                    unchecked { amount = passiveXPAmount + (traits.level / 10); }
                    traits.experience += uint16(amount);
                    emit PassiveXPGranted(i, amount);
                    _checkLevelUp(i);
                }
            }
            unchecked { ++i; }
        }
    }

    function _isStaked(uint256 tokenId) internal view returns (bool) {
        if (address(stakingContract) == address(0)) return false;
        return stakingContract.tokenOwner(tokenId) != address(0);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Admin setters...
    function addAuthorizedAddress(address authAddress) external onlyOwner { _authorizedAddresses[authAddress] = true; }
    function setAchievementTrigger(address _trigger) external onlyOwner { achievementTrigger = IAchievementTrigger(_trigger); }
    function setStakingContract(address _stakingContract) external onlyOwner { stakingContract = ICharacterStaking(_stakingContract); }
}
