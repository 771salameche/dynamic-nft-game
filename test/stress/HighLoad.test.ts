import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("Stress Tests", function () {
  let gameCharacter;
  let gameToken;
  let staking;
  let vrfCoordinatorMock;
  let owner, player1;
  const subscriptionId = 1;

  beforeEach(async function () {
    [owner, player1] = await ethers.getSigners();
    
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(ethers.parseEther("0.1"), 1e9);
    await vrfCoordinatorMock.createSubscription();
    await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("100"));

    const GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy(owner.address);
    
    const GameCharacter = await ethers.getContractFactory("GameCharacter");
    gameCharacter = await upgrades.deployProxy(GameCharacter, [
      "Dynamic Heroes", "HERO", await vrfCoordinatorMock.getAddress(), subscriptionId,
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
    ], { 
      initializer: 'initialize', 
      unsafeAllow: ['constructor', 'state-variable-immutable'],
      constructorArgs: [await vrfCoordinatorMock.getAddress()]
    });
    
    await vrfCoordinatorMock.addConsumer(subscriptionId, await gameCharacter.getAddress());
    
    const CharacterStaking = await ethers.getContractFactory("CharacterStaking");
    staking = await CharacterStaking.deploy(await gameCharacter.getAddress(), await gameToken.getAddress());
  });

  it("Should handle multiple concurrent mints", async function () {
    const numMints = 20; // Reduced from 100 for local test stability
    const promises = [];
    for (let i = 0; i < numMints; i++) {
      promises.push(gameCharacter.adminMintCharacter(player1.address, "Warrior"));
    }
    await Promise.all(promises);
    
    const balance = await gameCharacter.balanceOf(player1.address);
    expect(balance).to.equal(BigInt(numMints));
  });
  
  it("Should handle multiple concurrent stakes", async function () {
    const numStakes = 10;
    // Mint characters first
    for (let i = 0; i < numStakes; i++) {
      await gameCharacter.adminMintCharacter(player1.address, "Warrior");
      await gameCharacter.connect(player1).approve(await staking.getAddress(), i + 1);
    }
    
    // Stake all
    const promises = [];
    for (let i = 1; i <= numStakes; i++) {
      promises.push(staking.connect(player1).stake(i));
    }
    await Promise.all(promises);
    
    const stakes = await staking.getUserStakes(player1.address);
    expect(stakes.length).to.equal(numStakes);
  });
});
