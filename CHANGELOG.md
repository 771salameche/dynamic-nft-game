# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.2] - 2026-02-14

### Added
- Implemented AssemblyScript mapping functions for all core game contracts in `subgraph/src/`.
- `game-character.ts`: Handles minting, leveling, traits updates, and experience gains.
- `game-token.ts`: Tracks token transfers between players.
- `character-staking.ts`: Manages staking/unstaking events and rewards claims.
- `character-breeding.ts`: Indexes breeding events and character fusion history.
- `achievement-tracker.ts`: Tracks achievement additions and player unlocks.
- Verified successful compilation of the entire subgraph with `graph build`.

## [0.9.1] - 2026-02-14

### Added
- Defined a comprehensive GraphQL schema in `subgraph/schema.graphql` with entities for Players, Characters, Staking, Breeding, Achievements, and Global Statistics.
- Implemented relationship mapping in the schema (e.g., character parents/offspring, player achievements).
- Added `immutable: true/false` flags to all entities in `schema.graphql` to comply with the latest Graph CLI requirements.
- Regenerated subgraph types using `graph codegen` to reflect the new schema structure.

## [0.9.0] - 2026-02-14

### Added
- Initialized The Graph subgraph for comprehensive blockchain data indexing.
- Created `subgraph/schema.graphql` with entities for Characters, Players, Staking, Breeding, and Achievements.
- Configured `subgraph/subgraph.yaml` for Polygon Amoy with correct contract addresses and event signatures.
- Implemented AssemblyScript mapping logic in `subgraph/src/` for all core game contracts.
- Successfully performed subgraph `codegen` and `build` for deployment readiness.
- Prepared contract ABIs in `subgraph/abis/` for indexing.

### Changed
- Renamed network configuration from `polygonAmoy` to `amoy` across the entire project for CLI consistency.
- Refactored `tsconfig.json` to align with standard Hardhat TypeScript practices, improving type resolution and stability.
- Updated `package.json` scripts to support the new `--network amoy` flag.

### Fixed
- Resolved `Error HH100: Network amoy doesn't exist` by aligning Hardhat config with CLI expectations.
- Successfully executed the full deployment sequence on the Amoy testnet, deploying all 10 core contracts.
- Updated existing deployment records in `deployments/` to reflect the network name change.

## [0.8.9] - 2026-02-10

### Added
- Completed Frontend ecosystem integration and polishing.
- Implemented `TransactionStatus.tsx` for real-time blockchain feedback.
- Added comprehensive SEO metadata to `layout.tsx` for social sharing and search visibility.
- Refactored global layout into a Server Component architecture for better performance.
- Created `Web3Provider.tsx` to centralize client-side blockchain providers.

### Changed
- Configured explicit responsive breakpoints in Tailwind CSS v4 theme.
- Enhanced accessibility by adding semantic HTML tags across the layout.

### Fixed
- Cleaned up unused imports and refined TypeScript types in Web3 components.

## [0.8.8] - 2026-02-10

### Added
- Created an engaging, professional landing page.
- Implemented `AnimatedCharacters.tsx` with particle effects and interactive hero previews.
- Created `FeatureCard.tsx` to highlight core ecosystem mechanics.
- Implemented `Step.tsx` for visual "How it Works" progression.
- Created `ActivityFeed.tsx` with simulated real-time on-chain events (mints, breeding, staking).
- Integrated scroll-triggered animations using Framer Motion.

### Fixed
- Resolved hydration mismatch errors in the landing page by ensuring client-side rendering for random elements.
- Optimized performance by lazy-loading heavy animated components.

## [0.8.7] - 2026-02-10

### Added
- Created User Profile page with comprehensive player statistics and hero collection view.
- Implemented Global Leaderboard with category-based rankings (Level, Power, Staking, Breeding).
- Added `ActivityTimeline.tsx` to visualize recent player actions and milestones.
- Implemented `PodiumCard.tsx` and `LeaderboardRow.tsx` for professional ranking display.
- Added `useLeaderboard` and `useYourRank` hooks for competitive data discovery.
- Implemented `useStakingStats` hook for profile-level staking summaries.

