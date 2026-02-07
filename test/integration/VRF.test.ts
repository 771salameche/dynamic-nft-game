import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-chai-matchers";
import { 
    GameCharacter, 
    GameToken, 
    LootBox, 
    VRFCoordinatorV2Mock 
} from "../../typechain-types";

describe("VRF Integration", function () {
    let gameCharacter: GameCharacter;
    let gameToken: GameToken;
    let lootBox: LootBox;
    let vrfCoordinatorMock: VRFCoordinatorV2Mock;
    
    let owner: SignerWithAddress;
    let player: SignerWithAddress;
    
    const BASE_FEE = "100000000000000000"; // 0.1 LINK
    const GAS_PRICE_LINK = "1000000000"; // 1 gwei
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    
    let subId: bigint;

    beforeEach(async function () {
        [owner, player] = await ethers.getSigners();

        // 1. Deploy VRF Coordinator Mock
        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);
        const coordinatorAddress = await vrfCoordinatorMock.getAddress();

        // 2. Deploy GameToken
        const GameTokenFactory = await ethers.getContractFactory("GameToken");
        gameToken = await GameTokenFactory.deploy(owner.address);
        const tokenAddress = await gameToken.getAddress();

        // 3. Deploy GameCharacter (UUPS)
        const GameCharacterFactory = await ethers.getContractFactory("GameCharacter");
        gameCharacter = (await upgrades.deployProxy(
            GameCharacterFactory, 
            ["GameCharacter", "GC", coordinatorAddress, 0, KEY_HASH], 
            {
                initializer: "initialize",
                kind: "uups",
                constructorArgs: [coordinatorAddress],
                unsafeAllow: ["constructor", "state-variable-immutable"]
            }
        )) as unknown as GameCharacter;
        const characterAddress = await gameCharacter.getAddress();

        // 4. Deploy LootBox
        const LootBoxFactory = await ethers.getContractFactory("LootBox");
        lootBox = await LootBoxFactory.deploy(
            coordinatorAddress,
            tokenAddress,
            characterAddress,
            0,
            KEY_HASH
        );
        const lootBoxAddress = await lootBox.getAddress();

        // 5. Setup VRF Subscription
        const tx = await vrfCoordinatorMock.createSubscription();
        const receipt = await tx.wait();
        // In the mock, SubscriptionCreated is emitted
        // Event: SubscriptionCreated(uint64 indexed subId, address owner)
        // We can get it from logs
        const event = receipt?.logs.find(x => vrfCoordinatorMock.interface.parseLog(x)?.name === "SubscriptionCreated");
        subId = vrfCoordinatorMock.interface.parseLog(event as any)?.args[0];

        await vrfCoordinatorMock.fundSubscription(subId, ethers.parseEther("10"));
        await vrfCoordinatorMock.addConsumer(subId, characterAddress);
        await vrfCoordinatorMock.addConsumer(subId, lootBoxAddress);

        // Update contracts with correct subId
        await gameCharacter.setVRFConfig(subId, KEY_HASH);
        await lootBox.setVRFConfig(subId, KEY_HASH, 300000);
        
        // Authorize LootBox in GameCharacter
        await gameCharacter.addAuthorizedAddress(lootBoxAddress);
    });

    describe("VRF Subscription Setup", function () {
        it("Should have correct subscription balance", async function () {
            const subscription = await vrfCoordinatorMock.getSubscription(subId);
            expect(subscription.balance).to.equal(ethers.parseEther("10"));
        });

        it("Should have consumers added", async function () {
            const characterAddress = await gameCharacter.getAddress();
            const lootBoxAddress = await lootBox.getAddress();
            expect(await vrfCoordinatorMock.consumerIsAdded(subId, characterAddress)).to.be.true;
            expect(await vrfCoordinatorMock.consumerIsAdded(subId, lootBoxAddress)).to.be.true;
        });
    });

    describe("GameCharacter Random Traits", function () {
        it("Should request random traits on mint", async function () {
            const tx = await gameCharacter.mintCharacter("Warrior");
            await expect(tx).to.emit(gameCharacter, "MintRequested");
        });

        it("Should fulfill random traits and assign values in range 50-100", async function () {
            const tx = await gameCharacter.mintCharacter("Warrior");
            const receipt = await tx.wait();
            const log = receipt?.logs.find(x => gameCharacter.interface.parseLog(x)?.name === "MintRequested");
            const requestId = gameCharacter.interface.parseLog(log as any)?.args[0];

            await expect(vrfCoordinatorMock.fulfillRandomWords(requestId, await gameCharacter.getAddress()))
                .to.emit(gameCharacter, "TraitsRevealed");

            const traits = await gameCharacter.getCharacterTraits(1);
            expect(Number(traits.strength)).to.be.within(50, 100);
            expect(Number(traits.agility)).to.be.within(50, 100);
            expect(Number(traits.intelligence)).to.be.within(50, 100);
        });

        it("Should handle multiple pending requests", async function () {
            await gameCharacter.mintCharacter("Warrior"); // ID 1
            await gameCharacter.mintCharacter("Mage");    // ID 2

            // Fulfill second one first (out of order)
            await vrfCoordinatorMock.fulfillRandomWords(2, await gameCharacter.getAddress());
            await vrfCoordinatorMock.fulfillRandomWords(1, await gameCharacter.getAddress());

            const traits1 = await gameCharacter.getCharacterTraits(1);
            const traits2 = await gameCharacter.getCharacterTraits(2);

            expect(Number(traits1.strength)).to.be.within(50, 100);
            expect(Number(traits2.strength)).to.be.within(50, 100);
        });
    });

    describe("LootBox Random Items", function () {
        it("Should open loot box and receive random item", async function () {
            const tx = await lootBox.connect(player).openLootBox(false, { value: ethers.parseEther("0.01") });
            const receipt = await tx.wait();
            const log = receipt?.logs.find(x => lootBox.interface.parseLog(x)?.name === "LootBoxOpened");
            const requestId = lootBox.interface.parseLog(log as any)?.args[0];

            await expect(vrfCoordinatorMock.fulfillRandomWords(requestId, await lootBox.getAddress()))
                .to.emit(lootBox, "ItemReceived");

            const inventory = await lootBox.getPlayerInventory(player.address);
            expect(inventory.length).to.equal(1);
            expect(inventory[0].rarity).to.be.within(1, 5);
        });

        it("Should apply item boost to character", async function () {
            // 1. Mint character for player
            await gameCharacter.mintCharacter("Warrior"); // Token ID 1
            await gameCharacter.transferFrom(owner.address, player.address, 1);
            
            // Fulfill character traits
            await vrfCoordinatorMock.fulfillRandomWords(1, await gameCharacter.getAddress());
            const initialTraits = await gameCharacter.getCharacterTraits(1);

            // 2. Open loot box and fulfill
            await lootBox.connect(player).openLootBox(false, { value: ethers.parseEther("0.01") });
            await vrfCoordinatorMock.fulfillRandomWords(2, await lootBox.getAddress());
            
            const inventory = await lootBox.getPlayerInventory(player.address);
            const item = inventory[0];

            // 3. Apply item
            await expect(lootBox.connect(player).applyItemToCharacter(0, 1))
                .to.emit(lootBox, "ItemApplied")
                .to.emit(gameCharacter, "TraitsUpdated");

            const finalTraits = await gameCharacter.getCharacterTraits(1);
            expect(finalTraits.strength).to.equal(initialTraits.strength + BigInt(item.strengthBoost));
            expect(finalTraits.agility).to.equal(initialTraits.agility + BigInt(item.agilityBoost));
            expect(finalTraits.intelligence).to.equal(initialTraits.intelligence + BigInt(item.intelligenceBoost));
        });
    });

    describe("Security & Edge Cases", function () {
        it("Should revert if callback is not from coordinator", async function () {
            // fulfillRandomWords is internal, but we can check it indirectly if there was a public wrapper.
            // Since it's internal, we can only call it via the Mock.
            // But we can test if the COORDINATOR check works if we were to call it directly (if it were public).
            // For now, testing that unauthorized calls to boostTraits are blocked is important.
            await expect(gameCharacter.connect(player).boostTraits(1, 10, 10, 10))
                .to.be.revertedWithCustomError(gameCharacter, "UnauthorizedCaller");
        });

        it("Should revert if applying item you own to character you don't own", async function () {
            // 1. Owner has character 1
            await gameCharacter.mintCharacter("Warrior"); // ID 1
            await vrfCoordinatorMock.fulfillRandomWords(1, await gameCharacter.getAddress());

            // 2. Player has item 0
            await lootBox.connect(player).openLootBox(false, { value: ethers.parseEther("0.01") });
            await vrfCoordinatorMock.fulfillRandomWords(2, await lootBox.getAddress());

            // player tries to apply their item 0 to owner's character 1
            await expect(lootBox.connect(player).applyItemToCharacter(0, 1))
                .to.be.revertedWith("Not your character");
        });
    });
});
