# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [0.7.2] - 2026-02-07

### Added
- Created `AchievementBadge.sol`, an ERC721 Soulbound NFT contract (ERC5192).
- Badges are automatically minted by `AchievementTracker` when achievements are unlocked.
- Implemented dynamic on-chain SVG generation for badge metadata, with unique colors per tier.
- Overridden transfer and approval functions to enforce soulbound status.
- Added `setAchievementBadge` function to `AchievementTracker.sol` for configuration.

## [0.7.1] - 2026-02-07

### Added
- Created `AchievementTrigger.sol` to centralize achievement checking logic.
- Integrated achievement triggers into `GameCharacter.sol`, `CharacterBreeding.sol`, and `CharacterStaking.sol`.
- Created `scripts/setup/create-achievements.ts` to populate the tracker with 18 predefined achievements across Collection, Progression, Breeding, and Staking categories.
- Implemented specific trigger logic for minting, leveling, breeding, fusion, and staking milestones.

## [0.7.0] - 2026-02-07

### Added
- Created `AchievementTracker.sol` for a comprehensive on-chain achievement system.
- Supports achievement tiers (Bronze to Diamond) and categories (Combat, Breeding, etc.).
- Rewards players with character XP and `GameToken` rewards upon unlocking achievements.
- Automated progress tracking and auto-unlocking functionality.
- Integrated with `GameCharacter` and `GameToken` for rewards distribution.

## [0.6.3] - 2026-02-07

### Added
- Created comprehensive unit tests for breeding and fusion in `test/unit/CharacterBreeding.test.ts`.
- Verified offspring generation with correct genetic inheritance and balance tracking.
- Verified fusion logic including parent NFT burning and super-character creation.
- Increased `callbackGasLimit` to 1,000,000 in `CharacterBreeding.sol` to support complex VRF fulfillments.
- Added `MutationApplied` event to `GameCharacter.sol`.

## [0.6.2] - 2026-02-07

### Added
- Implemented Fusion system in `CharacterBreeding.sol` to combine two Level 50+ characters.
- Fusion creates a "super-character" by summing parent stats with a 20% bonus (capped at 150).
- Fused characters receive special bonuses: 50% XP boost and 2x staking rewards.
- Added dynamic fusion costs based on total parent stats (up to 3x multiplier).
- Implemented NFT burning for fused parents in `GameCharacter.sol`.
- Updated `CharacterStaking.sol` to recognize and reward fused characters.

## [0.6.1] - 2026-02-07

### Added
- Implemented advanced genetic algorithms in `CharacterBreeding.sol`.
- Added dominant/recessive trait inheritance (75%/25% chance).
- Introduced hidden genetic markers to `GameCharacter.sol` struct.
- Implemented mutation system: 5% positive, 2% negative, 0.1% legendary.
- Added special breeding bonuses for same-class parents, high-level parents, and max-stat parents.
- Increased VRF random words request to 10 to support complex genetics.

## [0.6.0] - 2026-02-07

### Added
- Created `CharacterBreeding.sol` for a genetics-based breeding system.
- Implemented trait inheritance with variance and mutation using Chainlink VRF.
- Added generation tracking and sibling breeding restrictions.
- Integrated GAME token burn mechanism for breeding costs.
- Modified `GameCharacter.sol` to track parentage and allow authorized minting of offspring.
- Enabled `viaIR` in Hardhat configuration to handle complex contract compilation.

## [0.5.3] - 2026-02-07

### Added
- Created comprehensive integration tests for Chainlink Automation in `test/integration/Automation.test.ts`.
- Verified passive XP distribution for staked characters.
- Verified automated daily quest generation and completion.
- Tested `checkUpkeep` and `performUpkeep` logic with time manipulation.

## [0.5.2] - 2026-02-07

### Added
- Created `scripts/setup/register-upkeep.ts` for programmatic Chainlink Automation registration.
- Created `scripts/setup/manage-upkeep.ts` for managing existing upkeeps (funding, pausing, etc.).
- Created `scripts/test/trigger-upkeep.ts` for manual upkeep triggering and testing.
- Created `scripts/monitoring/check-automation.ts` providing a monitoring dashboard for upkeep health, balance, and execution history.

## [0.5.1] - 2026-02-07

### Added
- Created `DailyQuest.sol` for automated daily challenges.
- Integrated Chainlink Automation to trigger daily quest generation.
- Used Chainlink VRF for randomized quest types and difficulties.
- Rewards include both character experience (XP) and `GameToken` rewards.
- Quests have a 24-hour expiration period.

## [0.5.0] - 2026-02-07

### Added
- Integrated Chainlink Automation into `GameCharacter.sol` for passive gameplay mechanics.
- Implemented `checkUpkeep` and `performUpkeep` to automate passive XP distribution.
- New state variables: `lastUpdateTimestamp`, `updateInterval`, `passiveXPAmount`, and `isAutoXPEnabled`.
- New function `enableAutoXP` to allow players to opt-in for passive character progression.
- Integration with `CharacterStaking` to ensure only staked characters receive passive XP.
- New events: `UpkeepPerformed`, `PassiveXPGranted`, and `AutoXPEnabled`.

## [0.4.3] - 2026-02-07

### Added
- Created `TokenVesting.sol` for team token distribution with cliff and linear vesting.
- Created `scripts/setup/configure-tokenomics.ts` to automate token distribution, vesting setup, and staking funding.
- Documented token allocation and utility in `docs/TOKENOMICS.md`.
- Defined initial distribution: Treasury (40%), Staking (30%), Team (15%), Liquidity (10%), Community (5%).

## [0.4.2] - 2026-02-07

### Added
- Created custom React hooks in `frontend/hooks/useStaking.ts` using `wagmi` for staking UI.
- `useStake`: Handles NFT approval and staking.
- `useUnstake`: Handles character unstaking.
- `useClaimRewards`: Manages reward claiming and fetches claimable amounts.
- `useStakedCharacters`: Fetches and watches staked NFT data for users.
- `useStakingStats`: Provides summary statistics for staking.
- `useRewardCalculation`: Real-time reward estimation and projections.

## [0.4.1] - 2026-02-07

### Added
- Created comprehensive unit tests for `CharacterStaking.sol` in `test/unit/CharacterStaking.test.ts`.
- Verified staking/unstaking operations, reward calculations with multipliers, and claim functionality.
- Tested edge cases like emergency withdrawal and pausing.
- Integrated `VRFCoordinatorV2Mock` to support `GameCharacter` minting within staking tests.

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
