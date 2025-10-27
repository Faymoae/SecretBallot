"use client";

/**
 * useMetaMaskProvider Hook
 * Manages MetaMask connection, accounts, and provider state with persistence
 */

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useEip6963 } from "./useEip6963";
import type { EIP1193Provider } from "./Eip6963Types";

// LocalStorage keys
const STORAGE_KEY_CONNECTED = "secretballot_wallet_connected";
const STORAGE_KEY_PROVIDER_INDEX = "secretballot_wallet_provider_index";

export function useMetaMaskProvider() {
  const { walletProviders } = useEip6963();
  const [selectedProvider, setSelectedProvider] = useState<EIP1193Provider | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  // Initialize ethers provider when EIP-1193 provider is selected
  useEffect(() => {
    if (!selectedProvider) {
      setProvider(null);
      setSigner(null);
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(selectedProvider as any);
      setProvider(ethersProvider);
    } catch (err) {
      console.error("Failed to create ethers provider:", err);
      setError(err instanceof Error ? err : new Error("Failed to create provider"));
    }
  }, [selectedProvider]);

  // Get signer when provider and account are available
  useEffect(() => {
    if (!provider || !account) {
      setSigner(null);
      return;
    }

    provider.getSigner(account).then(setSigner).catch((err) => {
      console.error("Failed to get signer:", err);
      setError(err);
    });
  }, [provider, account]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (autoConnectAttempted || walletProviders.length === 0 || isConnecting) {
      return;
    }

    const wasConnected = localStorage.getItem(STORAGE_KEY_CONNECTED) === "true";
    const savedProviderIndex = parseInt(localStorage.getItem(STORAGE_KEY_PROVIDER_INDEX) || "0", 10);

    if (wasConnected) {
      console.log("🔄 Auto-reconnecting wallet...");
      setAutoConnectAttempted(true);
      connect(savedProviderIndex).catch((err) => {
        console.warn("⚠️ Auto-reconnect failed:", err);
        // Clear stored connection state if auto-reconnect fails
        localStorage.removeItem(STORAGE_KEY_CONNECTED);
        localStorage.removeItem(STORAGE_KEY_PROVIDER_INDEX);
      });
    } else {
      setAutoConnectAttempted(true);
    }
  }, [walletProviders, autoConnectAttempted, isConnecting]);

  // Listen to account changes
  useEffect(() => {
    if (!selectedProvider) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        setAccount(null);
        setSigner(null);
        // Clear persistence when wallet disconnected
        localStorage.removeItem(STORAGE_KEY_CONNECTED);
        localStorage.removeItem(STORAGE_KEY_PROVIDER_INDEX);
        console.log("👛 Wallet disconnected");
      } else {
        setAccount(accountsArray[0]);
        console.log("👛 Account changed:", accountsArray[0]);
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      setChainId(newChainId);
      console.log("🔗 Chain changed:", newChainId);
      // Reload page on chain change (recommended by MetaMask)
      window.location.reload();
    };

    const handleDisconnect = () => {
      setAccount(null);
      setSigner(null);
      // Clear persistence
      localStorage.removeItem(STORAGE_KEY_CONNECTED);
      localStorage.removeItem(STORAGE_KEY_PROVIDER_INDEX);
      console.log("👛 Wallet disconnected");
    };

    selectedProvider.on?.("accountsChanged", handleAccountsChanged);
    selectedProvider.on?.("chainChanged", handleChainChanged);
    selectedProvider.on?.("disconnect", handleDisconnect);

    return () => {
      selectedProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      selectedProvider.removeListener?.("chainChanged", handleChainChanged);
      selectedProvider.removeListener?.("disconnect", handleDisconnect);
    };
  }, [selectedProvider]);

  // Connect to wallet
  const connect = useCallback(async (providerIndex: number = 0) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const walletProvider = walletProviders[providerIndex];
      if (!walletProvider) {
        throw new Error("No wallet provider found");
      }

      const { provider: eip1193Provider } = walletProvider;
      setSelectedProvider(eip1193Provider);

      // Request accounts
      const accounts = await eip1193Provider.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      setAccount(accounts[0]);

      // Get chain ID
      const chainIdHex = await eip1193Provider.request({
        method: "eth_chainId",
      }) as string;
      setChainId(parseInt(chainIdHex, 16));

      // Save connection state to localStorage
      localStorage.setItem(STORAGE_KEY_CONNECTED, "true");
      localStorage.setItem(STORAGE_KEY_PROVIDER_INDEX, providerIndex.toString());

      console.log("✓ Wallet connected:", accounts[0]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to connect wallet");
      setError(error);
      console.error("✗ Wallet connection failed:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [walletProviders, isConnecting]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setSelectedProvider(null);
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    
    // Clear connection state from localStorage
    localStorage.removeItem(STORAGE_KEY_CONNECTED);
    localStorage.removeItem(STORAGE_KEY_PROVIDER_INDEX);
    
    console.log("👋 Wallet disconnected");
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!selectedProvider) {
      throw new Error("No provider connected");
    }

    try {
      await selectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        throw new Error("Please add this network to MetaMask first");
      }
      throw err;
    }
  }, [selectedProvider]);

  return {
    walletProviders,
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
    isConnected: !!account,
  };
}


