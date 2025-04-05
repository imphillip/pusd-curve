require("@nomicfoundation/hardhat-toolbox");
//require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //solidity: "0.8.20",
  solidity: "0.8.28",
  networks: {
    bsc: {
      url: process.env.BSC_RPC,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 56
    }
  },
  bscTestnet: {
    url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    accounts: [`0x${process.env.PRIVATE_KEY}`],
    chainId: 97,
  }
};
