require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Ensure private key is properly formatted
const privateKey = process.env.PRIVATE_KEY || "";
if (!privateKey.startsWith("0x")) {
  throw new Error("Private key must start with 0x");
}
if (privateKey.length !== 66) { // 64 chars + "0x"
  throw new Error("Private key must be 64 characters long (not counting 0x prefix)");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: [privateKey],
      timeout: 60000, // 1 minute timeout
      gasPrice: "auto"
    },
    mainnet: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      chainId: 43114,
      accounts: [privateKey],
    }
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || ""
    }
  }
};
