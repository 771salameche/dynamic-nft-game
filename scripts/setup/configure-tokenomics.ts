import { ethers, network } from "hardhat";
import { GameToken, CharacterStaking, TokenVesting } from "../../typechain-types";

/**
 * @title Configure Tokenomics
 * @dev Distributes GAME tokens according to the defined allocation and sets up vesting/staking.
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Configuring Tokenomics with account: ${deployer.address}`);

    // Deployment addresses (should be fetched from deployments or env)
    const GAME_TOKEN_ADDR = process.env.GAME_TOKEN_ADDRESS;
    const STAKING_ADDR = process.env.STAKING_ADDRESS;
    
    if (!GAME_TOKEN_ADDR || !STAKING_ADDR) {
        throw new Error("GAME_TOKEN_ADDRESS and STAKING_ADDRESS must be set in .env");
    }

    const gameToken = await ethers.getContractAt("GameToken", GAME_TOKEN_ADDR) as unknown as GameToken;
    const staking = await ethers.getContractAt("CharacterStaking", STAKING_ADDR) as unknown as CharacterStaking;

    // 1. Deploy Vesting Contract
    console.log("Deploying TokenVesting contract...");
    const TokenVestingFactory = await ethers.getContractFactory("TokenVesting");
    const vesting = await TokenVestingFactory.deploy(GAME_TOKEN_ADDR, deployer.address) as unknown as TokenVesting;
    await vesting.waitForDeployment();
    const vestingAddress = await vesting.getAddress();
    console.log(`TokenVesting deployed to: ${vestingAddress}`);

    // 2. Token Allocation (Total 1,000,000)
    const DECIMALS = 18n;
    const scale = 10n ** DECIMALS;
    
    const allocations = {
        treasury: 400_000n * scale,
        staking: 300_000n * scale,
        team: 150_000n * scale,
        liquidity: 100_000n * scale,
        community: 50_000n * scale
    };

    // Designated Wallets (Placeholders - update in .env)
    const wallets = {
        treasury: process.env.TREASURY_WALLET || deployer.address,
        team: process.env.TEAM_WALLET || deployer.address,
        liquidity: process.env.LIQUIDITY_WALLET || deployer.address,
        community: process.env.COMMUNITY_WALLET || deployer.address
    };

    // 3. Distribute Tokens
    console.log("
Starting Token Distribution...");

    // Treasury
    console.log(`Transferring ${ethers.formatUnits(allocations.treasury, 18)} to Treasury...`);
    await (await gameToken.transfer(wallets.treasury, allocations.treasury)).wait();

    // Liquidity
    console.log(`Transferring ${ethers.formatUnits(allocations.liquidity, 18)} to Liquidity Wallet...`);
    await (await gameToken.transfer(wallets.liquidity, allocations.liquidity)).wait();

    // Community
    console.log(`Transferring ${ethers.formatUnits(allocations.community, 18)} to Community Wallet...`);
    await (await gameToken.transfer(wallets.community, allocations.community)).wait();

    // Staking Pool (Fund the contract)
    console.log(`Funding Staking Contract with ${ethers.formatUnits(allocations.staking, 18)}...`);
    await (await gameToken.transfer(STAKING_ADDR, allocations.staking)).wait();
    
    // Grant MINTER_ROLE to Staking Contract (to allow minting additional rewards if pool exhausted or for inflation)
    console.log("Granting MINTER_ROLE to Staking Contract...");
    await (await gameToken.addMinter(STAKING_ADDR)).wait();

    // 4. Setup Team Vesting
    console.log(`
Setting up Team Vesting for ${wallets.team}...`);
    const startTime = Math.floor(Date.now() / 1000);
    const cliffDuration = 180 * 24 * 60 * 60; // 6 months
    const totalDuration = 365 * 24 * 60 * 60; // 12 months
    
    // Transfer team tokens to Vesting Contract first
    await (await gameToken.transfer(vestingAddress, allocations.team)).wait();
    
    // Create Schedule
    await (await vesting.createVestingSchedule(
        wallets.team,
        startTime,
        cliffDuration,
        totalDuration,
        allocations.team
    )).wait();
    console.log("Team Vesting Schedule created successfully.");

    // 5. Emission Projections
    console.log("
--- Token Emission Projection ---");
    const dailyBaseReward = 10n * scale; // From contract default
    console.log(`Current Daily Staking Reward: ${ethers.formatUnits(dailyBaseReward, 18)} GAME/NFT`);
    
    // Total supply in 1 year (assuming constant staking)
    // This is just a simulation output
    console.log("Projection: With 100 NFTs staked, annual emission would be ~365,000 GAME.");
    console.log("Staking pool (300k) would last approximately 10 months without additional minting.");
    console.log("---------------------------------
");

    console.log("Tokenomics configuration complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
