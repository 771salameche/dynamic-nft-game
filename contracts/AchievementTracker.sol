// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGameCharacter {
    function gainExperience(uint256 tokenId, uint16 xpAmount) external;
    function balanceOf(address owner) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

interface IGameToken {
    function mint(address to, uint256 amount) external;
}

interface IAchievementBadge {
    function mintBadge(address player, uint256 achievementId, string memory achievementName, uint8 tier) external;
}

/**
 * @title AchievementTracker
 * @dev A comprehensive achievement system for the Dynamic NFT Gaming Ecosystem.
 */
contract AchievementTracker is Ownable, ReentrancyGuard {
    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct Achievement {
        uint256 achievementId;
        string name;
        string description;
        string category; // "Combat", "Breeding", "Social", "Collection", "Progression"
        uint8 tier; // 1-5 (Bronze, Silver, Gold, Platinum, Diamond)
        uint256 xpReward;
        uint256 tokenReward;
        bool isActive;
        uint256 unlockedCount; // Track total unlocks
    }

    struct PlayerAchievement {
        uint256 achievementId;
        uint256 unlockedAt;
        uint256 progress; // Progress in percentage (0-100)
        bool isUnlocked;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    IGameToken public immutable gameToken;
    IGameCharacter public immutable characterNFT;
    IAchievementBadge public achievementBadge;

    uint256 public totalAchievements;
    
    /// @dev Mapping from achievement ID to Achievement struct.
    mapping(uint256 => Achievement) public achievements;
    
    /// @dev Mapping from player address to achievement ID to PlayerAchievement struct.
    mapping(address => mapping(uint256 => PlayerAchievement)) public playerAchievements;
    
    /// @dev Mapping from player address to total number of achievements unlocked.
    mapping(address => uint256) public unlockedAchievementCount;

    /// @dev Mapping to keep track of addresses authorized to unlock achievements.
    mapping(address => bool) private _authorizedAddresses;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event AchievementAdded(uint256 indexed achievementId, string name, uint8 tier);
    event AchievementUnlocked(address indexed player, uint256 indexed achievementId, uint256 xpReward, uint256 tokenReward);
    event ProgressUpdated(address indexed player, uint256 indexed achievementId, uint256 progress);
    event AuthorizedAddressAdded(address indexed account);
    event AuthorizedAddressRemoved(address indexed account);

    /*///////////////////////////////////////////////////////////////
                            MODIFIERS
    ///////////////////////////////////////////////////////////////*/

    modifier onlyAuthorized() {
        require(owner() == msg.sender || _authorizedAddresses[msg.sender], "Caller is not authorized");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    ///////////////////////////////////////////////////////////////*/

    constructor(address _gameToken, address _characterNFT) Ownable(msg.sender) {
        gameToken = IGameToken(_gameToken);
        characterNFT = IGameCharacter(_characterNFT);
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function addAuthorizedAddress(address authAddress) external onlyOwner {
        _authorizedAddresses[authAddress] = true;
        emit AuthorizedAddressAdded(authAddress);
    }

    function removeAuthorizedAddress(address authAddress) external onlyOwner {
        _authorizedAddresses[authAddress] = false;
        emit AuthorizedAddressRemoved(authAddress);
    }

    function setAchievementBadge(address _badgeContract) external onlyOwner {
        achievementBadge = IAchievementBadge(_badgeContract);
    }

    /**
     * @dev Adds a new achievement to the system.
     */
    function addAchievement(
        string memory _name,
        string memory _description,
        string memory _category,
        uint8 _tier,
        uint256 _xpReward,
        uint256 _tokenReward
    ) external onlyOwner {
        totalAchievements++;
        achievements[totalAchievements] = Achievement({
            achievementId: totalAchievements,
            name: _name,
            description: _description,
            category: _category,
            tier: _tier,
            xpReward: _xpReward,
            tokenReward: _tokenReward,
            isActive: true,
            unlockedCount: 0
        });

        emit AchievementAdded(totalAchievements, _name, _tier);
    }

    function setAchievementStatus(uint256 _achievementId, bool _isActive) external onlyOwner {
        require(_achievementId <= totalAchievements && _achievementId > 0, "Invalid achievement ID");
        achievements[_achievementId].isActive = _isActive;
    }

    /*///////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Unlocks an achievement for a player.
     * @param _player The address of the player.
     * @param _achievementId The ID of the achievement to unlock.
     * @param _tokenId The ID of the character NFT to receive the XP reward.
     */
    function unlockAchievement(address _player, uint256 _achievementId, uint256 _tokenId) external onlyAuthorized nonReentrant {
        Achievement storage achievement = achievements[_achievementId];
        require(achievement.isActive, "Achievement is not active");
        require(!playerAchievements[_player][_achievementId].isUnlocked, "Already unlocked");

        playerAchievements[_player][_achievementId] = PlayerAchievement({
            achievementId: _achievementId,
            unlockedAt: block.timestamp,
            progress: 100,
            isUnlocked: true
        });

        unlockedAchievementCount[_player]++;
        achievement.unlockedCount++;

        // Rewards
        if (achievement.xpReward > 0 && _tokenId > 0) {
            characterNFT.gainExperience(_tokenId, uint16(achievement.xpReward));
        }
        if (achievement.tokenReward > 0) {
            gameToken.mint(_player, achievement.tokenReward);
        }

        if (address(achievementBadge) != address(0)) {
            achievementBadge.mintBadge(_player, _achievementId, achievement.name, achievement.tier);
        }

        emit AchievementUnlocked(_player, _achievementId, achievement.xpReward, achievement.tokenReward);
    }

    /**
     * @dev Updates progress for an achievement. Auto-unlocks if progress reaches 100.
     */
    function updateProgress(address _player, uint256 _achievementId, uint256 _progress, uint256 _tokenId) external onlyAuthorized {
        require(achievements[_achievementId].isActive, "Achievement is not active");
        require(!playerAchievements[_player][_achievementId].isUnlocked, "Already unlocked");
        require(_progress <= 100, "Invalid progress value");

        playerAchievements[_player][_achievementId].progress = _progress;
        emit ProgressUpdated(_player, _achievementId, _progress);

        if (_progress == 100) {
            this.unlockAchievement(_player, _achievementId, _tokenId);
        }
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function getPlayerAchievements(address _player) external view returns (PlayerAchievement[] memory) {
        PlayerAchievement[] memory playerList = new PlayerAchievement[](totalAchievements);
        uint256 count = 0;
        for (uint256 i = 1; i <= totalAchievements; i++) {
            if (playerAchievements[_player][i].achievementId != 0) {
                playerList[count] = playerAchievements[_player][i];
                count++;
            }
        }
        
        // Trim array
        PlayerAchievement[] memory result = new PlayerAchievement[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = playerList[j];
        }
        return result;
    }

    function getAchievementsByCategory(string memory _category) external view returns (Achievement[] memory) {
        Achievement[] memory categoryList = new Achievement[](totalAchievements);
        uint256 count = 0;
        bytes32 categoryHash = keccak256(abi.encodePacked(_category));
        
        for (uint256 i = 1; i <= totalAchievements; i++) {
            if (keccak256(abi.encodePacked(achievements[i].category)) == categoryHash) {
                categoryList[count] = achievements[i];
                count++;
            }
        }

        Achievement[] memory result = new Achievement[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = categoryList[j];
        }
        return result;
    }

    function getAchievementProgress(address _player, uint256 _achievementId) external view returns (uint256) {
        return playerAchievements[_player][_achievementId].progress;
    }

    function isAuthorized(address authAddress) external view returns (bool) {
        return _authorizedAddresses[authAddress] || owner() == authAddress;
    }
}
