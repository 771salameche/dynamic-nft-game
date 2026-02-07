import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-chai-matchers";
import { 
    CharacterStaking, 
    GameCharacter, 
    GameToken,
    GameCharacter__factory,
    GameToken__factory,
    CharacterStaking__factory 
} from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CharacterStaking Unit Tests", function () {
    let staking: CharacterStaking;
    let gameCharacter: GameCharacter;
    let gameToken: GameToken;
    
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    
    const BASE_REWARD_RATE = ethers.parseEther("10"); // 10 tokens per day
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // 1. Deploy VRF Coordinator Mock
        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        const vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(ethers.parseEther("0.1"), 1000000000);
        const coordinatorAddress = await vrfCoordinatorMock.getAddress();

        // 2. Deploy GameToken
        const GameTokenFactory = await ethers.getContractFactory("GameToken") as GameToken__factory;
        gameToken = await GameTokenFactory.deploy(owner.address);
        const tokenAddress = await gameToken.getAddress();

        // 3. Deploy GameCharacter (UUPS)
        const GameCharacterFactory = await ethers.getContractFactory("GameCharacter") as GameCharacter__factory;
        gameCharacter = (await upgrades.deployProxy(
            GameCharacterFactory, 
            ["GameCharacter", "GC", coordinatorAddress, 1, KEY_HASH], 
            {
                initializer: "initialize",
                kind: "uups",
                constructorArgs: [coordinatorAddress],
                unsafeAllow: ["constructor", "state-variable-immutable"]
            }
        )) as unknown as GameCharacter;
        const characterAddress = await gameCharacter.getAddress();

        // 4. Setup VRF Subscription
        await vrfCoordinatorMock.createSubscription();
        await vrfCoordinatorMock.fundSubscription(1, ethers.parseEther("10"));
        await vrfCoordinatorMock.addConsumer(1, characterAddress);

        // 5. Deploy CharacterStaking
        const CharacterStakingFactory = await ethers.getContractFactory("CharacterStaking") as CharacterStaking__factory;
        staking = await CharacterStakingFactory.deploy(characterAddress, tokenAddress);
        const stakingAddress = await staking.getAddress();

        // 6. Setup Roles
        await gameToken.addMinter(stakingAddress);
        
        // 7. Mint some characters for testing
        await gameCharacter.mintCharacter("Warrior"); // ID 1
        await gameCharacter.mintCharacter("Mage");    // ID 2
        await gameCharacter.transferFrom(owner.address, addr1.address, 1);
        await gameCharacter.transferFrom(owner.address, addr1.address, 2);
    });

    describe("Staking Operations", function () {
        it("Should stake NFT successfully", async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await expect(staking.connect(addr1).stake(1))
                .to.emit(staking, "Staked")
                .withArgs(addr1.address, 1, anyValue);
            
            expect(await gameCharacter.ownerOf(1)).to.equal(await staking.getAddress());
            expect(await staking.tokenOwner(1)).to.equal(addr1.address);
        });

        it("Should revert if not NFT owner", async function () {
            await expect(staking.connect(addr2).stake(1))
                .to.be.revertedWith("Not the owner of the token");
        });

        it("Should revert if NFT not approved", async function () {
            await expect(staking.connect(addr1).stake(1))
                .to.be.reverted; // Standard ERC721 error for not authorized
        });

        it("Should update stake mappings correctly", async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await staking.connect(addr1).stake(1);
            
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes.length).to.equal(1);
            expect(stakes[0].tokenId).to.equal(1n);
        });
    });

    describe("Unstaking Operations", function () {
        beforeEach(async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await staking.connect(addr1).stake(1);
        });

        it("Should unstake NFT successfully", async function () {
            await expect(staking.connect(addr1).unstake(1))
                .to.emit(staking, "Unstaked")
                .withArgs(addr1.address, 1, anyValue);
            
            expect(await gameCharacter.ownerOf(1)).to.equal(addr1.address);
            expect(await staking.tokenOwner(1)).to.equal(ethers.ZeroAddress);
        });

        it("Should claim rewards before unstaking", async function () {
            // Increase time by 2 days
            await time.increase(2 * 24 * 60 * 60);
            
            const initialBalance = await gameToken.balanceOf(addr1.address);
            await staking.connect(addr1).unstake(1);
            const finalBalance = await gameToken.balanceOf(addr1.address);
            
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Reward Calculation", function () {
        beforeEach(async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await staking.connect(addr1).stake(1);
        });

        it("Should calculate rewards for single staked NFT after minStakeTime", async function () {
            await time.increase(2 * 24 * 60 * 60); // 2 days
            
            const rewards = await staking.calculateRewards(addr1.address);
            // 2 days * 10 tokens/day = 20 tokens
            expect(rewards).to.be.closeTo(ethers.parseEther("20"), ethers.parseEther("0.1"));
        });

        it("Should apply level multipliers correctly", async function () {
            // Set level 1 multiplier to 150%
            await staking.setLevelMultiplier(1, 150);
            
            await time.increase(1 * 24 * 60 * 60 + 1); // 1 day + buffer
            
            const rewards = await staking.calculateRewards(addr1.address);
            // 1 day * 10 tokens * 1.5 = 15 tokens
            expect(rewards).to.be.closeTo(ethers.parseEther("15"), ethers.parseEther("0.1"));
        });

        it("Should return 0 rewards if minStakeTime not met", async function () {
            await time.increase(12 * 60 * 60); // 12 hours (min is 1 day)
            expect(await staking.calculateRewards(addr1.address)).to.equal(0n);
        });
    });

    describe("Claiming Rewards", function () {
        beforeEach(async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await staking.connect(addr1).stake(1);
            await time.increase(2 * 24 * 60 * 60); // 2 days
        });

        it("Should claim rewards successfully", async function () {
            const initialBalance = await gameToken.balanceOf(addr1.address);
            await expect(staking.connect(addr1).claimRewards())
                .to.emit(staking, "RewardsClaimed");
            
            const finalBalance = await gameToken.balanceOf(addr1.address);
            expect(finalBalance - initialBalance).to.be.closeTo(ethers.parseEther("20"), ethers.parseEther("0.1"));
        });

        it("Should reset pending rewards after claim", async function () {
            await staking.connect(addr1).claimRewards();
            expect(await staking.calculateRewards(addr1.address)).to.equal(0n);
        });
    });

    describe("Multiple Stakes", function () {
        it("Should handle staking multiple NFTs and combined rewards", async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 2);
            
            await staking.connect(addr1).stake(1);
            await staking.connect(addr1).stake(2);
            
            await time.increase(1 * 24 * 60 * 60); // 1 day
            
            const rewards = await staking.calculateRewards(addr1.address);
            // 2 NFTs * 10 tokens/day = 20 tokens
            expect(rewards).to.be.closeTo(ethers.parseEther("20"), ethers.parseEther("0.1"));
        });
    });

    describe("Edge Cases", function () {
        it("Should handle emergency withdraw", async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await staking.connect(addr1).stake(1);
            
            await expect(staking.connect(addr1).emergencyWithdraw(1))
                .to.emit(staking, "Unstaked");
            
            expect(await gameCharacter.ownerOf(1)).to.equal(addr1.address);
            // Balance should be 0 because emergencyWithdraw doesn't claim
            expect(await gameToken.balanceOf(addr1.address)).to.equal(0n);
        });

        it("Should prevent staking same NFT twice", async function () {
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await staking.connect(addr1).stake(1);
            
            await expect(staking.connect(addr1).stake(1))
                .to.be.reverted; // ERC721 owner check will fail since contract owns it
        });
    });

    describe("Access Control & Pausing", function () {
        it("Should allow owner to update reward rate", async function () {
            const newRatePerDay = ethers.parseEther("20") * 24n * 60n * 60n; // Incorrect but for test coverage
            // baseRewardRate = newRatePerDay / 1 days = 20 * 24*60*60 / 24*60*60 = 20 tokens per second actually
            // The contract says: baseRewardRate = newRatePerDay / 1 days;
            // If I want 20 tokens per day, I should pass 20 tokens.
            const rate20TokensPerDay = ethers.parseEther("20");
            await expect(staking.setRewardRate(rate20TokensPerDay))
                .to.emit(staking, "RewardRateUpdated");
        });

        it("Should prevent non-owner from updating reward rate", async function () {
            await expect(staking.connect(addr1).setRewardRate(ethers.parseEther("20")))
                .to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        it("Should pause/unpause staking", async function () {
            await staking.pause();
            expect(await staking.paused()).to.be.true;
            
            await gameCharacter.connect(addr1).approve(await staking.getAddress(), 1);
            await expect(staking.connect(addr1).stake(1))
                .to.be.revertedWithCustomError(staking, "EnforcedPause");
                
            await staking.unpause();
            await expect(staking.connect(addr1).stake(1)).to.not.be.reverted;
        });
    });
});

const anyValue = () => true;