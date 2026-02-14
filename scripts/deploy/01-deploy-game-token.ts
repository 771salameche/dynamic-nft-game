import { saveDeployment } from "../utils/save-deployment";
import { task } from "hardhat/config"; // Import task

task("deploy:game-token", "Deploys the GameToken contract").setAction(async (_, hre) => {
  const { ethers, network, run } = hre;
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`Deploying GameToken on ${networkName} with account: ${deployer.address}`);

  const GameTokenFactory = await ethers.getContractFactory("GameToken");
  const gameToken = await GameTokenFactory.deploy(deployer.address);

  await gameToken.waitForDeployment();
  const address = await gameToken.getAddress();

  console.log(`GameToken deployed to: ${address}`);

  // Save Deployment
  await saveDeployment(
    networkName,
    "GameToken",
    address,
    GameTokenFactory.interface.formatJson()
  );

  // Verification
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    await gameToken.deploymentTransaction()?.wait(5);

    console.log("Verifying contract...");
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [deployer.address],
      });
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }
});
