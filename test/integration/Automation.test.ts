import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-chai-matchers";
import { 
    GameCharacter, 
    GameToken, 
    CharacterStaking, 
    DailyQuest,
    VRFCoordinatorV2Mock 
} from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Chainlink Automation Integration", function () {
    let gameCharacter: GameCharacter;
    let gameToken: GameToken;
    let staking: CharacterStaking;
    let dailyQuest: DailyQuest;
    let vrfCoordinatorMock: VRFCoordinatorV2Mock;
    
    let owner: SignerWithAddress;
    let player: SignerWithAddress;
    
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const UPDATE_INTERVAL = 24 * 60 * 60; // 1 day

    beforeEach(async function () {
        [owner, player] = await ethers.getSigners();

        // 1. Deploy VRF Coordinator Mock
        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(ethers.parseEther("0.1"), 1000000000);
        const coordinatorAddress = await vrfCoordinatorMock.getAddress();

        // 2. Deploy GameToken
        const GameTokenFactory = await ethers.getContractFactory("GameToken");
        gameToken = await GameTokenFactory.deploy(owner.address);
        const tokenAddress = await gameToken.getAddress();

        // 3. Deploy GameCharacter (UUPS)
        const GameCharacterFactory = await ethers.getContractFactory("GameCharacter");
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

        // 4. Deploy CharacterStaking
        const CharacterStakingFactory = await ethers.getContractFactory("CharacterStaking");
        staking = await CharacterStakingFactory.deploy(characterAddress, tokenAddress);
        const stakingAddress = await staking.getAddress();

        // 5. Deploy DailyQuest
        const DailyQuestFactory = await ethers.getContractFactory("DailyQuest");
        dailyQuest = await DailyQuestFactory.deploy(
            coordinatorAddress,
            characterAddress,
            tokenAddress,
            1, // subId
            KEY_HASH
        );
        const dailyQuestAddress = await dailyQuest.getAddress();

        // 6. Setup VRF
        await vrfCoordinatorMock.createSubscription();
        await vrfCoordinatorMock.fundSubscription(1, ethers.parseEther("10"));
        await vrfCoordinatorMock.addConsumer(1, characterAddress);
        await vrfCoordinatorMock.addConsumer(1, dailyQuestAddress);

        // 7. Setup Roles & Config
        await gameCharacter.setStakingContract(stakingAddress);
        await gameToken.addMinter(dailyQuestAddress);
        await gameCharacter.addAuthorizedAddress(dailyQuestAddress);
    });

    describe("GameCharacter Passive XP Automation", function () {
        beforeEach(async function () {
            // Mint and setup for player
            await gameCharacter.mintCharacter("Warrior"); // ID 1
            await vrfCoordinatorMock.fulfillRandomWords(1, await gameCharacter.getAddress());
            await gameCharacter.transferFrom(owner.address, player.address, 1);
            
            // Enable Auto XP
            await gameCharacter.connect(player).enableAutoXP(1);
        });

        it("Should return upkeepNeeded = false when interval not passed", async function () {
            const [upkeepNeeded] = await gameCharacter.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.false;
        });

        it("Should return upkeepNeeded = true when interval passed", async function () {
            await time.increase(UPDATE_INTERVAL + 1);
            const [upkeepNeeded] = await gameCharacter.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.true;
        });

        it("Should not grant XP if character is not staked", async function () {
            await time.increase(UPDATE_INTERVAL + 1);
            const initialTraits = await gameCharacter.getCharacterTraits(1);
            
            await gameCharacter.performUpkeep("0x");
            
            const finalTraits = await gameCharacter.getCharacterTraits(1);
            expect(finalTraits.experience).to.equal(initialTraits.experience);
        });

        it("Should grant XP if character is staked", async function () {
            // Stake first
            await gameCharacter.connect(player).approve(await staking.getAddress(), 1);
            await staking.connect(player).stake(1);

            await time.increase(UPDATE_INTERVAL + 1);
            const initialTraits = await gameCharacter.getCharacterTraits(1);
            
            await expect(gameCharacter.performUpkeep("0x"))
                .to.emit(gameCharacter, "PassiveXPGranted")
                .withArgs(1, anyValue);
            
            const finalTraits = await gameCharacter.getCharacterTraits(1);
            expect(finalTraits.experience).to.be.gt(initialTraits.experience);
        });

        it("Should update lastUpdateTimestamp after performUpkeep", async function () {
            await time.increase(UPDATE_INTERVAL + 1);
            const oldTimestamp = await gameCharacter.lastUpdateTimestamp();
            
            await gameCharacter.performUpkeep("0x");
            
            const newTimestamp = await gameCharacter.lastUpdateTimestamp();
            expect(newTimestamp).to.be.gt(oldTimestamp);
        });
    });

    describe("DailyQuest Automation & Functionality", function () {
        it("Should request new quest via automation", async function () {
            await time.increase(UPDATE_INTERVAL + 1);
            
            // performUpkeep triggers VRF request
            await expect(dailyQuest.performUpkeep("0x"))
                .to.emit(dailyQuest, "UpkeepExecuted");
        });

        it("Should generate new quest after VRF fulfillment", async function () {
            await time.increase(UPDATE_INTERVAL + 1);
            await dailyQuest.performUpkeep("0x");
            
            // Request ID for first quest in this test context is 1 (if no other VRF calls made yet)
            // But to be safe we check events.
            await expect(vrfCoordinatorMock.fulfillRandomWords(1, await dailyQuest.getAddress()))
                .to.emit(dailyQuest, "QuestGenerated");
            
            const activeQuests = await dailyQuest.getActiveQuests();
            expect(activeQuests.length).to.equal(1);
            expect(activeQuests[0].isActive).to.be.true;
            expect(activeQuests[0].expiresAt).to.be.gt(await time.latest());
        });

        it("Should deactivate previous quest when new one generated", async function () {
            // 1. Generate first quest
            await time.increase(UPDATE_INTERVAL + 1);
            await dailyQuest.performUpkeep("0x");
            await vrfCoordinatorMock.fulfillRandomWords(1, await dailyQuest.getAddress());
            const firstQuestId = (await dailyQuest.getActiveQuests())[0].questId;

            // 2. Generate second quest
            await time.increase(UPDATE_INTERVAL + 1);
            await dailyQuest.performUpkeep("0x");
            await vrfCoordinatorMock.fulfillRandomWords(2, await dailyQuest.getAddress());
            
            const quest1 = await dailyQuest.quests(firstQuestId);
            expect(quest1.isActive).to.be.false;
        });

        it("Should complete quest and grant rewards", async function () {
            // Setup: Generate quest
            await time.increase(UPDATE_INTERVAL + 1);
            await dailyQuest.performUpkeep("0x");
            await vrfCoordinatorMock.fulfillRandomWords(1, await dailyQuest.getAddress());
            
            // Setup: Character for player
            await gameCharacter.mintCharacter("Warrior"); // ID 2 (1 was used in prev suite)
            // Note: Token IDs are sequential across suites if sharing provider, but we use beforeEach.
            // Actually beforeEach redeploys everything, so ID will be 1.
            const charId = 1; 
            await vrfCoordinatorMock.fulfillRandomWords(2, await gameCharacter.getAddress());
            await gameCharacter.transferFrom(owner.address, player.address, charId);

            const initialXP = (await gameCharacter.getCharacterTraits(charId)).experience;
            const initialTokenBalance = await gameToken.balanceOf(player.address);
            
            const activeQuests = await dailyQuest.getActiveQuests();
            const questId = activeQuests[0].questId;

            await expect(dailyQuest.connect(player).completeQuest(questId, charId))
                .to.emit(dailyQuest, "QuestCompleted")
                .withArgs(player.address, questId, charId);

            const finalXP = (await gameCharacter.getCharacterTraits(charId)).experience;
            const finalTokenBalance = await gameToken.balanceOf(player.address);

            expect(finalXP).to.be.gt(initialXP);
            expect(finalTokenBalance).to.be.gt(initialTokenBalance);
        });

        it("Should prevent double completion", async function () {
            await time.increase(UPDATE_INTERVAL + 1);
            await dailyQuest.performUpkeep("0x");
            await vrfCoordinatorMock.fulfillRandomWords(1, await dailyQuest.getAddress());
            
            await gameCharacter.mintCharacter("Warrior");
            await vrfCoordinatorMock.fulfillRandomWords(2, await gameCharacter.getAddress());
            
            const questId = (await dailyQuest.getActiveQuests())[0].questId;
            
            await dailyQuest.completeQuest(questId, 1);
            await expect(dailyQuest.completeQuest(questId, 1))
                .to.be.revertedWith("Already completed");
        });
    });
});

const anyValue = () => true;
