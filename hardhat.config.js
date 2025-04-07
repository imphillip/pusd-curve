require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-contract-sizer");

// Enable parallel compilation
const os = require('os');
const numCores = os.cpus().length;
const maxParallelCompilation = Math.max(1, numCores - 1); // Leave one core free for system tasks

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
        details: {
          yul: true,
          deduplicate: true,
          cse: true,
          constantOptimizer: true,
          orderLiterals: true
        }
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none"
      }
    }
  },
  networks: {
    bsc: {
      url: process.env.BSC_RPC,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 56
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  gasReporter: {
    enabled: false
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true
  },
  // Explicitly enable parallel compilation
  parallel: true,
  // Set the maximum number of parallel compilation jobs
  maxParallelCompilation: maxParallelCompilation,
  // Improve caching
  cacheHardhatCompilationSolcInput: true
};
