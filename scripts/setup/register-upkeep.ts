import { ethers, network } from "hardhat";
import { LinkTokenInterface } from "../../typechain-types";

/**
 * @title Register Chainlink Upkeep
 * @dev Programmatically registers a contract for Chainlink Automation.
 * 
 * Instructions for Chainlink UI:
 * 1. Visit https://automation.chain.link/polygon-amoy
 * 2. Click "Register new Upkeep"
 * 3. Choose "Custom logic"
 * 4. Enter your contract address (GameCharacter or DailyQuest)
 * 5. Set gas limit (e.g., 500,000) and starting LINK balance
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Registering Upkeep with account: ${deployer.address}`);

    const LINK_TOKEN_ADDR = process.env.LINK_TOKEN || "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904";
    const REGISTRAR_ADDR = process.env.AUTOMATION_REGISTRAR || "0x6968038890C0550B94101e149B897C8f621a6A11";
    
    // Target contract to automate
    const targetContract = process.env.UPKEEP_TARGET_CONTRACT;
    if (!targetContract) {
        throw new Error("Please set UPKEEP_TARGET_CONTRACT in your .env");
    }

    const linkToken = await ethers.getContractAt("LinkTokenInterface", LINK_TOKEN_ADDR) as unknown as LinkTokenInterface;

    // Registration parameters
    const name = "GameAutomation";
    const encryptedEmail = "0x"; // Not needed for programmatic
    const upkeepContract = targetContract;
    const gasLimit = 500000;
    const adminAddress = deployer.address;
    const checkData = "0x";
    const offchainConfig = "0x";
    const amount = ethers.parseEther("2"); // 2 LINK to start

    console.log(`Registering upkeep for ${upkeepContract}...`);

    // The Registrar expects 'registerAndPredictID' call via 'transferAndCall' from LINK token
    // Function signature for registerAndPredictID:
    // registerAndPredictID(string name, bytes encryptedEmail, address upkeepContract, uint32 gasLimit, address adminAddress, bytes checkData, bytes offchainConfig, uint96 amount)
    
    const ABI = [
        "function registerAndPredictID(string name, bytes encryptedEmail, address upkeepContract, uint32 gasLimit, address adminAddress, bytes checkData, bytes offchainConfig, uint96 amount) external"
    ];
    const registrarInterface = new ethers.Interface(ABI);
    
    const functionData = registrarInterface.encodeFunctionData("registerAndPredictID", [
        name,
        encryptedEmail,
        upkeepContract,
        gasLimit,
        adminAddress,
        checkData,
        offchainConfig,
        amount
    ]);

    console.log("Sending registration request via LINK transferAndCall...");
    const tx = await linkToken.transferAndCall(REGISTRAR_ADDR, amount, functionData);
    const receipt = await tx.wait(1);

    console.log("Upkeep registration requested!");
    console.log("Check the Chainlink Automation UI to see your new upkeep.");
    console.log("Transaction Hash:", receipt?.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
