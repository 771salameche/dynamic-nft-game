// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGameCharacter is IERC721 {
    struct CharacterTraits {
        uint256 level;
        uint256 strength;
        uint256 agility;
        uint256 intelligence;
        uint256 experience;
        uint40 lastTrainedAt;
        uint256 generation;
        string characterClass;
    }
    function getCharacterTraits(uint256 tokenId) external view returns (CharacterTraits memory);
}

interface IGameToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title CharacterStaking
 * @dev A contract for staking GameCharacter NFTs to earn GameToken rewards.
 */
contract CharacterStaking is Ownable, Pausable, ReentrancyGuard {
    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct StakeInfo {
        uint256 tokenId;
        uint256 stakedAt;
        uint256 lastClaimAt;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    IGameCharacter public immutable characterNFT;
    IGameToken public immutable gameToken;

    /// @dev Mapping from user address to their staked tokens info.
    mapping(address => StakeInfo[]) public userStakes;
    
    /// @dev Mapping from tokenId to current staker.
    mapping(uint256 => address) public tokenOwner;

    /// @dev Base reward rate (tokens per second). 10 tokens per day = 10 * 10**18 / 86400
    uint256 public baseRewardRate;
    
    /// @dev Level-based multipliers (in percentage, 100 = 1x, 150 = 1.5x).
    mapping(uint8 => uint256) public levelMultiplier;

    /// @dev Minimum stake time before first claim (anti-gaming).
    uint256 public minStakeTime = 1 days;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event LevelMultiplierUpdated(uint8 level, uint256 multiplier);

    /*///////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    ///////////////////////////////////////////////////////////////*/

    constructor(
        address _characterNFT,
        address _gameToken
    ) Ownable(msg.sender) {
        characterNFT = IGameCharacter(_characterNFT);
        gameToken = IGameToken(_gameToken);
        
        // Default: 10 tokens per day
        baseRewardRate = (10 * 10**18) / uint256(1 days);
    }

    /*///////////////////////////////////////////////////////////////
                            STAKING LOGIC
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Stakes a character NFT.
     * @param tokenId The ID of the token to stake.
     */
    function stake(uint256 tokenId) external nonReentrant whenNotPaused {
        require(characterNFT.ownerOf(tokenId) == msg.sender, "Not the owner of the token");
        
        characterNFT.transferFrom(msg.sender, address(this), tokenId);
        
        userStakes[msg.sender].push(StakeInfo({
            tokenId: tokenId,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp
        }));
        
        tokenOwner[tokenId] = msg.sender;
        
        emit Staked(msg.sender, tokenId, block.timestamp);
    }

    /**
     * @dev Unstakes a character NFT and claims pending rewards.
     * @param tokenId The ID of the token to unstake.
     */
    function unstake(uint256 tokenId) external nonReentrant {
        require(tokenOwner[tokenId] == msg.sender, "Not the staker of the token");

        // Claim rewards before unstaking
        _claimForToken(tokenId);

        // Remove from storage
        _removeStake(msg.sender, tokenId);
        delete tokenOwner[tokenId];

        // Transfer NFT back
        characterNFT.transferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId, block.timestamp);
    }

    /**
     * @dev Claims rewards for all staked NFTs.
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 totalReward = _calculateTotalRewards(msg.sender);
        require(totalReward > 0, "No rewards to claim");

        StakeInfo[] storage stakes = userStakes[msg.sender];
        for (uint256 i = 0; i < stakes.length; i++) {
            stakes[i].lastClaimAt = block.timestamp;
        }

        gameToken.mint(msg.sender, totalReward);
        emit RewardsClaimed(msg.sender, totalReward);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Calculates total pending rewards for a user.
     */
    function calculateRewards(address user) public view returns (uint256) {
        return _calculateTotalRewards(user);
    }

    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return userStakes[user];
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function setRewardRate(uint256 newRatePerDay) external onlyOwner {
        baseRewardRate = newRatePerDay / uint256(1 days);
        emit RewardRateUpdated(baseRewardRate);
    }

    function setLevelMultiplier(uint8 level, uint256 multiplierPercentage) external onlyOwner {
        levelMultiplier[level] = multiplierPercentage;
        emit LevelMultiplierUpdated(level, multiplierPercentage);
    }

    function setMinStakeTime(uint256 _time) external onlyOwner {
        minStakeTime = _time;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw without claiming rewards.
     */
    function emergencyWithdraw(uint256 tokenId) external nonReentrant {
        require(tokenOwner[tokenId] == msg.sender, "Not the staker");

        _removeStake(msg.sender, tokenId);
        delete tokenOwner[tokenId];

        characterNFT.transferFrom(address(this), msg.sender, tokenId);
        emit Unstaked(msg.sender, tokenId, block.timestamp);
    }

    /*///////////////////////////////////////////////////////////////
                            INTERNAL HELPERS
    ///////////////////////////////////////////////////////////////*/

    function _calculateTotalRewards(address user) internal view returns (uint256) {
        StakeInfo[] storage stakes = userStakes[user];
        uint256 totalReward = 0;

        for (uint256 i = 0; i < stakes.length; i++) {
            totalReward += _calculateTokenReward(stakes[i]);
        }

        return totalReward;
    }

    function _calculateTokenReward(StakeInfo memory stakeInfo) internal view returns (uint256) {
        if (block.timestamp < stakeInfo.stakedAt + minStakeTime) {
            return 0;
        }

        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimAt;
        uint256 reward = timeStaked * baseRewardRate;

        // Apply level multiplier
        IGameCharacter.CharacterTraits memory traits = characterNFT.getCharacterTraits(stakeInfo.tokenId);
        uint256 multiplier = levelMultiplier[uint8(traits.level)];
        
        if (multiplier > 0) {
            reward = (reward * multiplier) / 100;
        }

        return reward;
    }

    function _claimForToken(uint256 tokenId) internal {
        StakeInfo[] storage stakes = userStakes[msg.sender];
        uint256 reward = 0;
        
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].tokenId == tokenId) {
                reward = _calculateTokenReward(stakes[i]);
                stakes[i].lastClaimAt = block.timestamp;
                break;
            }
        }

        if (reward > 0) {
            gameToken.mint(msg.sender, reward);
            emit RewardsClaimed(msg.sender, reward);
        }
    }

    function _removeStake(address user, uint256 tokenId) internal {
        StakeInfo[] storage stakes = userStakes[user];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].tokenId == tokenId) {
                stakes[i] = stakes[stakes.length - 1];
                stakes.pop();
                break;
            }
        }
    }
}