### Changed
- Enhanced `utils.ts` with `truncateAddress` helper for cleaner UI display.
- Optimized `useStaking.ts` with per-token reward simulation for better real-time accuracy.

### Fixed
- Resolved critical build errors related to TypeScript type conversions in multicall results.
- Fixed type mismatch in staking reward calculation hook.
- Resolved cascading render issues in profile activity components.

## [0.8.6] - 2026-02-10

### Added
- Created comprehensive Achievement Tracker interface.
- Implemented `AchievementCard.tsx` with tier-based styling and progress tracking.
- Added `CircularProgress.tsx` for visual completion metrics.
- Implemented real-time `AchievementNotification.tsx` using custom toasts.
- Optimized metadata fetching using `useReadContracts` multicall for high performance.
- Added `useAchievementNotifications` hook to listen for on-chain achievement unlocks.
- Created `AchievementsPage` with category filtering and search functionality.

### Changed
- Refactored `useAchievements.ts` to support efficient batch fetching and player progress mapping.
- Enhanced `utils.ts` with `formatDate` helper for blockchain timestamps.

### Fixed
- Resolved build issues and linting warnings in the achievement module.

## [0.8.5] - 2026-02-10

### Added
- Created advanced Laboratory interface for Breeding and Fusion.
- Implemented `OffspringPreview.tsx` with genetic potential and stat prediction.
- Created `CharacterSelectionModal.tsx` for easy parent selection with trait previews.
- Implemented `FusionPanel.tsx` for high-level character evolution with burn warnings.
- Created `BreedingHistorySection.tsx` to visualize character lineages and ancestry.
- Added `Dialog.tsx` UI component for modal-based character selection.
- Implemented `useBreedingCosts`, `useCanFuse`, and updated lineage hooks.

### Changed
- Redesigned `BreedingPage` with a professional Laboratory console layout.
- Improved `useBreeding` hooks to fetch dynamic costs from the blockchain.

### Fixed
- Fixed explicit `any` types in breeding hooks.
- Resolved unused import warnings across the laboratory module.

## [0.8.4] - 2026-02-10

### Added
- Created a comprehensive Staking Dashboard with real-time reward tracking.
- Implemented `StakedCharacterCard.tsx` with animated progress bars for milestone tracking.
- Created `StakingInfoPanel.tsx` to explain mechanics, reward rates, and multipliers.
- Added `StatCard.tsx` as a reusable UI component for dashboard metrics.
- Implemented `useCurrentTime` hook to provide reactive, pure timestamps for UI consistency.
- Added `useCalculateRewards` hook for per-token reward discovery.
- Implemented `useOwnedTokenIds` hook for automated character discovery using event logs.

### Changed
- Refactored `StakingPage` with a professional, grid-based dashboard layout.
- Enhanced `CharacterCard.tsx` to support contextual actions (Stake/Unstake/Details).
- Optimized reward calculation logic to provide 1-second update frequency in the UI.

### Fixed
- Resolved React purity issues with `Date.now()` calls in component render cycles.
- Fixed explicit `any` types across staking hooks and components for better type safety.
- Resolved cascading render issues by optimizing state updates in effects.

## [0.8.3] - 2026-02-10

### Added
- Created professional Hero Summoning interface for character minting.
- Implemented `ClassCard.tsx` with detailed stat visualization and selection animations.
- Created `CharacterPreview.tsx` featuring animated 3D-like character sprites.
- Added interactive VRF status visualization ("Summoning Randomness") during trait generation.
- Implemented gas estimation for minting transactions in the UI.
- Created reusable `Button.tsx` UI component following shadcn/ui standards.

### Changed
- Redesigned `MintPage` with a dual-pane layout (Selection vs. Preview).
- Updated `useGameCharacter.ts` hook to expose transaction confirmation and success states.

### Fixed
- Fixed unescaped entities in JSX templates.
- Resolved unused import warnings in the minting module.

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
