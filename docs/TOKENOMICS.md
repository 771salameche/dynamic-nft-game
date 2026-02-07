# GAME Token Economics

## Overview
The GAME token is the core utility and reward token of the Dynamic NFT Gaming Ecosystem.

**Total Initial Supply:** 1,000,000 GAME

## Distribution Allocation
| Category | Percentage | Amount (GAME) | Purpose |
| :--- | :--- | :--- | :--- |
| **Treasury** | 40% | 400,000 | Future game development, ecosystem growth, and reserve. |
| **Staking Rewards** | 30% | 300,000 | Rewards for players staking their GameCharacter NFTs. |
| **Team** | 15% | 150,000 | Incentives for the founding team (subject to vesting). |
| **Liquidity** | 10% | 100,000 | Provisioning liquidity for DEX pairs (e.g., GAME/MATIC). |
| **Community** | 5% | 50,000 | Airdrops, marketing campaigns, and community competitions. |

## Vesting Schedule (Team)
To ensure long-term alignment, team tokens are subject to a vesting period:
- **Cliff:** 6 Months (no tokens can be claimed).
- **Duration:** 12 Months total linear vesting.
- **Revocable:** The owner can revoke vesting if a team member leaves before completion.

## Emission Strategy
The ecosystem utilizes a combination of fixed-pool rewards and controlled inflation:
1. **Initial Pool:** 300,000 GAME tokens are pre-funded to the `CharacterStaking` contract.
2. **Dynamic Rewards:** The staking contract has the `MINTER_ROLE`, allowing it to mint additional tokens if the community votes to increase rewards beyond the initial pool, or to sustain long-term growth.
3. **Burn Mechanism:** The `GameToken` implements `ERC20Burnable`, allowing for deflationary mechanics (e.g., burning tokens spent on Loot Boxes).

## Utility
- **Loot Boxes:** Open boxes to receive random character items (10 GAME per box).
- **Staking:** Stake NFTs to earn passive GAME income.
- **Upgrades:** Future utility includes spending GAME for faster training or specialized character evolutions.
