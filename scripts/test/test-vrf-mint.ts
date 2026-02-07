import { ethers, network } from "hardhat";
import { GameCharacter } from "../../typechain-types";

/**
 * @title Test VRF Mint
 * @dev Mints a character, requests VRF traits, and waits for the callback.
 */

async function main() {
    const [owner] = await ethers.getSigners();
    console.log(`Testing VRF Mint with account: ${owner.address}`);

    // Get GameCharacter deployment
    const gameCharacterAddress = (require("../../deployments/hardhat/GameCharacter.json")).address;
    const gameCharacter = await ethers.getContractAt("GameCharacter", gameCharacterAddress) as unknown as GameCharacter;

    console.log(`GameCharacter at: ${gameCharacterAddress}`);

    // 1. Mint Character
    console.log("Minting character (Warrior)...");
    const mintTx = await gameCharacter.mintCharacter("Warrior");
    const mintReceipt = await mintTx.wait(1);

    // Get Request ID and Token ID from events
    // Event: MintRequested(uint256 indexed requestId, uint256 indexed tokenId)
    const mintRequestedEvent = mintReceipt?.logs.find(
        (log: any) => gameCharacter.interface.parseLog(log)?.name === "MintRequested"
    );

    if (!mintRequestedEvent) {
        throw new Error("MintRequested event not found");
    }

    const parsedLog = gameCharacter.interface.parseLog(mintRequestedEvent as any);
    const requestId = parsedLog?.args[0];
    const tokenId = parsedLog?.args[1];

    console.log(`Mint Requested! Request ID: ${requestId}, Token ID: ${tokenId}`);
    console.log("Waiting for VRF callback (this may take a few minutes on live networks)...");

    // 2. Listen for TraitsRevealed
    // Event: TraitsRevealed(uint256 indexed tokenId, uint256[3] traits)
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.error("Timeout waiting for VRF callback");
            resolve(false);
        }, 300000); // 5 minute timeout

        gameCharacter.on(gameCharacter.getEvent("TraitsRevealed"), (revealedTokenId, traits) => {
            if (revealedTokenId.toString() === tokenId.toString()) {
                clearTimeout(timeout);
                console.log("
Traits Revealed!");
                console.log(`Token ID: ${revealedTokenId}`);
                console.log(`Strength:     ${traits[0]}`);
                console.log(`Agility:      ${traits[1]}`);
                console.log(`Intelligence: ${traits[2]}`);
                
                const gasUsed = mintReceipt?.gasUsed || 0n;
                console.log(`
Mint Gas Used: ${gasUsed.toString()}`);
                resolve(true);
            }
        });
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
