import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { processArtGeneration, isArtGenerated } from '../services/artGenerator';

dotenv.config();

const GameCharacterABI = require('../../../artifacts/contracts/GameCharacter.sol/GameCharacter.json').abi;

/**
 * Backfill script to generate art for any tokens that don't yet have metadata.
 *
 * Usage:
 *   # Generate art for all missing tokens
 *   npm run backfill-art all
 *
 *   # Generate art for a specific range [from,to]
 *   npm run backfill-art range 1 100
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npm run backfill-art all');
    console.log('  npm run backfill-art range <fromTokenId> <toTokenId>');
    process.exit(0);
  }

  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
  const gameCharacter = new ethers.Contract(
    process.env.GAME_CHARACTER_ADDRESS!,
    GameCharacterABI,
    provider
  );

  const command = args[0];

  let from = 1;
  let to: number;

  if (command === 'range') {
    if (args.length < 3) {
      console.error('Usage: npm run backfill-art range <fromTokenId> <toTokenId>');
      process.exit(1);
    }
    from = parseInt(args[1], 10);
    to = parseInt(args[2], 10);
  } else if (command === 'all') {
    const totalSupply = await gameCharacter.totalSupply();
    to = Number(totalSupply);
  } else {
    console.error('Unknown command. Use "all" or "range".');
    process.exit(1);
  }

  if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
    console.error('Invalid range. Ensure from >= 1 and to >= from.');
    process.exit(1);
  }

  console.log(`Backfilling art for tokens ${from} to ${to} (inclusive)...`);

  let processed = 0;
  for (let tokenId = from; tokenId <= to; tokenId++) {
    try {
      const generated = await isArtGenerated(tokenId);
      if (generated) {
        continue;
      }

      console.log(`Token #${tokenId} has no art, processing...`);
      await processArtGeneration(String(tokenId));
      processed++;

      // Small delay to avoid hammering AI/IPFS providers
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err: any) {
      console.error(`Failed to process token #${tokenId}:`, err?.message || err);
    }
  }

  console.log(`\nDone. Generated art for ${processed} tokens.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

