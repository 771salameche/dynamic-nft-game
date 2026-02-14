import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Full Game Flow Integration", function () {
  let gameCharacter;
  let gameToken;
  let staking;
  let breeding;
  let tracker;
  let trigger;
  let vrfCoordinatorMock;
  
  let owner, player1, player2;
  const subscriptionId = 1;
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    
    // Deploy VRF Mock
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(
      ethers.parseEther("0.1"),
      1e9
    );
    await vrfCoordinatorMock.createSubscription();
    await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("100"));

    // Deploy core tokens and NFT
    const GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy(owner.address);
    
    const GameCharacter = await ethers.getContractFactory("GameCharacter");
    gameCharacter = await upgrades.deployProxy(GameCharacter, [
      "Dynamic Heroes", "HERO", await vrfCoordinatorMock.getAddress(), subscriptionId, keyHash
    ], { 
      initializer: 'initialize', 
      unsafeAllow: ['constructor', 'state-variable-immutable'],
      constructorArgs: [await vrfCoordinatorMock.getAddress()]
    });
    await vrfCoordinatorMock.addConsumer(subscriptionId, await gameCharacter.getAddress());

    // Deploy mechanics
    const CharacterStaking = await ethers.getContractFactory("CharacterStaking");
    staking = await CharacterStaking.deploy(await gameCharacter.getAddress(), await gameToken.getAddress());
    
    const CharacterBreeding = await ethers.getContractFactory("CharacterBreeding");
    breeding = await CharacterBreeding.deploy(
        await vrfCoordinatorMock.getAddress(),
        await gameCharacter.getAddress(),
        await gameToken.getAddress(),
        subscriptionId,
        keyHash
    );
    await vrfCoordinatorMock.addConsumer(subscriptionId, await breeding.getAddress());

    // Deploy achievement system
    const AchievementTracker = await ethers.getContractFactory("AchievementTracker");
    tracker = await AchievementTracker.deploy(await gameToken.getAddress(), await gameCharacter.getAddress());
    
    const AchievementTrigger = await ethers.getContractFactory("AchievementTrigger");
    trigger = await AchievementTrigger.deploy(
        await tracker.getAddress(), 
        await gameCharacter.getAddress(), 
        await staking.getAddress()
    );
    
    // Setup achievement system links
    await gameCharacter.setAchievementTrigger(await trigger.getAddress());
    await staking.setAchievementTrigger(await trigger.getAddress());
    await breeding.setAchievementTrigger(await trigger.getAddress());
    
    // Authorize triggers
    await tracker.addAuthorizedAddress(await trigger.getAddress());
    await trigger.setAuthorizedCaller(await gameCharacter.getAddress(), true);
    await trigger.setAuthorizedCaller(await staking.getAddress(), true);
    await trigger.setAuthorizedCaller(await breeding.getAddress(), true);
    await trigger.setAuthorizedCaller(owner.address, true);

    // Permissions
    await gameToken.addMinter(owner.address);
    await gameToken.addMinter(await tracker.getAddress());
    await gameToken.addMinter(await staking.getAddress());
    
    await gameCharacter.addAuthorizedAddress(await breeding.getAddress());
    await gameCharacter.addAuthorizedAddress(owner.address);
    await gameCharacter.addAuthorizedAddress(await tracker.getAddress());

    // Setup Achievements in Tracker
    await tracker.addAchievement("First Steps", "Mint first char", "Collection", 1, 0, ethers.parseEther("10"));
    for (let i = 2; i <= 18; i++) {
        await tracker.addAchievement("Achievement " + i, "Desc", "Misc", 1, 0, 0);
    }
  });
  
  it("Complete user journey: mint -> level up -> stake -> breed", async function () {
    // 2. Mint character (to owner then transfer to player1 to trigger achievement)
    const mintTx = await gameCharacter.mintCharacter("Warrior");
    const receipt = await mintTx.wait();
    const requestId = receipt.logs.find(l => l.fragment && l.fragment.name === 'MintRequested').args[0];
    await vrfCoordinatorMock.fulfillRandomWords(requestId, await gameCharacter.getAddress());

    // Transfer to player1
    await gameCharacter.transferFrom(owner.address, player1.address, 1);
    expect(await gameCharacter.ownerOf(1)).to.equal(player1.address);
    
    // Wait, the achievement check happens in mintCharacter(msg.sender).
    // So the achievement is for owner. Let's check for owner.
    const ach = await tracker.playerAchievements(owner.address, 1);
    expect(ach.isUnlocked).to.be.true;
    expect(await gameToken.balanceOf(owner.address) >= ethers.parseEther("10")).to.be.true;

    // 3. Level up (as owner or authorized)
    await gameCharacter.gainExperience(1, 100);
    let traits = await gameCharacter.getCharacterTraits(1);
    expect(traits.level).to.equal(2n);
    
    // 4. Stake
    await gameCharacter.connect(player1).approve(await staking.getAddress(), 1);
    await staking.connect(player1).stake(1);
    
    await time.increase(86400 + 1);
    
    // 5. Claim rewards
    const rewards = await staking.calculateRewards(player1.address);
    expect(rewards > 0).to.be.true;
    await staking.connect(player1).claimRewards();
    expect(await gameToken.balanceOf(player1.address) >= rewards).to.be.true;
    
    // 6. Breed
    // Mint parent 2
    const mintTx2 = await gameCharacter.mintCharacter("Mage");
    const receipt2 = await mintTx2.wait();
    const requestId2 = receipt2.logs.find(l => l.fragment && l.fragment.name === 'MintRequested').args[0];
    await vrfCoordinatorMock.fulfillRandomWords(requestId2, await gameCharacter.getAddress());
    await gameCharacter.transferFrom(owner.address, player1.address, 2);
    
    await staking.connect(player1).unstake(1);
    
    const cost = await breeding.breedingCost();
    await gameToken.mint(player1.address, cost);
    await gameToken.connect(player1).approve(await breeding.getAddress(), cost);
    
    const breedTx = await breeding.connect(player1).breed(1, 2);
    const breedReceipt = await breedTx.wait();
    const breedLog = breedReceipt.logs.find(l => l.fragment && l.fragment.name === 'BreedingRequested');
    const breedRequestId = breedLog.args[0];
    console.log("Breeding Request ID:", breedRequestId.toString());
    
    // Fulfill breeding VRF
    await vrfCoordinatorMock.fulfillRandomWords(breedRequestId, await breeding.getAddress());
    
    const player1Balance = await gameCharacter.balanceOf(player1.address);
    console.log("Player 1 Balance after breeding:", player1Balance.toString());
    
    const offspringId = 3;
    console.log("Checking owner of token:", offspringId);
    expect(await gameCharacter.ownerOf(offspringId)).to.equal(player1.address);
    const offspring = await gameCharacter.getCharacterTraits(3);
    expect(offspring.generation).to.equal(2n);
  });

  it("Achievement unlock flow", async function () {
    // Add achievement
    await tracker.addAchievement(
      "First Steps",
      "Mint your first character",
      "Collection",
      1, // Bronze
      50,
      ethers.parseEther("10")
    );
    
    // Manual unlock
    await tracker.addAuthorizedAddress(owner.address);
    await tracker.unlockAchievement(player1.address, 1, 0); // tokenId 0 means no XP reward
    
    const playerAch = await tracker.playerAchievements(player1.address, 1);
    expect(playerAch.isUnlocked).to.be.true;
    
    const tokenBalance = await gameToken.balanceOf(player1.address);
    expect(tokenBalance).to.equal(ethers.parseEther("10"));
  });
  
  it("Gas usage for common operations", async function () {
    const tx1 = await gameCharacter.mintCharacter("Warrior");
    const receipt1 = await tx1.wait();
    console.log("Mint gas used:", receipt1.gasUsed.toString());
    
    await gameCharacter.transferFrom(owner.address, player1.address, 1);
    
    await gameCharacter.connect(player1).approve(await staking.getAddress(), 1);
    const tx2 = await staking.connect(player1).stake(1);
    const receipt2 = await tx2.wait();
    console.log("Stake gas used:", receipt2.gasUsed.toString());
    
    await time.increase(86400);
    const tx3 = await staking.connect(player1).claimRewards();
    const receipt3 = await tx3.wait();
    console.log("Claim rewards gas used:", receipt3.gasUsed.toString());
  });
});
