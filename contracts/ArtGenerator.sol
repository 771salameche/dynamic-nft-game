// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGameCharacter {
    function ownerOf(uint256 tokenId) external view returns (address);
    function setArtMetadata(
        uint256 tokenId,
        string calldata metadataURI,
        string calldata imageURI,
        string calldata prompt
    ) external;
}

/**
 * @title ArtGenerator
 * @dev Controls the AI art generation workflow for NFT characters.
 * Tag: v0.11.0 - ArtGenerator Contract
 */
contract ArtGenerator is Ownable, ReentrancyGuard {
    /*///////////////////////////////////////////////////////////////
                            STRUCTS
    ///////////////////////////////////////////////////////////////*/

    struct ArtRequest {
        uint256 tokenId;
        address requester;
        uint256 requestedAt;
        bool fulfilled;
    }

    /*///////////////////////////////////////////////////////////////
                            STORAGE
    ///////////////////////////////////////////////////////////////*/

    /// @dev Mapping from token ID to art request details.
    mapping(uint256 => ArtRequest) public artRequests;

    /// @dev Mapping from token ID to art generation status.
    mapping(uint256 => bool) public artGenerated;

    /// @dev Address of the GameCharacter contract.
    address public gameCharacterContract;

    /// @dev Address of the authorized backend fulfiller.
    address public authorizedFulfiller;

    /*///////////////////////////////////////////////////////////////
                            EVENTS
    ///////////////////////////////////////////////////////////////*/

    event ArtRequested(uint256 indexed tokenId, address requester, uint256 timestamp);
    event ArtGenerated(uint256 indexed tokenId, string metadataURI, string imageURI, string prompt);
    event FulfillerUpdated(address indexed oldFulfiller, address indexed newFulfiller);

    /*///////////////////////////////////////////////////////////////
                            CUSTOM ERRORS
    ///////////////////////////////////////////////////////////////*/

    error NotTokenOwner(uint256 tokenId, address caller);
    error ArtAlreadyGenerated(uint256 tokenId);
    error UnauthorizedFulfiller(address caller);
    error RequestNotFound(uint256 tokenId);
    error RequestAlreadyFulfilled(uint256 tokenId);
    error InvalidAddress();

    /*///////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Initializes the contract.
     * @param _gameCharacterContract The address of the GameCharacter contract.
     */
    constructor(address _gameCharacterContract) Ownable(msg.sender) {
        if (_gameCharacterContract == address(0)) revert InvalidAddress();
        gameCharacterContract = _gameCharacterContract;
        authorizedFulfiller = msg.sender;
        emit FulfillerUpdated(address(0), msg.sender);
    }

    /*///////////////////////////////////////////////////////////////
                            EXTERNAL FUNCTIONS
    ///////////////////////////////////////////////////////////////*/

    /**
     * @dev Requests AI art generation for a specific token.
     * @param tokenId The unique identifier of the character.
     */
    function requestArt(uint256 tokenId) external {
        if (IGameCharacter(gameCharacterContract).ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner(tokenId, msg.sender);
        }
        if (artGenerated[tokenId]) {
            revert ArtAlreadyGenerated(tokenId);
        }

        artRequests[tokenId] = ArtRequest({
            tokenId: tokenId,
            requester: msg.sender,
            requestedAt: block.timestamp,
            fulfilled: false
        });

        emit ArtRequested(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Fulfills an art generation request.
     * @param tokenId The unique identifier of the character.
     * @param metadataURI The IPFS CID of the generated metadata JSON.
     * @param imageURI The IPFS CID of the generated art image.
     * @param prompt The AI prompt used for generation.
     */
    function fulfillArt(
        uint256 tokenId,
        string calldata metadataURI,
        string calldata imageURI,
        string calldata prompt
    ) external nonReentrant {
        if (msg.sender != authorizedFulfiller) {
            revert UnauthorizedFulfiller(msg.sender);
        }
        if (artRequests[tokenId].tokenId == 0) {
            revert RequestNotFound(tokenId);
        }
        if (artRequests[tokenId].fulfilled) {
            revert RequestAlreadyFulfilled(tokenId);
        }

        artRequests[tokenId].fulfilled = true;
        artGenerated[tokenId] = true;

        IGameCharacter(gameCharacterContract).setArtMetadata(
            tokenId,
            metadataURI,
            imageURI,
            prompt
        );

        emit ArtGenerated(tokenId, metadataURI, imageURI, prompt);
    }

    /**
     * @dev Updates the authorized fulfiller address.
     * @param _fulfiller The new fulfiller address.
     */
    function setAuthorizedFulfiller(address _fulfiller) external onlyOwner {
        if (_fulfiller == address(0)) revert InvalidAddress();
        address oldFulfiller = authorizedFulfiller;
        authorizedFulfiller = _fulfiller;
        emit FulfillerUpdated(oldFulfiller, _fulfiller);
    }

    /**
     * @dev Returns the details of an art request.
     * @param tokenId The unique identifier of the character.
     */
    function getArtRequest(uint256 tokenId) external view returns (ArtRequest memory) {
        return artRequests[tokenId];
    }
}
