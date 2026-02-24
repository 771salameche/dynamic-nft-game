import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Deploying SmartQuestEngine...");

    const deploymentsPath = path.join(__dirname, "../../deployments/amoy.json");
    if (!fs.existsSync(deploymentsPath)) {
        console.error(`❌ Deployment file not found at ${deploymentsPath}`);
        process.exit(1);
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with account:", deployer.address);

    // Deploy SmartQuestEngine
    const SmartQuestEngine = await ethers.getContractFactory("SmartQuestEngine");
    const questEngine = await SmartQuestEngine.deploy(
        deployments.GameCharacter,
        deployments.GameToken
    );
    await questEngine.waitForDeployment();

    const questEngineAddress = await questEngine.getAddress();
    console.log("✅ SmartQuestEngine deployed to:", questEngineAddress);

    // Save deployment
    deployments.SmartQuestEngine = questEngineAddress;
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

    console.log("\n=== Post-Deployment Configuration ===");

    // 1. Grant MINTER_ROLE to SmartQuestEngine on GameToken
    console.log("1. Granting MINTER_ROLE to SmartQuestEngine...");
    const GameToken = await ethers.getContractAt("GameToken", deployments.GameToken);
    // GameToken.sol uses addMinter based on the user's provided script
    const tx1 = await GameToken.addMinter(questEngineAddress);
    await tx1.wait();
    console.log("✓ MINTER_ROLE granted");

    // 2. Set backend as authorized generator
    console.log("2. Setting authorized generator...");
    // Using .env or hardcoded fallback for safety in script context
    const backendAddress = process.env.BACKEND_WALLET_ADDRESS || deployer.address;

    if (!process.env.BACKEND_WALLET_ADDRESS) {
        console.log("⚠️  BACKEND_WALLET_ADDRESS not set in .env, using deployer address as fallback.");
    }

    const tx2 = await questEngine.setAuthorizedGenerator(backendAddress);
    await tx2.wait();
    console.log(`✓ Authorized generator set to: ${backendAddress}`);

    console.log("\n=== Deployment Complete ===");
    console.log("Contract addresses:");
    console.log("SmartQuestEngine:", questEngineAddress);
    console.log("\nNext steps:");
    console.log(`1. npx hardhat verify --network amoy ${questEngineAddress} ${deployments.GameCharacter} ${deployments.GameToken}`);
    console.log("2. Update backend .env with SMART_QUEST_ENGINE_ADDRESS");
    console.log("3. Update frontend .env.local with NEXT_PUBLIC_SMART_QUEST_ENGINE_ADDRESS");
    console.log("4. Start quest listener: npm run listen:quests");
    console.log("5. Test by requesting a quest from frontend");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
