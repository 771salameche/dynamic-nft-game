import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Starting SmartQuestEngine deployment...");

    const network = "amoy";
    const deploymentsPath = path.join(__dirname, "../../deployments/deployments.json");

    if (!fs.existsSync(deploymentsPath)) {
        console.error(`❌ Deployments file not found at ${deploymentsPath}`);
        process.exit(1);
    }

    const allDeployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    const deployments = allDeployments[network];

    if (!deployments || !deployments.GameCharacter || !deployments.GameToken) {
        console.error(`❌ GameCharacter or GameToken address missing for network ${network}`);
        process.exit(1);
    }

    const [deployer] = await ethers.getSigners();
    console.log("👷 Deploying with account:", deployer.address);
    console.log("📍 GameCharacter:", deployments.GameCharacter);
    console.log("📍 GameToken:", deployments.GameToken);

    // Deploy SmartQuestEngine
    console.log("\n📦 Deploying SmartQuestEngine...");
    const SmartQuestEngine = await ethers.getContractFactory("SmartQuestEngine");
    const smartQuestEngine = await SmartQuestEngine.deploy(
        deployments.GameCharacter,
        deployments.GameToken
    );
    await smartQuestEngine.waitForDeployment();

    const smartQuestEngineAddress = await smartQuestEngine.getAddress();
    console.log("✅ SmartQuestEngine deployed to:", smartQuestEngineAddress);

    // Save deployment
    allDeployments[network].SmartQuestEngine = smartQuestEngineAddress;
    fs.writeFileSync(deploymentsPath, JSON.stringify(allDeployments, null, 2));
    console.log("📝 Deployment address saved to deployments/deployments.json");

    console.log("\n=== Post-Deployment Configuration ===");

    // Set the authorized generator (backend wallet)
    const backendAddress = process.env.BACKEND_WALLET_ADDRESS;
    if (!backendAddress) {
        console.log("⚠️  BACKEND_WALLET_ADDRESS not set in .env");
        console.log("   Defaulting authorized generator to deployer.");
        console.log("   Remember to call setAuthorizedGenerator via the Admin subagent later.");
    } else {
        console.log(`👤 Setting authorized generator to: ${backendAddress}`);
        const tx = await smartQuestEngine.setAuthorizedGenerator(backendAddress);
        await tx.wait();
        console.log("✅ Authorized generator set successfully.");
    }

    console.log("\n✨ Deployment Complete!");
    console.log("Next steps:");
    console.log(`1. npx hardhat verify --network amoy ${smartQuestEngineAddress} ${deployments.GameCharacter} ${deployments.GameToken}`);
    console.log("2. Update backend .env with SMART_QUEST_ENGINE_ADDRESS");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
