import { ethers, upgrades } from "hardhat";

async function analyzeGas() {
  const [owner] = await ethers.getSigners();
  console.log("=== Gas Usage Analysis ===\n");

  // Deploy Mock VRF
  const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrf = await VRFCoordinatorV2Mock.deploy(
    ethers.parseEther("0.1"),
    1e9
  );
  const vrfAddress = await vrf.getAddress();
  await vrf.createSubscription();
  await vrf.fundSubscription(1, ethers.parseEther("100"));

  // 1. Deploy Original
  console.log("Deploying Original GameCharacter...");
  const GameCharacter = await ethers.getContractFactory("GameCharacter");
  const original = await upgrades.deployProxy(GameCharacter, [
    "Original", "ORIG", vrfAddress, 1, "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
  ], { 
    initializer: 'initialize', 
    unsafeAllow: ['constructor', 'state-variable-immutable'], 
    constructorArgs: [vrfAddress] 
  });
  await original.waitForDeployment();
  await vrf.addConsumer(1, await original.getAddress());

  // 2. Deploy Optimized
  console.log("Deploying Optimized GameCharacter...");
  const GameCharacterOptimized = await ethers.getContractFactory("GameCharacterOptimized");
  const optimized = await upgrades.deployProxy(GameCharacterOptimized, [
    "Optimized", "OPT", vrfAddress, 1, "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
  ], { 
    initializer: 'initialize', 
    unsafeAllow: ['constructor', 'state-variable-immutable'], 
    constructorArgs: [vrfAddress] 
  });
  await optimized.waitForDeployment();
  await vrf.addConsumer(1, await optimized.getAddress());

  // Comparison tests
  console.log("\n--- Comparison (Gas Used) ---");

  // Mint
  const tx1o = await original.mintCharacter("Warrior");
  const receipt1o = await tx1o.wait();
  const tx1opt = await optimized.mintCharacter("Warrior");
  const receipt1opt = await tx1opt.wait();
  console.log(`Mint (Original):  ${receipt1o.gasUsed} gas`);
  console.log(`Mint (Optimized): ${receipt1opt.gasUsed} gas`);
  console.log(`Saving: ${receipt1o.gasUsed - receipt1opt.gasUsed} gas (${Math.round(Number(receipt1o.gasUsed - receipt1opt.gasUsed)/Number(receipt1o.gasUsed)*100)}%)`);

  // Gain XP
  await original.addAuthorizedAddress(owner.address);
  await optimized.addAuthorizedAddress(owner.address);
  
  const tx2o = await original.gainExperience(1, 100);
  const receipt2o = await tx2o.wait();
  const tx2opt = await optimized.gainExperience(1, 100);
  const receipt2opt = await tx2opt.wait();
  console.log(`\nLevel Up (Original):  ${receipt2o.gasUsed} gas`);
  console.log(`Level Up (Optimized): ${receipt2opt.gasUsed} gas`);
  console.log(`Saving: ${receipt2o.gasUsed - receipt2opt.gasUsed} gas (${Math.round(Number(receipt2o.gasUsed - receipt2opt.gasUsed)/Number(receipt2o.gasUsed)*100)}%)`);

  // Batch Mint (Optimized only)
  const tx3 = await optimized.batchMint("Warrior", 5);
  const receipt3 = await tx3.wait();
  console.log(`\nBatch Mint 5 (Optimized): ${receipt3.gasUsed} gas`);
  console.log(`Per mint in batch: ${receipt3.gasUsed / 5n} gas`);
}

analyzeGas().catch(console.error);
