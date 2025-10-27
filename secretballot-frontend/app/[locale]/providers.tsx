"use client";

/**
 * Global Providers
 * Combines all context providers for the application
 */

import React from "react";
import { FhevmProvider } from "@/fhevm/useFhevm";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FhevmProvider>
      {children}
    </FhevmProvider>
  );
}


