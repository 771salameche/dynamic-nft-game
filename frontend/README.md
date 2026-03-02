## Dynamic NFT Frontend

This is the Next.js 16 frontend for the Dynamic NFT Game. It connects to the on-chain `GameCharacter` contract on Polygon Amoy and lets players mint characters, stake, breed, and interact with quests/achievements.

### Configure public mint on Polygon Amoy

The `GameCharacter` contract exposes a public mint function:

- `mintCharacter(uint8 classType) external payable`
  - `classType = 0` → Warrior
  - `classType = 1` → Mage
  - `classType = 2` → Rogue

The mint price, sale toggle, max supply, and treasury are controlled on-chain via:

- `setMintConfig(uint256 mintPrice, bool publicMintEnabled, uint256 maxSupply, address treasury)`

#### 1. Upgrade proxy and set mint config (Hardhat task)

From the repo root:

```bash
npx hardhat upgrade:game-character-mint \
  --network amoy \
  --proxy 0x095c03b93ceFadb99Ea93c2b0EEDc4d9B4DB1cF0 \
  --mint-price "0.01" \
  --max-supply 0 \
  --treasury 0xYourTreasuryAddress
```

- `--mint-price` is in MATIC (converted to wei on-chain).
- `--max-supply 0` means unlimited supply; set a number to cap.
- `--treasury` receives the mint funds (defaults to deployer if omitted).

This task:

- Upgrades the UUPS proxy to the latest `GameCharacter` implementation.
- Calls `setMintConfig` with the provided values.

#### 2. Frontend env for Polygon Amoy

In `frontend/.env.local` make sure you point to the deployed contracts:

```bash
NEXT_PUBLIC_GAME_CHARACTER_ADDRESS=0x095c03b93ceFadb99Ea93c2b0EEDc4d9B4DB1cF0
NEXT_PUBLIC_STAKING_ADDRESS=0x...
NEXT_PUBLIC_BREEDING_ADDRESS=0x...
NEXT_PUBLIC_ACHIEVEMENT_ADDRESS=0x...
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../dynamic-nft-game/version/latest
```

The mint UI assumes a `mintPrice` of `0.01` MATIC by default (see `useGameCharacter.ts`). If you change `mintPrice` on-chain, update that constant or switch to reading `mintPrice` via `useReadContract`.

### Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and connect a wallet on Polygon Amoy to start minting.***
