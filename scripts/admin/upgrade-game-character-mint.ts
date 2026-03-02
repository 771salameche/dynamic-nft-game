import { task } from "hardhat/config";
import { GameCharacter } from "../../typechain-types";
import { join } from "path";
import * as fs from "fs";

/**
 * Hardhat task to upgrade the GameCharacter proxy to the latest implementation
 * and configure public minting (mintPrice, publicMintEnabled, maxSupply, treasury).
 *
 * Example (Polygon Amoy):
 *   npx hardhat upgrade:game-character-mint \\
 *     --network amoy \\
 *     --proxy 0x095c03b93ceFadb99Ea93c2b0EEDc4d9B4DB1cF0 \\
 *     --mint-price "0.01" \\
 *     --max-supply 0 \\
 *     --treasury 0xYourTreasuryAddress
 */
task("upgrade:game-character-mint", "Upgrade GameCharacter and configure public minting")
  .addParam("proxy", "Proxy address of the GameCharacter contract")
  .addParam("mintPrice", "Mint price in MATIC (e.g. 0.01)")
  .addOptionalParam("maxSupply", "Maximum supply (0 = unlimited)", "0")
  .addOptionalParam("treasury", "Treasury address to receive funds", "")
  .setAction(async (args, hre) => {
    const { ethers, upgrades, network } = hre;
    const [deployer] = await ethers.getSigners();

    const proxyAddress = args.proxy as string;
    const mintPriceMatic = args.mintPrice as string;
    const maxSupply = BigInt(args.maxSupply || "0");
    const treasury = (args.treasury as string) || deployer.address;

    console.log(`Upgrading GameCharacter on ${network.name} with account: ${deployer.address}`);
    console.log(`Proxy:        ${proxyAddress}`);
    console.log(`Mint price:   ${mintPriceMatic} MATIC`);
    console.log(`Max supply:   ${maxSupply === 0n ? "unlimited" : maxSupply.toString()}`);
    console.log(`Treasury:     ${treasury}`);

    const GameCharacterFactory = await ethers.getContractFactory("GameCharacter");

    console.log("Upgrading proxy to latest GameCharacter implementation...");
    const upgraded = (await upgrades.upgradeProxy(proxyAddress, GameCharacterFactory, {
      unsafeAllow: ["constructor", "state-variable-immutable"],
    })) as unknown as GameCharacter;
    await upgraded.waitForDeployment();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`New implementation: ${implementationAddress}`);

    // Configure mint settings
    const mintPriceWei = ethers.parseEther(mintPriceMatic);
    console.log("Calling setMintConfig...");
    const tx = await upgraded.setMintConfig(mintPriceWei, true, maxSupply, treasury);
    await tx.wait();

    console.log("Mint config set:");
    console.log(`  mintPrice:        ${await upgraded.mintPrice()} wei`);
    console.log(`  publicMintEnabled:${await upgraded.publicMintEnabled()}`);
    console.log(`  maxSupply:        ${await upgraded.maxSupply()}`);
    console.log(`  treasury:         ${await upgraded.treasury()}`);
  });

