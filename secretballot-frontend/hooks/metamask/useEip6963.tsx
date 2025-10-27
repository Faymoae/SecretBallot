"use client";

/**
 * useEip6963 Hook
 * Detects available wallet providers using EIP-6963 standard
 */

import { useState, useEffect } from "react";
import type {
  EIP6963AnnounceProviderEvent,
  WalletProvider,
} from "./Eip6963Types";

export function useEip6963() {
  const [walletProviders, setWalletProviders] = useState<WalletProvider[]>([]);

  useEffect(() => {
    const handleAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
      const { info, provider } = event.detail;
      
      setWalletProviders((prevProviders) => {
        // Check if provider already exists
        const exists = prevProviders.some((p) => p.info.uuid === info.uuid);
        if (exists) {
          return prevProviders;
        }
        
        return [...prevProviders, { info, provider }];
      });
    };

    // Listen for provider announcements
    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnouncement as EventListener
    );

    // Request providers to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnouncement as EventListener
      );
    };
  }, []);

  return { walletProviders };
}


