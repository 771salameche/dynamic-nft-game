// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title GameToken
/// @dev Implementation of the GAME token for the Dynamic NFT Gaming Ecosystem.
/// This contract is a standard ERC20 token with additional minting and burning capabilities.
contract GameToken is ERC20, ERC20Burnable, Ownable, AccessControl {
    /// @dev Role identifier for the minter role.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Initial supply of tokens to be minted to the deployer (1,000,000 tokens).
    uint256 public constant INITIAL_SUPPLY = 1_000_000;

    /**
     * @dev Constructor that gives msg.sender all relevant roles and mints initial supply.
     * @param initialOwner The address that will be the initial owner and admin.
     */
    constructor(address initialOwner) ERC20("Game Token", "GAME") Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _mint(initialOwner, INITIAL_SUPPLY * 10 ** decimals());
    }

    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Function to add a new minter.
     * @param minter The address to be granted the MINTER_ROLE.
     */
    function addMinter(address minter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Function to remove a minter.
     * @param minter The address to be revoked the MINTER_ROLE.
     */
    function removeMinter(address minter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
    }

    /**
     * @dev The following functions are overrides required by Solidity for multiple inheritance.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
