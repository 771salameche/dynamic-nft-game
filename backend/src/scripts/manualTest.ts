/**
 * Manual Test Script — Triggers the full art generation pipeline for a specific Token ID.
 * Usage: npx ts-node src/scripts/manualTest.ts <tokenId>
 */

import { processArtGeneration } from '../services/artGenerator';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const tokenId = process.argv[2];

    if (!tokenId) {
        console.error('Usage: npx ts-node src/scripts/manualTest.ts <tokenId>');
        process.exit(1);
    }

    console.log(`🚀 Starting manual test for Token #${tokenId}...`);

    try {
        await processArtGeneration(tokenId);
        console.log(`\n✨ Success! Art generation completed for Token #${tokenId}`);
    } catch (error: any) {
        console.error(`\n❌ Test failed:`, error.message);
        process.exit(1);
    }
}

main();
