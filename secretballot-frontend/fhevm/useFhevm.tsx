"use client";

/**
 * FHEVM Context Provider
 * Provides FHEVM instance to the entire application
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { getFhevmInstance, clearFhevmInstance, type FhevmInstance } from "./internal/fhevm";

interface FhevmContextValue {
  fhevmInstance: FhevmInstance | null;
  isInitializing: boolean;
  error: Error | null;
  initializeFhevm: (provider: ethers.Provider) => Promise<void>;
  clearInstance: () => void;
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

export function FhevmProvider({ children }: { children: React.ReactNode }) {
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializeFhevm = useCallback(async (provider: ethers.Provider) => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      const instance = await getFhevmInstance(provider);
      setFhevmInstance(instance);
      console.log("✓ FHEVM initialized successfully");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to initialize FHEVM");
      setError(error);
      console.error("✗ FHEVM initialization failed:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  const clearInstance = useCallback(() => {
    clearFhevmInstance();
    setFhevmInstance(null);
    setError(null);
    console.log("🗑️ FHEVM instance cleared from context");
  }, []);

  const value: FhevmContextValue = {
    fhevmInstance,
    isInitializing,
    error,
    initializeFhevm,
    clearInstance,
  };

  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>;
}

export function useFhevm(): FhevmContextValue {
  const context = useContext(FhevmContext);
  if (context === undefined) {
    throw new Error("useFhevm must be used within a FhevmProvider");
  }
  return context;
}


