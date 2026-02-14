import * as fs from "fs";
import { join } from "path";
import { task } from "hardhat/config"; // Import task

task("deploy:character-staking", "Deploys the CharacterStaking contract").setAction(async (_, hre) => {
  const { ethers, network } = hre;
  console.log("Deploying CharacterStaking...");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");
  let deployments = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf8")
  );

  const networkDeployments = deployments[network.name];

  if (!networkDeployments || !networkDeployments.GameCharacter || !networkDeployments.GameToken) {
    throw new Error("GameCharacter and GameToken addresses not found in deployments/deployments.json for the current network.");
  }

  const CharacterStaking = await ethers.getContractFactory("CharacterStaking");
  const characterStaking = await CharacterStaking.deploy(
    networkDeployments.GameCharacter,
    networkDeployments.GameToken
  );

  await characterStaking.waitForDeployment();
  const address = await characterStaking.getAddress();

  console.log("CharacterStaking deployed to:", address);

  if (!deployments[network.name]) {
    deployments[network.name] = {};
  }
  deployments[network.name].CharacterStaking = address;
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );

  console.log("CharacterStaking address saved to deployments/deployments.json");
});
