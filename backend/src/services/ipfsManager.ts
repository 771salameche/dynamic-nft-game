import pinataSDK from '@pinata/sdk';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY!,
    pinataSecretApiKey: process.env.PINATA_SECRET_KEY!,
});

export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
    external_url?: string;
    animation_url?: string;
}

/**
 * Download image from URL and upload to IPFS
 */
export async function uploadImageToIPFS(
    imageUrl: string,
    tokenId: string
): Promise<string> {
    console.log(`Downloading image for token ${tokenId}...`);

    // Download image
    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Upload to IPFS
    console.log(`Uploading image to IPFS...`);
    const result = await pinata.pinFileToIPFS(buffer, {
        pinataMetadata: {
            name: `character-${tokenId}.png`,
        },
        pinataOptions: {
            cidVersion: 1,
        },
    });

    const ipfsHash = result.IpfsHash;
    console.log(`✓ Image uploaded to IPFS: ${ipfsHash}`);

    return ipfsHash;
}

/**
 * Upload base64 image to IPFS (for Stability AI)
 */
export async function uploadBase64ToIPFS(
    base64Data: string,
    tokenId: string
): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await pinata.pinFileToIPFS(buffer, {
        pinataMetadata: {
            name: `character-${tokenId}.png`,
        },
    });

    return result.IpfsHash;
}

/**
 * Create and upload NFT metadata JSON to IPFS
 */
export async function uploadMetadataToIPFS(
    metadata: NFTMetadata,
    tokenId: string
): Promise<string> {
    console.log(`Uploading metadata for token ${tokenId}...`);

    const result = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
            name: `character-${tokenId}-metadata.json`,
        },
    });

    const ipfsHash = result.IpfsHash;
    console.log(`✓ Metadata uploaded to IPFS: ${ipfsHash}`);

    return ipfsHash;
}

/**
 * Complete upload: image + metadata
 */
export async function uploadCompleteNFTData(
    imageUrl: string,
    tokenId: string,
    traits: any,
    aiPrompt: string
): Promise<{ metadataHash: string; imageHash: string }> {
    // 1. Upload image
    const imageHash = await uploadImageToIPFS(imageUrl, tokenId);

    // 2. Create metadata
    const metadata: NFTMetadata = {
        name: `Character #${tokenId}`,
        description: `Dynamic NFT Game Character - ${traits.characterClass}. AI-generated artwork based on character traits.`,
        image: `ipfs://${imageHash}`,
        attributes: [
            { trait_type: 'Class', value: traits.characterClass },
            { trait_type: 'Level', value: traits.level },
            { trait_type: 'Strength', value: traits.strength },
            { trait_type: 'Agility', value: traits.agility },
            { trait_type: 'Intelligence', value: traits.intelligence },
            { trait_type: 'Generation', value: traits.generation },
            { trait_type: 'Experience', value: traits.experience },
            { trait_type: 'AI Generated', value: 'Yes' },
            { trait_type: 'AI Prompt', value: aiPrompt },
        ],
        external_url: `https://yourgame.com/character/${tokenId}`,
    };

    // 3. Upload metadata
    const metadataHash = await uploadMetadataToIPFS(metadata, tokenId);

    return {
        metadataHash,
        imageHash,
    };
}

/**
 * Test IPFS connection
 */
export async function testPinataConnection(): Promise<boolean> {
    try {
        await pinata.testAuthentication();
        console.log('✓ Pinata connection successful');
        return true;
    } catch (error: any) {
        console.error('✗ Pinata connection failed:', error.message);
        return false;
    }
}
