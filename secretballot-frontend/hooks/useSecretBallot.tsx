"use client";

/**
 * useSecretBallot Hook
 * Provides functions to interact with SecretBallot contract
 */

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { SecretBallotABI } from "@/abi/SecretBallotABI";
import { getSecretBallotAddress } from "@/abi/SecretBallotAddresses";
import { useFhevm } from "@/fhevm/useFhevm";
import { createEncryptedInput } from "@/fhevm/internal/fhevm";

export interface Proposal {
  id: number;
  creator: string;
  title: string;
  description: string;
  proposalType: number;
  startTime: bigint;
  endTime: bigint;
  options: string[];
  permission: number;
  decrypted: boolean;
  totalVoters: bigint;
}

export interface CreateProposalParams {
  title: string;
  description: string;
  proposalType: number;
  options: string[];
  startTime: number;
  endTime: number;
  permission: number;
}

export function useSecretBallot(
  provider: ethers.BrowserProvider | null,
  signer: ethers.Signer | null,
  chainId: number | null
) {
  const { fhevmInstance, initializeFhevm } = useFhevm();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  // Initialize contract
  useEffect(() => {
    if (!provider || !signer || !chainId) {
      setContract(null);
      setContractAddress(null);
      return;
    }

    const networkName = chainId === 31337 ? "localhost" : chainId === 11155111 ? "sepolia" : null;
    if (!networkName) {
      console.warn("Unsupported network:", chainId);
      return;
    }

    const address = getSecretBallotAddress(networkName);
    if (!address) {
      console.warn("No deployment found for network:", networkName);
      return;
    }

    const contractInstance = new ethers.Contract(address, SecretBallotABI, signer);
    setContract(contractInstance);
    setContractAddress(address);
    console.log("✓ SecretBallot contract initialized:", address);
  }, [provider, signer, chainId]);

  // Initialize FHEVM when provider is available
  useEffect(() => {
    if (provider && !fhevmInstance) {
      initializeFhevm(provider).catch(console.error);
    }
  }, [provider, fhevmInstance, initializeFhevm]);

  // Create proposal
  const createProposal = useCallback(async (params: CreateProposalParams) => {
    if (!contract) throw new Error("Contract not initialized");

    const decryptionConfig = {
      mode: 1, // MANUAL
      authorizedDecrypters: [],
      delaySeconds: 0,
    };

    const tx = await contract.createProposal(
      params.title,
      params.description,
      params.proposalType,
      params.options,
      params.startTime,
      params.endTime,
      params.permission,
      decryptionConfig
    );

    const receipt = await tx.wait();
    console.log("✓ Proposal created:", receipt.hash);
    return receipt;
  }, [contract]);

  // Vote on proposal
  const vote = useCallback(async (proposalId: number, voteChoice: number) => {
    if (!contract) throw new Error("Contract not initialized");
    if (!fhevmInstance) throw new Error("FHEVM not initialized");
    if (!contractAddress) throw new Error("Contract address not available");
    if (!signer) throw new Error("Signer not available");

    const userAddress = await signer.getAddress();

    // Create encrypted input
    const input = await createEncryptedInput(fhevmInstance, contractAddress, userAddress);
    input.add8(voteChoice);
    const { handles, inputProof } = await input.encrypt();

    // Call contract
    const tx = await contract.vote(proposalId, handles[0], inputProof);
    const receipt = await tx.wait();
    
    console.log("✓ Vote cast:", receipt.hash);
    return receipt;
  }, [contract, fhevmInstance, contractAddress, signer]);

  // Request decryption
  const requestDecryption = useCallback(async (proposalId: number) => {
    if (!contract) throw new Error("Contract not initialized");

    const tx = await contract.requestDecryption(proposalId);
    const receipt = await tx.wait();
    
    console.log("✓ Decryption requested:", receipt.hash);
    return receipt;
  }, [contract]);

  // Fulfill decryption (simulate oracle - only works on localhost)
  const fulfillDecryption = useCallback(async (proposalId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    if (!fhevmInstance) throw new Error("FHEVM instance not initialized");
    if (!signer) throw new Error("Signer not initialized");
    if (chainId !== 31337) {
      throw new Error("Fulfill decryption only works on localhost (chainId 31337)");
    }

    console.log("🔓 Starting decryption process for proposal", proposalId);

    // Get proposal details
    const proposal = await contract.getProposal(proposalId);
    const optionsCount = proposal.options.length;
    console.log(`  Options: ${proposal.options.join(", ")}`);
    console.log(`  Total Voters: ${proposal.totalVoters.toString()}`);

    // Read encrypted vote counts
    console.log("📖 Reading encrypted vote counts...");
    const handlesToDecrypt: { handle: string; contractAddress: `0x${string}` }[] = [];
    const handleMap: { [key: string]: number } = {};

    for (let i = 0; i < optionsCount; i++) {
      // getEncryptedVoteCount returns euint32 (bytes32 in ABI)
      const encryptedHandle = await contract.getEncryptedVoteCount(proposalId, i);
      
      // Use ethers.hexlify to properly convert bytes32 to hex string
      // ethers v6 returns bytes as a special object, need to use hexlify
      const handleStr = ethers.hexlify(encryptedHandle);
      
      console.log(`  Option ${i} (${proposal.options[i]}): ${handleStr} (length: ${handleStr.length})`);
      
      handlesToDecrypt.push({
        handle: handleStr,
        contractAddress: contractAddress as `0x${string}`
      });
      handleMap[handleStr] = i;
    }

    // Generate keypair and sign
    console.log("🔐 Generating decryption signature...");
    const keypair = fhevmInstance.generateKeypair();
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 7;
    const eip712 = fhevmInstance.createEIP712(
      keypair.publicKey,
      [contractAddress as `0x${string}`],
      startTimestamp,
      durationDays
    );

    const signerAddress = await signer.getAddress();
    const signature = await signer.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message
    );

    // Decrypt
    console.log("🔓 Decrypting...");
    const decryptResult = await fhevmInstance.userDecrypt(
      handlesToDecrypt,
      keypair.privateKey,
      keypair.publicKey,
      signature,
      [contractAddress as `0x${string}`],
      signerAddress as `0x${string}`,
      startTimestamp,
      durationDays
    );

    // Extract decrypted values
    const decryptedCounts: bigint[] = new Array(optionsCount);
    for (const [handleStr, value] of Object.entries(decryptResult)) {
      const optionIndex = handleMap[handleStr];
      if (optionIndex !== undefined) {
        const numValue = typeof value === 'bigint' ? value : BigInt(String(value));
        decryptedCounts[optionIndex] = numValue;
        console.log(`  ✓ ${proposal.options[optionIndex]}: ${numValue} votes`);
      }
    }

    // Verify all values are present
    for (let i = 0; i < decryptedCounts.length; i++) {
      if (decryptedCounts[i] === undefined) {
        throw new Error(`Missing decrypted value for option ${i}`);
      }
    }

    const totalDecrypted = decryptedCounts.reduce((sum, count) => sum + count, 0n);
    console.log(`✓ Total: ${totalDecrypted} votes`);

    // Call fulfillDecryption
    console.log("⚡ Calling fulfillDecryption...");
    const tx = await contract.fulfillDecryption(proposalId, decryptedCounts);
    const receipt = await tx.wait();
    
    console.log("✅ Decryption fulfilled:", receipt.hash);
    return receipt;
  }, [contract, fhevmInstance, signer, chainId, contractAddress]);

  // Get proposal
  const getProposal = useCallback(async (proposalId: number): Promise<Proposal | null> => {
    if (!contract) return null;

    try {
      const proposal = await contract.getProposal(proposalId);
      return {
        id: Number(proposal.id),
        creator: proposal.creator,
        title: proposal.title,
        description: proposal.description,
        proposalType: Number(proposal.proposalType),
        startTime: proposal.startTime,
        endTime: proposal.endTime,
        options: proposal.options,
        permission: Number(proposal.permission),
        decrypted: proposal.decrypted,
        totalVoters: proposal.totalVoters,
      };
    } catch (error) {
      console.error("Error fetching proposal:", error);
      return null;
    }
  }, [contract]);

  // Get proposal count
  const getProposalCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.getProposalCount();
      return Number(count);
    } catch (error) {
      console.error("Error fetching proposal count:", error);
      return 0;
    }
  }, [contract]);

  // Check if user has voted
  const hasVoted = useCallback(async (proposalId: number, voterAddress: string): Promise<boolean> => {
    if (!contract) return false;

    try {
      return await contract.hasVoted(proposalId, voterAddress);
    } catch (error) {
      console.error("Error checking vote status:", error);
      return false;
    }
  }, [contract]);

  // Get results (only if decrypted)
  const getResults = useCallback(async (proposalId: number): Promise<number[] | null> => {
    if (!contract) return null;

    try {
      const results = await contract.getResults(proposalId);
      return results.map((r: bigint) => Number(r));
    } catch (error) {
      console.error("Error fetching results:", error);
      return null;
    }
  }, [contract]);

  // Get user created proposals
  const getUserCreatedProposals = useCallback(async (userAddress: string): Promise<number[]> => {
    if (!contract) return [];

    try {
      const proposalIds = await contract.getUserCreatedProposals(userAddress);
      return proposalIds.map((id: bigint) => Number(id));
    } catch (error) {
      console.error("Error fetching user proposals:", error);
      return [];
    }
  }, [contract]);

  // Get user voted proposals
  const getUserVotedProposals = useCallback(async (userAddress: string): Promise<number[]> => {
    if (!contract) return [];

    try {
      const proposalIds = await contract.getUserVotedProposals(userAddress);
      return proposalIds.map((id: bigint) => Number(id));
    } catch (error) {
      console.error("Error fetching user votes:", error);
      return [];
    }
  }, [contract]);

  return {
    contract,
    contractAddress,
    createProposal,
    vote,
    requestDecryption,
    fulfillDecryption,
    getProposal,
    getProposalCount,
    hasVoted,
    getResults,
    getUserCreatedProposals,
    getUserVotedProposals,
  };
}


