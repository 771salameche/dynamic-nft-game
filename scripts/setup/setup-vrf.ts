import { ethers, network } from "hardhat";
import { VRFCoordinatorV2Interface, LinkTokenInterface } from "../../typechain-types";

/**
 * @title Setup VRF Subscription
 * @dev Creates a VRF subscription, adds the GameCharacter contract as a consumer, and funds it with LINK.
 * 
 * Instructions for Chainlink UI:
 * 1. Visit https://vrf.chain.link/polygon-amoy
 * 2. Connect your wallet.
 * 3. You can also manage subscriptions manually there if this script fails.
 */

async function main() {
    const networkName = network.name;
    if (networkName === "hardhat" || networkName === "localhost") {
        console.warn("This script is intended for live networks (e.g., Amoy). For local testing, use mock scripts.");
    }

    const [deployer] = await ethers.getSigners();
    console.log(`Setting up VRF with account: ${deployer.address}`);

    // Addresses for Polygon Amoy
    const VRF_COORDINATOR_ADDR = process.env.VRF_COORDINATOR || "0x343300b5d8659fd90177391D129e07866c1ee064";
    const LINK_TOKEN_ADDR = process.env.LINK_TOKEN || "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904";
    
    // Get GameCharacter deployment
    const gameCharacterDeployment = require("../../deployments/hardhat/GameCharacter.json");
    const gameCharacterAddress = gameCharacterDeployment.address;

    if (!gameCharacterAddress) {
        throw new Error("GameCharacter address not found in deployments. Please deploy it first.");
    }

    console.log(`Target GameCharacter contract: ${gameCharacterAddress}`);

    const vrfCoordinator = await ethers.getContractAt(
        "VRFCoordinatorV2Interface",
        VRF_COORDINATOR_ADDR
    ) as unknown as VRFCoordinatorV2Interface;

    const linkToken = await ethers.getContractAt(
        "LinkTokenInterface",
        LINK_TOKEN_ADDR
    ) as unknown as LinkTokenInterface;

    // 1. Create Subscription
    console.log("Creating VRF subscription...");
    const createSubTx = await vrfCoordinator.createSubscription();
    const createSubReceipt = await createSubTx.wait(1);
    
    // In ethers v6, we look for logs. VRFCoordinatorV2 has a SubscriptionCreated event.
    // Event: SubscriptionCreated(uint64 indexed subId, address owner)
    const subId = (createSubReceipt as any).logs[0].args[0];
    console.log(`Subscription created! ID: ${subId}`);

    // 2. Add Consumer
    console.log(`Adding GameCharacter (${gameCharacterAddress}) as consumer to sub ${subId}...`);
    const addConsumerTx = await vrfCoordinator.addConsumer(subId, gameCharacterAddress);
    await addConsumerTx.wait(1);
    console.log("Consumer added successfully.");

    // 3. Fund Subscription
    const fundAmount = ethers.parseEther("2"); // 2 LINK
    console.log(`Funding subscription ${subId} with ${ethers.formatEther(fundAmount)} LINK...`);
    
    // LINK tokens use 'transferAndCall' to fund VRF subscriptions
    const fundTx = await linkToken.transferAndCall(
        VRF_COORDINATOR_ADDR,
        fundAmount,
        ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [subId])
    );
    await fundTx.wait(1);
    console.log("Subscription funded successfully.");

    console.log("
VRF Setup Complete!");
    console.log("-------------------");
    console.log(`Subscription ID: ${subId}`);
    console.log(`Coordinator:     ${VRF_COORDINATOR_ADDR}`);
    console.log(`LINK Token:      ${LINK_TOKEN_ADDR}`);
    console.log("-------------------");
    console.log("IMPORTANT: Update your .env file with VRF_SUBSCRIPTION_ID=" + subId);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
