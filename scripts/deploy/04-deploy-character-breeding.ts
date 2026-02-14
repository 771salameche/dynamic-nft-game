import * as fs from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { task } from "hardhat/config"; // Import task

task("deploy:character-breeding", "Deploys the CharacterBreeding contract").setAction(async (_, hre) => {
  const { ethers, network } = hre;
  console.log("Deploying CharacterBreeding...");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");
  let deployments = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf8")
  );

  const networkDeployments = deployments[network.name];

  if (!networkDeployments || !networkDeployments.GameCharacter || !networkDeployments.GameToken) {
    throw new Error("GameCharacter and GameToken addresses not found in deployments/deployments.json for the current network.");
  }

  const vrfCoordinator = process.env.VRF_COORDINATOR;
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID;
  const keyHash = process.env.VRF_KEY_HASH;

  if (!vrfCoordinator || !subscriptionId || !keyHash) {
    throw new Error("VRF_COORDINATOR, VRF_SUBSCRIPTION_ID, and VRF_KEY_HASH must be set in your .env file.");
  }

  const CharacterBreeding = await ethers.getContractFactory("CharacterBreeding");
  const characterBreeding = await CharacterBreeding.deploy(
    vrfCoordinator,
    networkDeployments.GameCharacter,
    networkDeployments.GameToken,
    subscriptionId,
    keyHash
  );

  await characterBreeding.waitForDeployment();
  const address = await characterBreeding.getAddress();

  console.log("CharacterBreeding deployed to:", address);

  if (!deployments[network.name]) {
    deployments[network.name] = {};
  }
  deployments[network.name].CharacterBreeding = address;
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );

  console.log("CharacterBreeding address saved to deployments/deployments.json");
});
