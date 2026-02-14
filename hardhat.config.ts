import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "dotenv/config";
import "./scripts/hardhat.tasks"; // Import the task definitions

// Ensure process.env.PRIVATE_KEY is only used if it's a non-empty string.
const privateKeyAccounts = (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "")
    ? [process.env.PRIVATE_KEY]
    : undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      // Local Hardhat Network
    },
    amoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "",
      accounts: privateKeyAccounts,
      chainId: 80002,
    },
    polygonMainnet: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "",
      accounts: privateKeyAccounts,
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      amoy: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 200000,
  },
};

export default config;