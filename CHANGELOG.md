# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [0.3.0] - 2026-02-07

### Added
- Integrated Chainlink VRF v2 into `GameCharacter.sol` for random trait generation (strength, agility, intelligence).
- New state variables for VRF configuration: `COORDINATOR`, `s_subscriptionId`, `keyHash`, `callbackGasLimit`, `requestConfirmations`, and `numWords`.
- New mappings: `requestToTokenId` and `requestToMinter`.
- New events: `MintRequested(requestId, tokenId)` and `TraitsRevealed(tokenId, traits)`.
- New function `setVRFConfig` to update VRF parameters.

### Changed
- `GameCharacter` now inherits from `VRFConsumerBaseV2`.
- `initialize()` updated to accept VRF parameters (`vrfCoordinator`, `subscriptionId`, `keyHash`).
- `mintCharacter()` now requests random traits from Chainlink VRF and initializes character with temporary default traits.

## [0.0.1] - 2026-02-06

### Added

- Initial Hardhat TypeScript project setup.
- Configured `package.json` with Hardhat, OpenZeppelin Upgrades, Chainlink Contracts, TypeScript, testing libraries, ESLint, Prettier, and Solhint.
- Created `hardhat.config.ts` with Polygon Amoy and Mainnet network configurations.
- Created `tsconfig.json` for TypeScript.
- Created `.gitignore` for common exclusions.
- Created `.env.example` with environment variable placeholders.
- Configured ESLint (`.eslintrc.json`) and Prettier (`.prettierrc.json`, `.prettierignore`) for TypeScript and Solidity.
- Created `.solhint.json` for Solidity linting.
- Created initial `README.md` with project overview and setup instructions.
- Created placeholder script files (`scripts/deploy.ts`, `scripts/index.ts`).
