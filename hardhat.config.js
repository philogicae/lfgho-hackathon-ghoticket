require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.23',
    settings: {
      evmVersion: 'shanghai',
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    sepolia: {
      url: 'https://sepolia.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
  },
}
