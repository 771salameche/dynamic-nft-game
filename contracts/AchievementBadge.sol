// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./interfaces/IERC5192.sol";

/**
 * @title AchievementBadge
 * @dev Soulbound NFT (ERC5192) for Game Achievements.
 *      Generates on-chain SVG metadata based on achievement tier.
 */
contract AchievementBadge is ERC721, Ownable, IERC5192 {
    using Strings for uint256;

    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct BadgeMetadata {
        uint256 achievementId;
        string name;
        uint8 tier; // 1-5
        uint256 unlockedAt;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    address public achievementTracker;
    uint256 private _tokenIdCounter;

    // Mapping from tokenId to badge metadata
    mapping(uint256 => BadgeMetadata) public badgeMetadata;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event BadgeMinted(address indexed player, uint256 indexed tokenId, uint256 achievementId);

    /*///////////////////////////////////////////////////////////////
                            MODIFIERS
    ///////////////////////////////////////////////////////////////*/

    modifier onlyTracker() {
        require(msg.sender == achievementTracker, "Caller is not the AchievementTracker");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    ///////////////////////////////////////////////////////////////*/

    constructor() ERC721("Game Achievement Badge", "BADGE") Ownable(msg.sender) {}

    /*///////////////////////////////////////////////////////////////
                            CONFIGURATION
    ///////////////////////////////////////////////////////////////*/

    function setAchievementTracker(address _tracker) external onlyOwner {
        achievementTracker = _tracker;
    }

    /*///////////////////////////////////////////////////////////////
                            MINTING
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Mints a new soulbound achievement badge.
     *      Only callable by the AchievementTracker contract.
     */
    function mintBadge(
        address player, 
        uint256 achievementId, 
        string memory achievementName, 
        uint8 tier
    ) external onlyTracker returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        badgeMetadata[newTokenId] = BadgeMetadata({
            achievementId: achievementId,
            name: achievementName,
            tier: tier,
            unlockedAt: block.timestamp
        });

        _safeMint(player, newTokenId);
        emit Locked(newTokenId); // ERC5192 Event
        emit BadgeMinted(player, newTokenId, achievementId);

        return newTokenId;
    }

    /*///////////////////////////////////////////////////////////////
                            SOULBOUND LOGIC
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev See {IERC5192-locked}. Always returns true for valid tokens.
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");
        return true;
    }

    /**
     * @dev Block token transfers to enforce Soulbound status.
     *      Allows minting (_from == 0) and burning (_to == 0).
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Token is non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /*///////////////////////////////////////////////////////////////
                            METADATA GENERATION
    ///////////////////////////////////////////////////////////////*/

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");

        BadgeMetadata memory data = badgeMetadata[tokenId];
        string memory color = _getTierColor(data.tier);
        string memory tierName = _getTierName(data.tier);

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">',
            '<rect width="100%" height="100%" fill="', color, '" rx="15" ry="15"/>',
            '<text x="50%" y="30%" font-family="Arial" font-size="20" fill="black" text-anchor="middle" font-weight="bold">Achievement</text>',
            '<text x="50%" y="50%" font-family="Arial" font-size="24" fill="black" text-anchor="middle">', data.name, '</text>',
            '<text x="50%" y="70%" font-family="Arial" font-size="18" fill="black" text-anchor="middle">', tierName, ' Tier</text>',
            '<text x="50%" y="90%" font-family="Arial" font-size="12" fill="black" text-anchor="middle">Unlocked: ', data.unlockedAt.toString(), '</text>',
            '</svg>'
        ));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Badge: ', data.name, '",',
            '"description": "Soulbound Achievement Badge for ', data.name, ' - ', tierName, ' Tier",',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes": [',
                '{"trait_type": "Achievement ID", "value": "', data.achievementId.toString(), '"},',
                '{"trait_type": "Tier", "value": "', tierName, '"},',
                '{"trait_type": "Unlocked", "value": "', data.unlockedAt.toString(), '"}',
            ']}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _getTierColor(uint8 tier) internal pure returns (string memory) {
        if (tier == 1) return "#CD7F32"; // Bronze
        if (tier == 2) return "#C0C0C0"; // Silver
        if (tier == 3) return "#FFD700"; // Gold
        if (tier == 4) return "#E5E4E2"; // Platinum
        return "#B9F2FF"; // Diamond
    }

    function _getTierName(uint8 tier) internal pure returns (string memory) {
        if (tier == 1) return "Bronze";
        if (tier == 2) return "Silver";
        if (tier == 3) return "Gold";
        if (tier == 4) return "Platinum";
        return "Diamond";
    }
}
