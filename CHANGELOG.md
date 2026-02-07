# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [0.4.0] - 2026-02-07

### Added
- Created `CharacterStaking.sol` for NFT staking and token rewards.
- Implemented time-based reward calculation with level multipliers.
- Added anti-gaming mechanism with a minimum stake time before rewards can be claimed.
- Included emergency withdrawal functionality and administrative controls for reward rates and multipliers.

## [0.3.3] - 2026-02-07

### Added
- Created comprehensive integration tests in `test/integration/VRF.test.ts`.
- Verified VRF subscription setup, random trait generation, and loot box item assignment.
- Implemented `VRFCoordinatorV2Mock` for local integration testing.
- Added `unsafeAllow` flags for upgradeable contract deployments involving VRF.

## [0.3.2] - 2026-02-07

### Added
- Created `LootBox.sol` for random item drops using Chainlink VRF v2.
- Items feature rarity tiers: Common (50%), Rare (30%), Epic (15%), Legendary (4%), Mythic (1%).
- Items provide permanent stat boosts (Strength, Agility, Intelligence) to characters.
- Players can open loot boxes using MATIC (0.01) or GAME tokens (10).
- Admin functions to configure drop rates and prices.
- Added `boostTraits` function to `GameCharacter.sol` to allow authorized contracts to increase character stats.

## [0.3.1] - 2026-02-07

### Added
- Created `scripts/setup/setup-vrf.ts` for automated Chainlink VRF subscription management on Polygon Amoy.
- Created `scripts/setup/fund-subscription.ts` to fund existing VRF subscriptions with LINK.
- Created `scripts/test/test-vrf-mint.ts` for end-to-end testing of character minting with VRF traits.
- Created `scripts/test/mock-vrf-fulfill.ts` for local simulation of VRF fulfillment using mocks.

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
