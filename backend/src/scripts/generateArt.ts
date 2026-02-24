import { ethers } from 'ethers';
import { processArtGeneration, batchProcessArt } from '../services/artGenerator';
import { testPinataConnection } from '../services/ipfsManager';
import dotenv from 'dotenv';

dotenv.config();

const GameCharacterABI = require('../../../artifacts/contracts/GameCharacter.sol/GameCharacter.json').abi;

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  npm run generate-art <tokenId>           # Generate for single token');
        console.log('  npm run generate-art all                 # Generate for all tokens');
        console.log('  npm run generate-art batch 1,2,3,4,5    # Generate for multiple tokens');
        console.log('  npm run generate-art test                # Test connection');
        return;
    }

    // Test connections
    console.log('Testing connections...\n');
    const pinataOk = await testPinataConnection();
    if (!pinataOk) {
        console.error('❌ Pinata connection failed. Check API keys.');
        return;
    }

    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    const gameCharacter = new ethers.Contract(
        process.env.GAME_CHARACTER_ADDRESS!,
        GameCharacterABI,
        provider
    );

    // Handle different commands
    const command = args[0];

    if (command === 'test') {
        console.log('✅ All connections working!');
        return;
    }

    if (command === 'all') {
        // Get total supply and process all
        const totalSupply = await gameCharacter.totalSupply();
        const tokenIds: string[] = [];

        for (let i = 1; i <= Number(totalSupply); i++) {
            // Check if art already generated
            const artMetadata = await gameCharacter.artMetadata(i);
            if (!artMetadata.isGenerated) {
                tokenIds.push(i.toString());
            }
        }

        console.log(`Found ${tokenIds.length} tokens without art`);

        if (tokenIds.length === 0) {
            console.log('All tokens already have art generated!');
            return;
        }

        await batchProcessArt(tokenIds);
    } else if (command === 'batch') {
        const tokenIds = args[1].split(',').map(id => id.trim());
        console.log(`Processing ${tokenIds.length} tokens...`);
        await batchProcessArt(tokenIds);
    } else {
        // Single token
        const tokenId = args[0];
        await processArtGeneration(tokenId);
    }

    console.log('\n✅ Done!');
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
