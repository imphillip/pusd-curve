import React, { useState, useEffect, createContext } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import Navbar from './components/Navbar';
import ExchangeInterface from './components/ExchangeInterface';

// Create a context for wallet data
export const WalletContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState('');

  // Initialize provider
  useEffect(() => {
    const init = async () => {
      try {
        // Detect Ethereum provider (MetaMask, OKX Wallet, etc.)
        const detectedProvider = await detectEthereumProvider();
        
        if (detectedProvider) {
          // Create ethers provider
          const ethersProvider = new ethers.providers.Web3Provider(detectedProvider);
          setProvider(ethersProvider);
          
          // Get chain ID
          const network = await ethersProvider.getNetwork();
          setChainId(network.chainId);
          
          // Check if already connected
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setSigner(ethersProvider.getSigner());
            setIsConnected(true);
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', handleChainChanged);
        } else {
          setError('Please install a wallet extension like MetaMask or OKX Wallet');
        }
      } catch (err) {
        console.error('Error initializing provider:', err);
        setError('Failed to initialize wallet connection');
      }
    };
    
    init();
    
    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // Disconnected
      setAccount(null);
      setSigner(null);
      setIsConnected(false);
    } else {
      // Connected with new account
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
      setIsConnected(true);
    }
  };

  // Handle chain changes
  const handleChainChanged = (chainIdHex) => {
    window.location.reload();
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!provider) {
        setError('No provider found. Please install a wallet extension.');
        return;
      }
      
      // Request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get signer and account
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      
      setSigner(signer);
      setAccount(account);
      setIsConnected(true);
      setError('');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    }
  };

  // Disconnect wallet (for UI purposes only, doesn't actually disconnect the wallet)
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Always use dark mode for this app
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WalletContext.Provider value={{ 
      provider, 
      signer, 
      account, 
      isConnected, 
      chainId,
      connectWallet,
      disconnectWallet
    }}>
      <div>
        <Navbar />
        <main className="main">
          <div className="main-content">
            <h1 className="page-title">pUSD Bonding Curve Exchange</h1>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {isConnected ? (
              <ExchangeInterface />
            ) : (
              <div className="card" style={{textAlign: 'center', padding: '3rem 1rem'}}>
                <h2 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem'}}>Connect your wallet to get started</h2>
                <p style={{color: '#9ca3af', marginBottom: '1.5rem'}}>
                  Exchange USDT for pUSD using our bonding curve mechanism
                </p>
                <button 
                  onClick={connectWallet}
                  className="btn btn-primary"
                  style={{padding: '0.75rem 2rem'}}
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </main>
        <footer className="footer">
          <p>© {new Date().getFullYear()} pUSD Bonding Curve Exchange</p>
        </footer>
      </div>
    </WalletContext.Provider>
  );
}

export default App;
