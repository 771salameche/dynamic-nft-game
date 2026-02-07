// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

interface IGameCharacter {
    function gainExperience(uint256 tokenId, uint16 xpAmount) external;
}

interface IGameToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title DailyQuest
 * @dev Automated daily challenges using Chainlink Automation and VRF.
 */
contract DailyQuest is VRFConsumerBaseV2, AutomationCompatible, Ownable, ReentrancyGuard {
    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct Quest {
        uint256 questId;
        string description;
        uint256 xpReward;
        uint256 tokenReward;
        uint8 difficulty; // 1-5
        uint256 expiresAt;
        bool isActive;
    }

    struct QuestProgress {
        uint256 questId;
        uint256 progress;
        bool completed;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    VRFCoordinatorV2Interface public COORDINATOR;
    IGameCharacter public gameCharacter;
    IGameToken public gameToken;

    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 3;

    uint256 public lastUpdateTimestamp;
    uint256 public updateInterval = 1 days;
    uint256 public currentQuestId;
    
    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => QuestProgress)) public playerProgress;
    
    uint256[] public activeQuestIds;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event QuestGenerated(uint256 indexed questId, string description, uint8 difficulty);
    event QuestCompleted(address indexed player, uint256 indexed questId, uint256 characterId);
    event UpkeepExecuted(uint256 timestamp);

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
        gameToken = IGameToken(_gameToken);
        s_subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        lastUpdateTimestamp = block.timestamp;
    }

    /*///////////////////////////////////////////////////////////////
                            CHAINLINK AUTOMATION
    ///////////////////////////////////////////////////////////////*/

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastUpdateTimestamp) >= updateInterval;
        performData = "";
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastUpdateTimestamp) < updateInterval) return;
        
        lastUpdateTimestamp = block.timestamp;
        _requestNewQuest();
        emit UpkeepExecuted(block.timestamp);
    }

    /*///////////////////////////////////////////////////////////////
                            QUEST GENERATION
    ///////////////////////////////////////////////////////////////*/

    function _requestNewQuest() internal {
        COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
    }

    function fulfillRandomWords(uint256 /* requestId */, uint256[] memory randomWords) internal override {
        // Deactivate old quests
        for (uint256 i = 0; i < activeQuestIds.length; i++) {
            quests[activeQuestIds[i]].isActive = false;
        }
        delete activeQuestIds;

        currentQuestId++;
        uint8 difficulty = uint8((randomWords[0] % 5) + 1);
        string memory description = _generateDescription(randomWords[1]);
        
        uint256 xpReward = uint256(difficulty) * 20;
        uint256 tokenReward = uint256(difficulty) * 2 * 10**18;

        quests[currentQuestId] = Quest({
            questId: currentQuestId,
            description: description,
            xpReward: xpReward,
            tokenReward: tokenReward,
            difficulty: difficulty,
            expiresAt: block.timestamp + 1 days,
            isActive: true
        });

        activeQuestIds.push(currentQuestId);
        emit QuestGenerated(currentQuestId, description, difficulty);
    }

    /*///////////////////////////////////////////////////////////////
                            PLAYER ACTIONS
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Simple completion for now. In a real game, this would verify 
     * specific character stats or game state.
     */
    function completeQuest(uint256 questId, uint256 characterId) external nonReentrant {
        require(quests[questId].isActive, "Quest not active");
        require(block.timestamp < quests[questId].expiresAt, "Quest expired");
        require(!playerProgress[msg.sender][questId].completed, "Already completed");

        // Here we would normally verify 'progress' based on game events
        // For this prototype, we'll allow direct completion if called.
        
        playerProgress[msg.sender][questId].completed = true;
        playerProgress[msg.sender][questId].questId = questId;

        // Rewards
        gameCharacter.gainExperience(characterId, uint16(quests[questId].xpReward));
        gameToken.mint(msg.sender, quests[questId].tokenReward);

        emit QuestCompleted(msg.sender, questId, characterId);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function getActiveQuests() external view returns (Quest[] memory) {
        Quest[] memory activeQuests = new Quest[](activeQuestIds.length);
        for (uint256 i = 0; i < activeQuestIds.length; i++) {
            activeQuests[i] = quests[activeQuestIds[i]];
        }
        return activeQuests;
    }

    function getPlayerProgress(address player, uint256 questId) external view returns (QuestProgress memory) {
        return playerProgress[player][questId];
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function setUpdateInterval(uint256 _interval) external onlyOwner {
        updateInterval = _interval;
    }

    function setVRFConfig(uint64 _subId, bytes32 _keyHash, uint32 _gasLimit) external onlyOwner {
        s_subscriptionId = _subId;
        keyHash = _keyHash;
        callbackGasLimit = _gasLimit;
    }

    /*///////////////////////////////////////////////////////////////
                            INTERNAL HELPERS
    ///////////////////////////////////////////////////////////////*/

    function _generateDescription(uint256 random) internal pure returns (string memory) {
        string[5] memory questTypes = [
            "Train your character in the Arena",
            "Stake your character for 24 hours",
            "Defeat a mystical creature",
            "Reach a new character level",
            "Acquire a new legendary item"
        ];
        return questTypes[random % 5];
    }
}
