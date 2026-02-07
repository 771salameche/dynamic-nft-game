import { ethers, network } from "hardhat";
import { VRFCoordinatorV2Interface, LinkTokenInterface } from "../../typechain-types";

/**
 * @title Fund VRF Subscription
 * @dev Funds an existing VRF subscription with LINK tokens and checks balance.
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    
    const subId = process.env.VRF_SUBSCRIPTION_ID;
    const VRF_COORDINATOR_ADDR = process.env.VRF_COORDINATOR || "0x343300b5d8659fd90177391D129e07866c1ee064";
    const LINK_TOKEN_ADDR = process.env.LINK_TOKEN || "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904";

    if (!subId) {
        throw new Error("Please set VRF_SUBSCRIPTION_ID in your .env file");
    }

    console.log(`Funding Subscription ID: ${subId}`);
    console.log(`Network: ${network.name}`);

    const vrfCoordinator = await ethers.getContractAt(
        "VRFCoordinatorV2Interface",
        VRF_COORDINATOR_ADDR
    ) as unknown as VRFCoordinatorV2Interface;

    const linkToken = await ethers.getContractAt(
        "LinkTokenInterface",
        LINK_TOKEN_ADDR
    ) as unknown as LinkTokenInterface;

    // Check current balance
    const subscription = await vrfCoordinator.getSubscription(subId);
    console.log(`Current Balance: ${ethers.formatEther(subscription.balance)} LINK`);

    const fundAmount = ethers.parseEther("1"); // Default 1 LINK
    console.log(`Funding with ${ethers.formatEther(fundAmount)} LINK...`);

    const fundTx = await linkToken.transferAndCall(
        VRF_COORDINATOR_ADDR,
        fundAmount,
        ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [subId])
    );
    await fundTx.wait(1);

    const newSubscription = await vrfCoordinator.getSubscription(subId);
    console.log(`New Balance: ${ethers.formatEther(newSubscription.balance)} LINK`);

    // Estimate requests (Amoy costs are roughly 0.1 LINK per request depending on premium)
    const estimatedCostPerRequest = 0.1; 
    const remainingRequests = parseFloat(ethers.formatEther(newSubscription.balance)) / estimatedCostPerRequest;
    console.log(`Estimated remaining requests: ~${remainingRequests.toFixed(1)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
