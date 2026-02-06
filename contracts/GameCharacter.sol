// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

/// @title GameCharacter
/// @dev An ERC721Upgradeable contract for game characters with dynamic traits.
contract GameCharacter is ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256;

    /*///////////////////////////////////////////////////////////////
                            CUSTOM ERRORS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Thrown when an invalid character class is provided during minting.
    error InvalidCharacterClass(string characterClass);

    /// @dev Thrown when the caller is not the owner of the character.
    error NotCharacterOwner(uint256 tokenId, address caller);

    /// @dev Thrown when a character's level cannot be increased due to insufficient experience or max level.
    error LevelUpFailed(uint256 tokenId, uint256 currentExp, uint256 requiredExp);

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

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    CountersUpgradeable.Counter private _tokenIdCounter;

    /// @dev Mapping from token ID to CharacterTraits struct.
    mapping(uint256 => CharacterTraits) private _characterTraits;

    /*///////////////////////////////////////////////////////////////
                            INITIALIZER
    ///////////////////////////////////////////////////////////////*/

    /// @dev Initializes the contract.
    /// @param name_ The name of the NFT collection.
    /// @param symbol_ The symbol of the NFT collection.
    function initialize(string memory name_, string memory symbol_) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _tokenIdCounter.increment(); // Initialize counter to 1, first token will be 1
    }

    /*///////////////////////////////////////////////////////////////
                            MINTING
    ///////////////////////////////////////////////////////////////*/

    /// @dev Mints a new character NFT to the caller.
    ///      Only the contract owner can call this function.
    /// @param characterClass The class of the character to mint (e.g., "Warrior", "Mage", "Rogue").
    /// @return The tokenId of the newly minted character.
    function mintCharacter(string memory characterClass) public onlyOwner nonReentrant returns (uint256) {
        if (
            !_isValidCharacterClass(characterClass)
        ) {
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

        emit CharacterMinted(newTokenId, msg.sender, characterClass);

        return newTokenId;
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    /// @dev Returns the traits of a specific character.
    /// @param tokenId The unique identifier of the character.
    /// @return A CharacterTraits struct containing the character's attributes.
    function getCharacterTraits(uint256 tokenId) public view returns (CharacterTraits memory) {
        // This implicitly checks if the token exists, as accessing a non-existent key in a mapping
        // returns the default zero-initialized struct, but if we assume valid tokenId, it should exist.
        // Consider adding ERC721Upgradeable.exists(tokenId) check if needed.
        return _characterTraits[tokenId];
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
    uint256[50] private __gap;
}
