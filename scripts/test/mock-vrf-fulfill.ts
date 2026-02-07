import { ethers, network } from "hardhat";
import { GameCharacter } from "../../typechain-types";

/**
 * @title Mock VRF Fulfill
 * @dev Manually triggers fulfillRandomWords on a mock coordinator or simulate it for local testing.
 * 
 * Note: Since fulfillRandomWords is internal override in GameCharacter, 
 * we must call it THROUGH the VRF Coordinator. 
 * If using VRFCoordinatorV2Mock, we call its fulfillRandomWords.
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // This script usually expects a VRFCoordinatorV2Mock to be deployed locally.
    // If you are testing locally, you should have deployed the mock.
    
    const mockCoordinatorAddress = process.env.VRF_COORDINATOR_MOCK;
    const requestId = process.env.REQUEST_ID;

    if (!mockCoordinatorAddress || !requestId) {
        console.error("Please set VRF_COORDINATOR_MOCK and REQUEST_ID environment variables.");
        console.log("Example: VRF_COORDINATOR_MOCK=0x... REQUEST_ID=1 npx hardhat run scripts/test/mock-vrf-fulfill.ts --network localhost");
        return;
    }

    const gameCharacterAddress = (require("../../deployments/hardhat/GameCharacter.json")).address;
    
    console.log(`Mocking fulfillment for Request ID: ${requestId}`);
    console.log(`Coordinator Mock: ${mockCoordinatorAddress}`);
    console.log(`Consumer (GameCharacter): ${gameCharacterAddress}`);

    // We assume VRFCoordinatorV2Mock interface
    const vrfMock = await ethers.getContractAt("VRFCoordinatorV2Mock", mockCoordinatorAddress);

    console.log("Triggering fulfillRandomWords...");
    const tx = await vrfMock.fulfillRandomWords(requestId, gameCharacterAddress);
    await tx.wait(1);

    console.log("Fulfillment triggered successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
