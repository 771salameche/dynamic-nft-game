// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol"; // Import SafeMathUpgradeable
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface ICharacterStaking {
    function tokenOwner(uint256 tokenId) external view returns (address);
}

/// @title GameCharacter
/// @dev An ERC721Upgradeable contract for game characters with dynamic traits.
contract GameCharacter is ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, VRFConsumerBaseV2, AutomationCompatible {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256; // Enable SafeMath for uint256
    using SafeMathUpgradeable for uint8;   // Enable SafeMath for uint8 if needed (e.g., for level calculations)

    /*///////////////////////////////////////////////////////////////
                            CONSTANTS
    ///////////////////////////////////////////////////////////////*/

    /// @dev The maximum level a character can reach.
    uint8 private constant _MAX_LEVEL = 100;

    /*///////////////////////////////////////////////////////////////
                            CUSTOM ERRORS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Thrown when an invalid character class is provided during minting.
    error InvalidCharacterClass(string characterClass);

    /// @dev Thrown when the caller is not the owner of the character.
    error NotCharacterOwner(uint256 tokenId, address caller); // This error is currently not used but kept for consistency

    /// @dev Thrown when a character's level cannot be increased due to insufficient experience or max level.
    error LevelUpFailed(uint256 tokenId, uint256 currentExp, uint256 requiredExp); // This error is currently not used

    /// @dev Thrown when the character has already reached the maximum level.
    error MaxLevelReached(uint256 tokenId, uint8 maxLevel);

    /// @dev Thrown when a non-authorized address attempts to call an authorized function.
    error UnauthorizedCaller(address caller);

    /// @dev Thrown when an operation is attempted on a non-existent character token.
    error CharacterDoesNotExist(uint256 tokenId);

    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Represents the various traits of a game character.
    struct CharacterTraits {
        uint256 level;
        uint256 strength;
        uint256 agility;
        uint256 intelligence;
        uint256 experience;
        uint40 lastTrainedAt; // Timestamp of the last training session
        uint256 generation; // e.g., 1 for initial characters, 2 for offspring
        string characterClass; // e.g., Warrior, Mage, Rogue
    }

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Emitted when a new character NFT is minted.
    /// @param tokenId The unique identifier of the minted character.
    /// @param owner The address that owns the new character.
    /// @param characterClass The class of the new character.
    event CharacterMinted(uint256 indexed tokenId, address indexed owner, string characterClass);

    /// @dev Emitted when a character's traits are updated.
    /// @param tokenId The unique identifier of the character whose traits were updated.
    /// @param newLevel The new level of the character.
    /// @param newStrength The new strength of the character.
    /// @param newAgility The new agility of the character.
    /// @param newIntelligence The new intelligence of the character.
    /// @param newExperience The new experience of the character.
    event TraitsUpdated(
        uint256 indexed tokenId,
        uint256 newLevel,
        uint256 newStrength,
        uint256 newAgility,
        uint256 newIntelligence,
        uint256 newExperience
    );

    /// @dev Emitted when a character levels up.
    /// @param tokenId The unique identifier of the character that leveled up.
    /// @param oldLevel The previous level of the character.
    /// @param newLevel The new level of the character.
    event LevelUp(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);

    /// @dev Emitted when a character gains experience.
    /// @param tokenId The unique identifier of the character that gained experience.
    /// @param amount The amount of experience gained.
    /// @param newTotalExperience The new total experience of the character.
    event ExperienceGained(uint256 indexed tokenId, uint16 amount, uint256 newTotalExperience);

    /// @dev Emitted when a VRF request is made for character traits.
    /// @param requestId The ID of the VRF request.
    /// @param tokenId The ID of the token being minted.
    event MintRequested(uint256 indexed requestId, uint256 indexed tokenId);

    /// @dev Emitted when traits are revealed via VRF.
    /// @param tokenId The ID of the token whose traits were revealed.
    /// @param traits An array containing [strength, agility, intelligence].
    event TraitsRevealed(uint256 indexed tokenId, uint256[3] traits);

    /// @dev Emitted when Chainlink Automation performs upkeep.
    event UpkeepPerformed(uint256 timestamp);

    /// @dev Emitted when passive XP is granted to a character.
    event PassiveXPGranted(uint256 indexed tokenId, uint256 amount);

    /// @dev Emitted when auto-XP is enabled for a character.
    event AutoXPEnabled(uint256 indexed tokenId);

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    CountersUpgradeable.Counter private _tokenIdCounter;

    /// @dev Mapping from token ID to CharacterTraits struct.
    mapping(uint256 => CharacterTraits) private _characterTraits;

    /// @dev Mapping from token ID to parents [parent1, parent2].
    mapping(uint256 => uint256[2]) private _parents;

    /// @dev Mapping to keep track of addresses authorized to perform game-specific actions.
    mapping(address => bool) private _authorizedAddresses;

    /*///////////////////////////////////////////////////////////////
                            VRF STORAGE
    ///////////////////////////////////////////////////////////////*/

    VRFCoordinatorV2Interface public COORDINATOR;
    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;

    /// @dev Mapping from VRF request ID to token ID.
    mapping(uint256 => uint256) public requestToTokenId;

    /// @dev Mapping from VRF request ID to minter address.
    mapping(uint256 => address) public requestToMinter;

    /*///////////////////////////////////////////////////////////////
                            AUTOMATION STORAGE
    ///////////////////////////////////////////////////////////////*/

    uint256 public lastUpdateTimestamp;
    uint256 public updateInterval;
    uint256 public passiveXPAmount;
    mapping(uint256 => bool) public isAutoXPEnabled;
    ICharacterStaking public stakingContract;

    /*///////////////////////////////////////////////////////////////
                            MODIFIERS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Modifier to restrict access to only the contract owner or an authorized address.
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

    /// @dev Initializes the contract.
    /// @param name_ The name of the NFT collection.
    /// @param symbol_ The symbol of the NFT collection.
    /// @param vrfCoordinator The address of the VRF coordinator.
    /// @param subscriptionId The subscription ID for VRF.
    /// @param _keyHash The key hash for VRF.
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
        callbackGasLimit = 200000;
        requestConfirmations = 3;
        numWords = 3;

        updateInterval = 1 days;
        passiveXPAmount = 5;
        lastUpdateTimestamp = block.timestamp;

        _tokenIdCounter.increment(); // Initialize counter to 1, first token will be 1
    }

    /*///////////////////////////////////////////////////////////////
                            ACCESS CONTROL
    ///////////////////////////////////////////////////////////////*/

    /// @dev Allows the owner to add an address to the list of authorized addresses.
    /// @param authAddress The address to authorize.
    function addAuthorizedAddress(address authAddress) public onlyOwner {
        _authorizedAddresses[authAddress] = true;
    }

    /// @dev Allows the owner to remove an address from the list of authorized addresses.
    /// @param authAddress The address to deauthorize.
    function removeAuthorizedAddress(address authAddress) public onlyOwner {
        _authorizedAddresses[authAddress] = false;
    }

    /// @dev Checks if an address is authorized.
    /// @param authAddress The address to check.
    /// @return True if the address is authorized, false otherwise.
    function isAuthorized(address authAddress) public view returns (bool) {
        return _authorizedAddresses[authAddress];
    }

    /*///////////////////////////////////////////////////////////////
                            MINTING
    ///////////////////////////////////////////////////////////////*/

    /// @dev Mints a new character NFT to the caller.
    ///      Only the contract owner can call this function.
    /// @param characterClass The class of the character to mint (e.g., "Warrior", "Mage", "Rogue").
    /// @return The tokenId of the newly minted character.
    function mintCharacter(string memory characterClass) public onlyOwner nonReentrant returns (uint256) {
        if (!_isValidCharacterClass(characterClass)) {
            revert InvalidCharacterClass(characterClass);
        }

        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, newTokenId);

        _characterTraits[newTokenId] = CharacterTraits({
            level: 1,
            strength: 10,
            agility: 10,
            intelligence: 10,
            experience: 0,
            lastTrainedAt: uint40(block.timestamp),
            generation: 1, // First generation characters
            characterClass: characterClass
        });

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestToTokenId[requestId] = newTokenId;
        requestToMinter[requestId] = msg.sender;

        emit MintRequested(requestId, newTokenId);
        emit CharacterMinted(newTokenId, msg.sender, characterClass);

        return newTokenId;
    }

    /// @dev Mints an offspring character. Only callable by authorized addresses (Breeding contract).
    function mintOffspring(
        address to,
        string memory characterClass,
        uint256 generation,
        uint256 strength,
        uint256 agility,
        uint256 intelligence,
        uint256 parent1,
        uint256 parent2
    ) external onlyAuthorized returns (uint256) {
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, newTokenId);

        _characterTraits[newTokenId] = CharacterTraits({
            level: 1,
            strength: strength,
            agility: agility,
            intelligence: intelligence,
            experience: 0,
            lastTrainedAt: uint40(block.timestamp),
            generation: generation,
            characterClass: characterClass
        });

        _parents[newTokenId] = [parent1, parent2];

        emit CharacterMinted(newTokenId, to, characterClass);
        emit TraitsUpdated(newTokenId, 1, strength, agility, intelligence, 0);

        return newTokenId;
    }

    /// @dev Returns the parents of a character.
    function getParents(uint256 tokenId) external view returns (uint256[2] memory) {
        if (!_exists(tokenId)) revert CharacterDoesNotExist(tokenId);
        return _parents[tokenId];
    }

    /*///////////////////////////////////////////////////////////////
                            GAME MECHANICS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Allows an authorized address or owner to add experience to a character.
    ///      Automatically triggers a level-up check.
    /// @param tokenId The unique identifier of the character to gain experience.
    /// @param xpAmount The amount of experience to add.
    function gainExperience(uint256 tokenId, uint16 xpAmount) public nonReentrant onlyAuthorized {
        if (!_exists(tokenId)) {
            revert CharacterDoesNotExist(tokenId);
        }
        if (_characterTraits[tokenId].level == _MAX_LEVEL) {
            revert MaxLevelReached(tokenId, _MAX_LEVEL);
        }

        _characterTraits[tokenId].experience = _characterTraits[tokenId].experience.add(xpAmount);
        emit ExperienceGained(tokenId, xpAmount, _characterTraits[tokenId].experience);

        _checkLevelUp(tokenId);
    }

    /// @dev Allows an authorized address to permanently boost a character's traits.
    /// @param tokenId The unique identifier of the character to boost.
    /// @param strengthBoost The amount of strength to add.
    /// @param agilityBoost The amount of agility to add.
    /// @param intelligenceBoost The amount of intelligence to add.
    function boostTraits(
        uint256 tokenId,
        uint16 strengthBoost,
        uint16 agilityBoost,
        uint16 intelligenceBoost
    ) external onlyAuthorized {
        if (!_exists(tokenId)) {
            revert CharacterDoesNotExist(tokenId);
        }

        _characterTraits[tokenId].strength = _characterTraits[tokenId].strength.add(strengthBoost);
        _characterTraits[tokenId].agility = _characterTraits[tokenId].agility.add(agilityBoost);
        _characterTraits[tokenId].intelligence = _characterTraits[tokenId].intelligence.add(intelligenceBoost);

        emit TraitsUpdated(
            tokenId,
            _characterTraits[tokenId].level,
            _characterTraits[tokenId].strength,
            _characterTraits[tokenId].agility,
            _characterTraits[tokenId].intelligence,
            _characterTraits[tokenId].experience
        );
    }

    /// @dev Internal function to check if a character has enough experience to level up.
    ///      If so, levels up the character, increases stats, and emits events.
    /// @param tokenId The unique identifier of the character to check for level up.
    function _checkLevelUp(uint256 tokenId) internal {
        uint8 oldLevel = uint8(_characterTraits[tokenId].level);
        uint256 newStrength = _characterTraits[tokenId].strength;
        uint256 newAgility = _characterTraits[tokenId].agility;
        uint256 newIntelligence = _characterTraits[tokenId].intelligence;
        uint256 newExperience = _characterTraits[tokenId].experience;

        while (_characterTraits[tokenId].level < _MAX_LEVEL) {
            uint256 requiredXP = calculateXPForLevel(uint8(_characterTraits[tokenId].level));

            if (_characterTraits[tokenId].experience >= requiredXP) {
                _characterTraits[tokenId].experience = _characterTraits[tokenId].experience.sub(requiredXP);
                _characterTraits[tokenId].level++;
                _characterTraits[tokenId].strength = _characterTraits[tokenId].strength.add(2);
                _characterTraits[tokenId].agility = _characterTraits[tokenId].agility.add(2);
                _characterTraits[tokenId].intelligence = _characterTraits[tokenId].intelligence.add(2);

                emit LevelUp(tokenId, oldLevel, _characterTraits[tokenId].level);

                // Update oldLevel to new current level for next iteration or final TraitsUpdated event
                oldLevel = uint8(_characterTraits[tokenId].level);
                newStrength = _characterTraits[tokenId].strength;
                newAgility = _characterTraits[tokenId].agility;
                newIntelligence = _characterTraits[tokenId].intelligence;
                newExperience = _characterTraits[tokenId].experience;
            } else {
                break; // Not enough XP for next level
            }
        }
        // Emit TraitsUpdated after all potential level-ups are processed
        emit TraitsUpdated(
            tokenId,
            _characterTraits[tokenId].level,
            _characterTraits[tokenId].strength,
            _characterTraits[tokenId].agility,
            _characterTraits[tokenId].intelligence,
            _characterTraits[tokenId].experience
        );
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Returns the traits of a specific character.
    /// @param tokenId The unique identifier of the character.
    /// @return A CharacterTraits struct containing the character's attributes.
    function getCharacterTraits(uint256 tokenId) public view returns (CharacterTraits memory) {
        if (!_exists(tokenId)) {
            revert CharacterDoesNotExist(tokenId);
        }
        return _characterTraits[tokenId];
    }

    /// @dev Calculates the experience points needed to reach a given level from the previous level.
    /// @param level The target level.
    /// @return The experience points required for that level.
    function calculateXPForLevel(uint8 level) public pure returns (uint256) {
        if (level == 0) return 0; // Level 0 technically needs 0 XP to reach Level 1
        return uint256(level).mul(100);
    }

    /// @dev Calculates the overall power score of a character.
    /// @param tokenId The unique identifier of the character.
    /// @return The calculated power score.
    function getCharacterPower(uint256 tokenId) public view returns (uint256) {
        if (!_exists(tokenId)) {
            revert CharacterDoesNotExist(tokenId);
        }
        CharacterTraits storage traits = _characterTraits[tokenId];
        return (traits.strength.add(traits.agility).add(traits.intelligence)).mul(traits.level);
    }

    /// @dev Returns the maximum level a character can reach.
    function getMaxLevel() public pure returns (uint8) {
        return _MAX_LEVEL;
    }

    /*///////////////////////////////////////////////////////////////
                            VRF CALLBACK
    ///////////////////////////////////////////////////////////////*/

    /// @dev Callback function used by VRF Coordinator.
    /// @param requestId The ID of the request being fulfilled.
    /// @param randomWords The random words generated by VRF.
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tokenId = requestToTokenId[requestId];
        if (!_exists(tokenId)) {
            revert CharacterDoesNotExist(tokenId);
        }

        // Use randomWords to set traits (range 50-100)
        uint256 strength = (randomWords[0] % 51) + 50;
        uint256 agility = (randomWords[1] % 51) + 50;
        uint256 intelligence = (randomWords[2] % 51) + 50;

        _characterTraits[tokenId].strength = strength;
        _characterTraits[tokenId].agility = agility;
        _characterTraits[tokenId].intelligence = intelligence;

        uint256[3] memory traits = [strength, agility, intelligence];
        emit TraitsRevealed(tokenId, traits);

        emit TraitsUpdated(
            tokenId,
            _characterTraits[tokenId].level,
            strength,
            agility,
            intelligence,
            _characterTraits[tokenId].experience
        );
    }

    /*///////////////////////////////////////////////////////////////
                            VRF CONFIGURATION
    ///////////////////////////////////////////////////////////////*/

    /// @dev Allows the owner to update VRF configuration.
    /// @param subscriptionId The new subscription ID.
    /// @param newKeyHash The new key hash.
    function setVRFConfig(uint64 subscriptionId, bytes32 newKeyHash) external onlyOwner {
        s_subscriptionId = subscriptionId;
        keyHash = newKeyHash;
    }

    /*///////////////////////////////////////////////////////////////
                            CHAINLINK AUTOMATION
    ///////////////////////////////////////////////////////////////*/

    /// @dev Checks if upkeep is needed.
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastUpdateTimestamp) >= updateInterval;
        performData = "";
    }

    /// @dev Performs upkeep if needed.
    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastUpdateTimestamp) < updateInterval) {
            return;
        }
        lastUpdateTimestamp = block.timestamp;
        _distributePassiveXP();
        emit UpkeepPerformed(block.timestamp);
    }

    /// @dev Distributes passive XP to eligible characters.
    function _distributePassiveXP() internal {
        uint256 lastTokenId = _tokenIdCounter.current() - 1;
        for (uint256 i = 1; i <= lastTokenId; i++) {
            if (_exists(i) && isAutoXPEnabled[i] && _isStaked(i)) {
                if (_characterTraits[i].level < _MAX_LEVEL) {
                    uint256 amount = passiveXPAmount;
                    // Bonus based on level
                    amount = amount.add(_characterTraits[i].level.div(10));
                    
                    _characterTraits[i].experience = _characterTraits[i].experience.add(amount);
                    emit PassiveXPGranted(i, amount);
                    _checkLevelUp(i);
                }
            }
        }
    }

    /// @dev Checks if a character is staked.
    function _isStaked(uint256 tokenId) internal view returns (bool) {
        if (address(stakingContract) == address(0)) return false;
        return stakingContract.tokenOwner(tokenId) != address(0);
    }

    /// @dev Enables auto-XP for a character.
    function enableAutoXP(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotCharacterOwner(tokenId, msg.sender);
        }
        isAutoXPEnabled[tokenId] = true;
        emit AutoXPEnabled(tokenId);
    }

    /// @dev Sets the update interval for passive XP.
    function setUpdateInterval(uint256 newInterval) external onlyOwner {
        updateInterval = newInterval;
    }

    /// @dev Sets the passive XP amount.
    function setPassiveXPAmount(uint256 newAmount) external onlyOwner {
        passiveXPAmount = newAmount;
    }

    /// @dev Sets the staking contract address.
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = ICharacterStaking(_stakingContract);
    }

    /*///////////////////////////////////////////////////////////////
                            INTERNAL & PRIVATE
    ///////////////////////////////////////////////////////////////*/

    /// @dev Internal function to check if a provided character class is valid.
    /// @param characterClass The class string to validate.
    /// @return True if the class is valid, false otherwise.
    function _isValidCharacterClass(string memory characterClass) internal pure returns (bool) {
        return (
            keccak256(abi.encodePacked(characterClass)) == keccak256(abi.encodePacked("Warrior")) ||
            keccak256(abi.encodePacked(characterClass)) == keccak256(abi.encodePacked("Mage")) ||
            keccak256(abi.encodePacked(characterClass)) == keccak256(abi.encodePacked("Rogue"))
        );
    }

    /// @dev See {UUPSUpgradeable-_authorizeUpgrade}.
    ///      Only the contract owner can authorize an upgrade.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /*///////////////////////////////////////////////////////////////
                            STORAGE GAP
    ///////////////////////////////////////////////////////////////*/

    /// @dev Storage gap to ensure compatibility during upgrades.
    uint256[35] private __gap; // Reduced by 1 to account for _parents mapping
}