// Script to get ABI-encoded constructor arguments

const { ethers } = require("ethers");

// Constructor arguments
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const pusdAddress = "0x980e9171873a5D77cD14ca4F3d45528B432c341b";

// ABI for the constructor
const constructorAbi = [
  "constructor(address _usdt, address _pusd)"
];

// Encode the constructor arguments
const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "address"],
  [usdtAddress, pusdAddress]
);

console.log("ABI-encoded constructor arguments:");
console.log(encodedArgs);
