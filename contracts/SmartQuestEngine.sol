// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameCharacter.sol";
import "./GameToken.sol";

/**
 * @title SmartQuestEngine
 * @notice AI-powered personalized quest system for the Dynamic NFT Game.
 */
contract SmartQuestEngine is Ownable, ReentrancyGuard {
    GameCharacter public gameCharacter;
    GameToken public gameToken;
    
    uint256 private _questIds;
    address public authorizedGenerator;
    
    enum QuestType {
        BREEDING,
        STAKING,
        LEVELING,
        SOCIAL,
        COLLECTION
    }
    
    enum QuestDifficulty {
        EASY,
        MEDIUM,
        HARD,
        EXPERT
    }
    
    struct SmartQuest {
        uint256 questId;
        address player;
        string description;
        string aiExplanation;
        QuestType questType;
        QuestDifficulty difficulty;
        uint256 xpReward;
        uint256 tokenReward;
        uint256 createdAt;
        uint256 expiresAt;
        bool completed;
        bool claimed;
    }
    
    // Player address => Active quest ID
    mapping(address => uint256) public playerActiveQuest;
    
    // Quest ID => Quest data
    mapping(uint256 => SmartQuest) public quests;
    
    // Player => Array of completed quest IDs
    mapping(address => uint256[]) public playerQuestHistory;
    
    // Player => Total quests completed
    mapping(address => uint256) public playerQuestCount;
    
    // Events
    event QuestRequested(address indexed player, uint256 timestamp);
    event QuestGenerated(
        uint256 indexed questId,
        address indexed player,
        QuestType questType,
        string description
    );
    event QuestCompleted(
        uint256 indexed questId,
        address indexed player,
        uint256 xpReward,
        uint256 tokenReward
    );
    event QuestExpired(uint256 indexed questId, address indexed player);
    event AuthorizedGeneratorUpdated(address oldGenerator, address newGenerator);
    
    constructor(
        address _gameCharacter,
        address _gameToken
    ) Ownable(msg.sender) {
        gameCharacter = GameCharacter(_gameCharacter);
        gameToken = GameToken(_gameToken);
        authorizedGenerator = msg.sender;
    }
    
    /**
     * @notice Request a personalized quest
     * @dev Can only have one active quest at a time
     */
    function requestQuest() external {
        require(
            playerActiveQuest[msg.sender] == 0 ||
            quests[playerActiveQuest[msg.sender]].completed ||
            block.timestamp > quests[playerActiveQuest[msg.sender]].expiresAt,
            "Already have active quest"
        );
        
        // If previous quest expired, mark it
        if (playerActiveQuest[msg.sender] != 0) {
            SmartQuest storage oldQuest = quests[playerActiveQuest[msg.sender]];
            if (!oldQuest.completed && block.timestamp > oldQuest.expiresAt) {
                emit QuestExpired(oldQuest.questId, msg.sender);
            }
        }
        
        emit QuestRequested(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Fulfill quest request with AI-generated quest
     * @dev Only authorized generator can call
     */
    function fulfillQuest(
        address player,
        string memory description,
        string memory aiExplanation,
        QuestType questType,
        QuestDifficulty difficulty,
        uint256 xpReward,
        uint256 tokenReward,
        uint256 durationInDays
    ) external {
        require(msg.sender == authorizedGenerator, "Not authorized");
        
        _questIds++;
        uint256 questId = _questIds;
        
        quests[questId] = SmartQuest({
            questId: questId,
            player: player,
            description: description,
            aiExplanation: aiExplanation,
            questType: questType,
            difficulty: difficulty,
            xpReward: xpReward,
            tokenReward: tokenReward,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (durationInDays * 1 days),
            completed: false,
            claimed: false
        });
        
        playerActiveQuest[player] = questId;
        
        emit QuestGenerated(questId, player, questType, description);
    }
    
    /**
     * @notice Complete a quest
     * @dev Called by player when they've fulfilled quest requirements
     * @param questId ID of the quest to complete
     * @param tokenId ID of the character to receive XP (if applicable)
     */
    function completeQuest(uint256 questId, uint256 tokenId) external nonReentrant {
        SmartQuest storage quest = quests[questId];
        
        require(quest.player == msg.sender, "Not your quest");
        require(!quest.completed, "Already completed");
        require(block.timestamp <= quest.expiresAt, "Quest expired");
        
        // Mark as completed
        quest.completed = true;
        quest.claimed = true;
        
        // Add to history
        playerQuestHistory[msg.sender].push(questId);
        playerQuestCount[msg.sender]++;
        
        // Grant rewards
        if (quest.tokenReward > 0) {
            gameToken.mint(msg.sender, quest.tokenReward);
        }
        
        // Grant XP to specified character
        if (quest.xpReward > 0) {
            require(gameCharacter.ownerOf(tokenId) == msg.sender, "Not owner of character");
            gameCharacter.gainExperience(tokenId, uint16(quest.xpReward));
        }
        
        emit QuestCompleted(questId, msg.sender, quest.xpReward, quest.tokenReward);
    }
    
    /**
     * @notice Get player's active quest
     */
    function getActiveQuest(address player) external view returns (SmartQuest memory) {
        uint256 questId = playerActiveQuest[player];
        require(questId != 0, "No active quest");
        return quests[questId];
    }
    
    /**
     * @notice Get player's quest history
     */
    function getQuestHistory(address player) external view returns (uint256[] memory) {
        return playerQuestHistory[player];
    }
    
    /**
     * @notice Check if quest is still active
     */
    function isQuestActive(uint256 questId) external view returns (bool) {
        SmartQuest memory quest = quests[questId];
        return !quest.completed && block.timestamp <= quest.expiresAt;
    }
    
    /**
     * @notice Set authorized generator (backend service)
     */
    function setAuthorizedGenerator(address _generator) external onlyOwner {
        address oldGenerator = authorizedGenerator;
        authorizedGenerator = _generator;
        emit AuthorizedGeneratorUpdated(oldGenerator, _generator);
    }
}
