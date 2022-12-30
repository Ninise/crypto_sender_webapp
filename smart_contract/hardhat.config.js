require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/XSaxQGOWQbNDPWTtEjCR_RTNepZHt1Ws',
      accounts: [
        'ea73561c5f5c4cf8b26673e72164b60766b63dc1a0d4aea296e1d71c816d5ab5',
      ],
    },
  },
};
