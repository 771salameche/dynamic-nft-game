import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying GameToken with the account:", deployer.address);

  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy(deployer.address);

  await gameToken.waitForDeployment();

  console.log("GameToken deployed to:", await gameToken.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
