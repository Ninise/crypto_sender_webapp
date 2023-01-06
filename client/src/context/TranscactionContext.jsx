import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer,
  );

  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState('');
  const [formData, setFormData] = useState({
    addressTo: '',
    amount: '',
    keyword: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem('transactionCount'),
  );

  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => {
      return { ...prevState, [name]: e.target.value };
    });
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert('Please install metamask');
      const transactionContract = getEthereumContract();
      const availableTransactions =
        await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000,
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amout: parseInt(transaction.amount._hex) / 10 ** 10,
        }),
      );

      setTransactions(structuredTransactions);
      console.log(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert('Please install metamask');

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setConnectedAccount(accounts[0]);

        getAllTransactions();
      } else {
        setConnectedAccount('');
        console.log('No accounts found');
      }
    } catch (error) {
      console.log(error);

      throw new Error('No ETH object.');
    }
  };

  const chekcIfTransactionExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount =
        await transactionContract().getTransactionCount();

      window.localStorage.setItem('transactionCount', transactionCount);
    } catch (error) {}
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert('Please install metamask');

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      setConnectedAccount(accounts[0]);
    } catch (error) {
      console.log(error);

      throw new Error('No ETH object.');
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert('Please install metamask');

      const { addressTo, amount, keyword, message } = formData;

      const transactionContract = getEthereumContract();

      const parsedAmout = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: connectedAccount,
            to: addressTo,
            gas: '0x5208', // 21000 GWEI
            value: parsedAmout._hex,
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmout,
        message,
        keyword,
      );

      setIsLoading(true);
      console.log(`Loading: ${transactionHash.hash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success: ${transactionHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount();

      setTransactionCount(transactionCount.toNumber());

      window.reload();
    } catch (error) {
      console.log(error);

      throw new Error('No ETH object.');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    chekcIfTransactionExist();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        sendTransaction,
        handleChange,
        transactions,
      }}>
      {children}
    </TransactionContext.Provider>
  );
};
