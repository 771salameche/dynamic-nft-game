import { ethers, upgrades } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("Deploying ArtGenerator...");

    // Load existing deployments
    const deploymentsPath = "deployments/amoy.json";
    if (!fs.existsSync(deploymentsPath)) {
        console.error(`Deployments file not found at ${deploymentsPath}`);
        process.exit(1);
    }
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Deploy ArtGenerator
    const ArtGenerator = await ethers.getContractFactory("ArtGenerator");
    const artGenerator = await ArtGenerator.deploy(deployments.GameCharacter);
    await artGenerator.waitForDeployment();

    const artGeneratorAddress = await artGenerator.getAddress();
    console.log("ArtGenerator deployed to:", artGeneratorAddress);

    // Save deployment
    deployments.ArtGenerator = artGeneratorAddress;
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

    console.log("\n=== Post-Deployment Configuration ===");

    // 1. Set ArtGenerator in GameCharacter
    console.log("1. Setting ArtGenerator in GameCharacter...");
    const GameCharacter = await ethers.getContractAt(
        "GameCharacter",
        deployments.GameCharacter
    );

    const tx1 = await GameCharacter.setArtGeneratorContract(artGeneratorAddress);
    await tx1.wait();
    console.log("✓ ArtGenerator set in GameCharacter");

    // 2. Set backend service as authorized fulfiller
    console.log("2. Setting authorized fulfiller...");
    const backendAddress = process.env.BACKEND_WALLET_ADDRESS;
    if (!backendAddress) {
        console.log("⚠️  BACKEND_WALLET_ADDRESS not set in .env");
        console.log("   You'll need to run this manually:");
        console.log(`   artGenerator.setAuthorizedFulfiller("YOUR_BACKEND_ADDRESS")`);
    } else {
        const tx2 = await artGenerator.setAuthorizedFulfiller(backendAddress);
        await tx2.wait();
        console.log(`✓ Authorized fulfiller set to: ${backendAddress}`);
    }

    console.log("\n=== Deployment Complete ===");
    console.log("Next steps:");
    console.log("1. Verify contract on Polygonscan");
    console.log("2. Update backend .env with ART_GENERATOR_ADDRESS");
    console.log("3. Start the mint listener: npm run listen:mint");
    console.log("4. Test by minting a character");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
