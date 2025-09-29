"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function WalletConnect() {
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if ((window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
        }
      } catch (error) {
        console.error("检查连接失败:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      setAccount("");
      setChainId(0);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(parseInt(chainId, 16));
    window.location.reload();
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("请安装 MetaMask 钱包");
      return;
    }

    setIsConnecting(true);
    try {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      await checkConnection();
    } catch (error: any) {
      console.error("连接钱包失败:", error);
      alert("连接钱包失败: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToSepolia = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return;
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
        } catch (addError) {
          console.error("添加网络失败:", addError);
        }
      }
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 11155111: return "Sepolia";
      case 1: return "主网";
      case 31337: return "本地";
      default: return `Chain ${chainId}`;
    }
  };

  const isCorrectNetwork = chainId === 11155111;

  if (account) {
    return (
      <div className="flex items-center gap-3">
        {!isCorrectNetwork && (
          <button
            onClick={switchToSepolia}
            className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-all duration-300 text-sm font-medium"
          >
            切换到 Sepolia
          </button>
        )}
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl border border-white/10 bg-white/5">
          <div className={`w-3 h-3 rounded-full ${isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
          <div className="text-sm">
            <div className="text-white font-medium">{formatAddress(account)}</div>
            <div className="text-white/60 text-xs">{getNetworkName(chainId)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className={`btn-primary ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-glow'}`}
    >
      {isConnecting ? "连接中..." : "🔗 连接钱包"}
    </button>
  );
}
