/**
 * FHEVM Instance Manager
 * Handles creation and management of FHEVM instances
 * Automatically switches between Mock Utils (localhost) and Relayer SDK (Sepolia)
 */

import * as ethers from "ethers";
import { NETWORKS, FHEVM_RELAYER_METADATA_KEY } from "./constants";

export type FhevmInstance = any; // Type from @fhevm/mock-utils or @zama-fhe/relayer-sdk

let cachedInstance: FhevmInstance | null = null;
let currentChainId: number | null = null;

/**
 * Check if we should use Mock Utils (local Hardhat node)
 */
function shouldUseMockUtils(chainId: number): boolean {
  // Use Mock Utils for localhost chain (Hardhat)
  // Use Relayer SDK for all other chains (Sepolia, mainnet, etc.)
  return chainId === NETWORKS.LOCALHOST.chainId;
}

/**
 * Create FHEVM instance using Mock Utils
 */
async function createMockInstance(
  provider: ethers.Provider
): Promise<FhevmInstance> {
  console.log("🔧 Creating Mock FHEVM instance...");
  
  // Dynamic import to avoid bundling Mock Utils in production
  const { MockFhevmInstance } = await import("@fhevm/mock-utils");
  
  // Create JsonRpcProvider for Mock Utils
  const jsonRpcProvider = new ethers.JsonRpcProvider(NETWORKS.LOCALHOST.rpcUrl);
  
  const instance = await MockFhevmInstance.create(jsonRpcProvider, jsonRpcProvider, {
    aclContractAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D",
    chainId: NETWORKS.LOCALHOST.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030",
    kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
    verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });
  
  console.log("✓ Mock FHEVM instance created");
  return instance;
}

/**
 * Create FHEVM instance using Relayer SDK
 */
async function createRelayerInstance(
  provider: ethers.Provider,
  chainId: number
): Promise<FhevmInstance> {
  console.log("🔧 Creating Relayer SDK instance...");
  
  // Dynamic import for Relayer SDK (web version for browser)
  const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/web");
  
  // Initialize SDK (load WASM modules)
  await initSDK();
  
  // Get underlying Eip1193Provider from ethers BrowserProvider
  const browserProvider = provider as ethers.BrowserProvider;
  const eip1193Provider = browserProvider ? (browserProvider as any)._getConnection().provider : undefined;
  
  // Create instance with Sepolia config and provider
  const instance = await createInstance({
    ...SepoliaConfig,
    network: eip1193Provider || NETWORKS.SEPOLIA.rpcUrl,
  });
  
  console.log("✓ Relayer SDK instance created");
  return instance;
}

/**
 * Get or create FHEVM instance
 * Automatically chooses between Mock Utils and Relayer SDK based on network
 */
export async function getFhevmInstance(
  provider: ethers.Provider
): Promise<FhevmInstance> {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // Return cached instance if same chain
  if (cachedInstance && currentChainId === chainId) {
    return cachedInstance;
  }
  
  // Clear cache if chain changed
  if (currentChainId && currentChainId !== chainId) {
    console.log("🔄 Chain changed, clearing cached instance");
    cachedInstance = null;
  }
  
  currentChainId = chainId;
  
  // Determine which implementation to use based on chainId
  const useMock = shouldUseMockUtils(chainId);
  
  if (useMock) {
    console.log("📍 Using Mock Utils (localhost - chainId: 31337)");
    cachedInstance = await createMockInstance(provider);
  } else {
    console.log(`📍 Using Relayer SDK (chainId: ${chainId})`);
    cachedInstance = await createRelayerInstance(provider, chainId);
  }
  
  return cachedInstance;
}

/**
 * Clear cached FHEVM instance (useful when switching accounts or networks)
 */
export function clearFhevmInstance(): void {
  cachedInstance = null;
  currentChainId = null;
  console.log("🗑️ FHEVM instance cache cleared");
}

/**
 * Get FHEVM public key for encryption
 */
export async function getFhevmPublicKey(
  instance: FhevmInstance
): Promise<string> {
  if (!instance) {
    throw new Error("FHEVM instance not initialized");
  }
  
  // Both Mock Utils and Relayer SDK expose getPublicKey()
  const publicKey = await instance.getPublicKey();
  return publicKey;
}

/**
 * Create encrypted input for contract
 */
export async function createEncryptedInput(
  instance: FhevmInstance,
  contractAddress: string,
  userAddress: string
): Promise<any> {
  if (!instance) {
    throw new Error("FHEVM instance not initialized");
  }
  
  // Create encrypted input builder
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  return input;
}

/**
 * User decryption of ciphertext
 */
export async function userDecrypt(
  instance: FhevmInstance,
  contractAddress: string,
  ciphertext: bigint | string,
  userAddress: string
): Promise<bigint> {
  if (!instance) {
    throw new Error("FHEVM instance not initialized");
  }
  
  // Convert to bigint if string
  const ct = typeof ciphertext === "string" ? BigInt(ciphertext) : ciphertext;
  
  // Request decryption
  const decrypted = await instance.decrypt(contractAddress, ct, userAddress);
  return BigInt(decrypted);
}

