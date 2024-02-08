/* eslint-disable @typescript-eslint/no-var-requires */
require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: 'hardhat',
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
  sourcify: {
    enabled: false,
  },
  networks: {
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    polygon: {
      url:
        'https://polygon-mainnet.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    arbitrumOne: {
      url:
        'https://arbitrum-mainnet.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    optimisticEthereum: {
      url:
        'https://optimism-mainnet.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    gnosis: {
      url: 'https://gnosis-mainnet.public.blastapi.io',
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    bsc: {
      url: 'https://bsc-mainnet.public.blastapi.io',
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    avalanche: {
      url:
        'https://avalanche-mainnet.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    sepolia: {
      url: 'https://sepolia.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    polygonMumbai: {
      url:
        'https://polygon-mumbai.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    arbitrumSepolia: {
      chainId: 421614,
      url:
        'https://arbitrum-sepolia.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    optimisticSepolia: {
      chainId: 11155420,
      url:
        'https://optimism-sepolia.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    base: {
      chainId: 8453,
      url: 'https://base-mainnet.public.blastapi.io',
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    linea: {
      chainId: 59144,
      url:
        'https://linea-mainnet.infura.io/v3/' +
        process.env.NEXT_PUBLIC_INFURA_ID,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    metis: {
      chainId: 1088,
      url: 'https://metis-mainnet.public.blastapi.io',
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    polygonZkEvm: {
      chainId: 1101,
      url: 'https://polygon-zkevm-mainnet.public.blastapi.io',
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    zkSync: {
      chainId: 324,
      url: 'https://mainnet.era.zksync.io',
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      arbitrumOne: process.env.ARBITRUMSCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISMSCAN_API_KEY,
      gnosis: process.env.GNOSISSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      avalanche: 'avalanche',
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      arbitrumSepolia: process.env.ARBITRUMSCAN_API_KEY,
      optimisticSepolia: process.env.OPTIMISMSCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
      linea: process.env.LINEASCAN_API_KEY,
      metis: 'metis',
      polygonZkEvm: process.env.POLYGONSCAN_API_KEY,
      zkSync: 'zkSync',
    },
    customChains: [
      {
        network: 'avalanche',
        chainId: 43114,
        urls: {
          apiURL:
            'https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan',
          browserURL: 'https://snowtrace.io',
        },
      },
      {
        network: 'arbitrumSepolia',
        chainId: 421614,
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io',
        },
      },
      {
        network: 'optimisticSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimistic.etherscan.io/api',
          browserURL: 'https://sepolia-optimism.etherscan.io',
        },
      },
      {
        network: 'linea',
        chainId: 59144,
        urls: {
          apiURL: 'https://api.lineascan.build/api',
          browserURL: 'https://lineascan.build',
        },
      },
      {
        network: 'metis',
        chainId: 1088,
        urls: {
          apiURL:
            'https://api.routescan.io/v2/network/mainnet/evm/1088/etherscan',
          browserURL: 'https://andromeda-explorer.metis.io',
        },
      },
      {
        network: 'zkSync',
        chainId: 324,
        urls: {
          apiURL: 'https://block-explorer-api.mainnet.zksync.io/api',
          browserURL: 'https://explorer.zksync.io',
        },
      },
    ],
  },
}
