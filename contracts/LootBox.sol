// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

interface IGameCharacter {
    function boostTraits(uint256 tokenId, uint16 strengthBoost, uint16 agilityBoost, uint16 intelligenceBoost) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title LootBox
 * @dev A contract for random item drops using Chainlink VRF v2.
 */
contract LootBox is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct LootItem {
        uint256 id;
        uint8 rarity; // 1: Common, 2: Rare, 3: Epic, 4: Legendary, 5: Mythic
        string itemType; // "Weapon", "Armor", "Potion"
        uint16 strengthBoost;
        uint16 agilityBoost;
        uint16 intelligenceBoost;
        bool isUsed;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    VRFCoordinatorV2Interface public COORDINATOR;
    IERC20 public gameToken;
    IGameCharacter public gameCharacter;

    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 300000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 2; // One for rarity, one for stats/type

    uint256 public maticPrice = 0.01 ether;
    uint256 public tokenPrice = 10 * 10**18;

    uint256 private _itemCounter;

    // Rarity weights (sum to 100)
    uint8 public commonWeight = 50;
    uint8 public rareWeight = 30;
    uint8 public epicWeight = 15;
    uint8 public legendaryWeight = 4;
    uint8 public mythicWeight = 1;

    mapping(uint256 => address) public requestToPlayer;
    mapping(address => LootItem[]) public playerInventory;
    mapping(uint256 => address) public itemIdToOwner;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event LootBoxOpened(uint256 indexed requestId, address indexed player, bool paidWithToken);
    event ItemReceived(uint256 indexed requestId, address indexed player, uint256 itemId, uint8 rarity, string itemType);
    event ItemApplied(uint256 indexed itemId, uint256 indexed tokenId, address indexed player);

    /*///////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    ///////////////////////////////////////////////////////////////*/

    constructor(
        address vrfCoordinator,
        address _gameToken,
        address _gameCharacter,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        gameToken = IERC20(_gameToken);
        gameCharacter = IGameCharacter(_gameCharacter);
        s_subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    /*///////////////////////////////////////////////////////////////
                            LOOT BOX LOGIC
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Opens a loot box using MATIC or GAME tokens.
     * @param useTokens True if paying with GAME tokens, false if paying with MATIC.
     */
    function openLootBox(bool useTokens) external payable nonReentrant {
        if (useTokens) {
            require(gameToken.transferFrom(msg.sender, address(this), tokenPrice), "Token transfer failed");
        } else {
            require(msg.value >= maticPrice, "Insufficient MATIC sent");
            // Refund excess MATIC
            if (msg.value > maticPrice) {
                payable(msg.sender).transfer(msg.value - maticPrice);
            }
        }

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestToPlayer[requestId] = msg.sender;
        emit LootBoxOpened(requestId, msg.sender, useTokens);
    }

    /**
     * @dev VRF callback to generate and assign the item.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address player = requestToPlayer[requestId];
        require(player != address(0), "Request not found");

        uint8 rarity = _determineRarity(randomWords[0] % 100);
        string memory itemType = _determineItemType(randomWords[1] % 3);
        
        uint16 sBoost;
        uint16 aBoost;
        uint16 iBoost;

        // Base stats based on rarity
        uint16 baseStat = uint16(rarity) * 5; 
        uint16 variance = uint16(randomWords[1] % 5);

        if (keccak256(abi.encodePacked(itemType)) == keccak256(abi.encodePacked("Weapon"))) {
            sBoost = baseStat + variance;
        } else if (keccak256(abi.encodePacked(itemType)) == keccak256(abi.encodePacked("Armor"))) {
            aBoost = baseStat + variance;
        } else {
            iBoost = baseStat + variance;
        }

        _itemCounter++;
        LootItem memory newItem = LootItem({
            id: _itemCounter,
            rarity: rarity,
            itemType: itemType,
            strengthBoost: sBoost,
            agilityBoost: aBoost,
            intelligenceBoost: iBoost,
            isUsed: false
        });

        playerInventory[player].push(newItem);
        itemIdToOwner[_itemCounter] = player;

        emit ItemReceived(requestId, player, _itemCounter, rarity, itemType);
    }

    /**
     * @dev Applies an item's boost to a character and burns the item.
     */
    function applyItemToCharacter(uint256 inventoryIndex, uint256 tokenId) external nonReentrant {
        require(inventoryIndex < playerInventory[msg.sender].length, "Invalid index");
        LootItem storage item = playerInventory[msg.sender][inventoryIndex];
        require(!item.isUsed, "Item already used");
        require(gameCharacter.ownerOf(tokenId) == msg.sender, "Not your character");

        item.isUsed = true;
        
        gameCharacter.boostTraits(
            tokenId,
            item.strengthBoost,
            item.agilityBoost,
            item.intelligenceBoost
        );

        emit ItemApplied(item.id, tokenId, msg.sender);
    }

    /*///////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function getPlayerInventory(address player) external view returns (LootItem[] memory) {
        return playerInventory[player];
    }

    /*///////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    function setPrices(uint256 _maticPrice, uint256 _tokenPrice) external onlyOwner {
        maticPrice = _maticPrice;
        tokenPrice = _tokenPrice;
    }

    function setWeights(uint8 _common, uint8 _rare, uint8 _epic, uint8 _legendary, uint8 _mythic) external onlyOwner {
        require(_common + _rare + _epic + _legendary + _mythic == 100, "Weights must sum to 100");
        commonWeight = _common;
        rareWeight = _rare;
        epicWeight = _epic;
        legendaryWeight = _legendary;
        mythicWeight = _mythic;
    }

    function setVRFConfig(uint64 _subId, bytes32 _keyHash, uint32 _gasLimit) external onlyOwner {
        s_subscriptionId = _subId;
        keyHash = _keyHash;
        callbackGasLimit = _gasLimit;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawTokens(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }

    /*///////////////////////////////////////////////////////////////
                            INTERNAL HELPERS
    ///////////////////////////////////////////////////////////////*/

    function _determineRarity(uint256 roll) internal view returns (uint8) {
        if (roll < commonWeight) return 1;
        if (roll < commonWeight + rareWeight) return 2;
        if (roll < commonWeight + rareWeight + epicWeight) return 3;
        if (roll < commonWeight + rareWeight + epicWeight + legendaryWeight) return 4;
        return 5;
    }

    function _determineItemType(uint256 roll) internal pure returns (string memory) {
        if (roll == 0) return "Weapon";
        if (roll == 1) return "Armor";
        return "Potion";
    }
}
