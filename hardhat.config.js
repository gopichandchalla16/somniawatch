require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const pk = process.env.PRIVATE_KEY;
const accounts = pk
  ? [pk.startsWith("0x") ? pk : `0x${pk}`]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    somnia_testnet: {
      url:      process.env.SOMNIA_RPC || "https://dream-rpc.somnia.network",
      chainId:  50312,
      accounts: accounts,
      gasPrice: "auto",
    },
  },
};
