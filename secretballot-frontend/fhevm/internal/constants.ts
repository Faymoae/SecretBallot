/**
 * FHEVM Network Constants
 * Based on reference implementation with network-specific configurations
 */

export const NETWORKS = {
  LOCALHOST: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://localhost:8545",
  },
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  },
} as const;

// Storage keys for caching
export const STORAGE_KEYS = {
  FHEVM_PUBLIC_KEY: "fhevm_public_key",
  DECRYPTION_SIGNATURE: "fhevm_decryption_signature",
  WALLET_CONNECTED: "wallet_connected",
  SELECTED_LOCALE: "selected_locale",
  THEME_MODE: "theme_mode",
} as const;

// FHEVM metadata key for mock detection
export const FHEVM_RELAYER_METADATA_KEY = "fhevm_relayer_metadata";

export type NetworkConfig = typeof NETWORKS[keyof typeof NETWORKS];


