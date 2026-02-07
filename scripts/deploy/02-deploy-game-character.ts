import { ethers, upgrades, network, run } from "hardhat";
import { saveDeployment } from "../utils/save-deployment";
import { GameCharacter } from "../../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`Deploying GameCharacter on ${networkName} with account: ${deployer.address}`);

  const TOKEN_NAME = "GameCharacter";
  const TOKEN_SYMBOL = "GC";

  // VRF Parameters (should be configured in .env or a config file)
  const vrfCoordinator = process.env.VRF_COORDINATOR || "0x0000000000000000000000000000000000000000";
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID || "0";
  const keyHash = process.env.VRF_KEY_HASH || "0x0000000000000000000000000000000000000000000000000000000000000000";

  const GameCharacterFactory = await ethers.getContractFactory("GameCharacter");

  // Deploy Proxy
  console.log("Deploying GameCharacter proxy...");
  const gameCharacter = (await upgrades.deployProxy(
    GameCharacterFactory,
    [TOKEN_NAME, TOKEN_SYMBOL, vrfCoordinator, subscriptionId, keyHash],
    {
      initializer: "initialize",
      kind: "uups",
      constructorArgs: [vrfCoordinator],
    }
  )) as unknown as GameCharacter;

  await gameCharacter.waitForDeployment();
  const proxyAddress = await gameCharacter.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`GameCharacter Proxy deployed to: ${proxyAddress}`);
  console.log(`GameCharacter Implementation deployed to: ${implementationAddress}`);

  // Save Deployment
  const artifact = await ethers.getContractFactory("GameCharacter");
  await saveDeployment(
    networkName,
    "GameCharacter",
    proxyAddress,
    artifact.interface.formatJson(),
    implementationAddress
  );

  // Verification (only on non-local networks)
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    await gameCharacter.deploymentTransaction()?.wait(5);

    console.log("Verifying implementation...");
    try {
      await run("verify:verify", {
        address: implementationAddress,
      });
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;