import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("secretballot:createProposal", "Create a new proposal")
  .addParam("title", "Proposal title")
  .addParam("description", "Proposal description")
  .addParam("options", "Comma-separated options")
  .addOptionalParam("duration", "Duration in seconds", "604800") // Default 7 days
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretBallot = await deployments.get("SecretBallot");
    const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

    const options = taskArguments.options.split(",").map((opt: string) => opt.trim());
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + parseInt(taskArguments.duration);

    const decryptionConfig = {
      mode: 1, // MANUAL
      authorizedDecrypters: [],
      delaySeconds: 0,
    };

    console.log("Creating proposal...");
    const tx = await secretBallot.createProposal(
      taskArguments.title,
      taskArguments.description,
      0, // SINGLE_CHOICE
      options,
      startTime,
      endTime,
      0, // PUBLIC
      decryptionConfig
    );

    const receipt = await tx.wait();
    console.log(`Proposal created! Transaction hash: ${receipt?.hash}`);
    
    const proposalCount = await secretBallot.getProposalCount();
    console.log(`Proposal ID: ${proposalCount - 1n}`);
  });

task("secretballot:listProposals", "List all proposals").setAction(async function (taskArguments: TaskArguments, hre) {
  const { ethers, deployments } = hre;
  const SecretBallot = await deployments.get("SecretBallot");
  const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

  const count = await secretBallot.getProposalCount();
  console.log(`Total proposals: ${count}`);

  for (let i = 0; i < count; i++) {
    const proposal = await secretBallot.getProposal(i);
    console.log(`\n--- Proposal ${i} ---`);
    console.log(`Title: ${proposal.title}`);
    console.log(`Description: ${proposal.description}`);
    console.log(`Creator: ${proposal.creator}`);
    console.log(`Options: ${proposal.options.join(", ")}`);
    console.log(`Total Voters: ${proposal.totalVoters}`);
    console.log(`Decrypted: ${proposal.decrypted}`);
    console.log(`Start Time: ${new Date(Number(proposal.startTime) * 1000).toISOString()}`);
    console.log(`End Time: ${new Date(Number(proposal.endTime) * 1000).toISOString()}`);
  }
});

task("secretballot:getProposal", "Get proposal details")
  .addParam("id", "Proposal ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretBallot = await deployments.get("SecretBallot");
    const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

    const proposal = await secretBallot.getProposal(taskArguments.id);
    console.log(`\n--- Proposal ${taskArguments.id} ---`);
    console.log(`Title: ${proposal.title}`);
    console.log(`Description: ${proposal.description}`);
    console.log(`Creator: ${proposal.creator}`);
    console.log(`Options: ${proposal.options.join(", ")}`);
    console.log(`Total Voters: ${proposal.totalVoters}`);
    console.log(`Decrypted: ${proposal.decrypted}`);
    console.log(`Start Time: ${new Date(Number(proposal.startTime) * 1000).toISOString()}`);
    console.log(`End Time: ${new Date(Number(proposal.endTime) * 1000).toISOString()}`);

    if (proposal.decrypted) {
      const results = await secretBallot.getResults(taskArguments.id);
      console.log("\n--- Results ---");
      proposal.options.forEach((option: string, index: number) => {
        console.log(`${option}: ${results[index]} votes`);
      });
    }
  });

task("secretballot:hasVoted", "Check if an address has voted")
  .addParam("id", "Proposal ID")
  .addParam("address", "Voter address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretBallot = await deployments.get("SecretBallot");
    const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

    const hasVoted = await secretBallot.hasVoted(taskArguments.id, taskArguments.address);
    console.log(`Has voted: ${hasVoted}`);
  });

task("secretballot:getUserProposals", "Get proposals created by a user")
  .addParam("address", "User address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretBallot = await deployments.get("SecretBallot");
    const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

    const proposals = await secretBallot.getUserCreatedProposals(taskArguments.address);
    console.log(`Proposals created by ${taskArguments.address}:`);
    console.log(proposals.map((id: bigint) => id.toString()).join(", "));
  });

task("secretballot:getUserVotes", "Get proposals voted by a user")
  .addParam("address", "User address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretBallot = await deployments.get("SecretBallot");
    const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

    const proposals = await secretBallot.getUserVotedProposals(taskArguments.address);
    console.log(`Proposals voted by ${taskArguments.address}:`);
    console.log(proposals.map((id: bigint) => id.toString()).join(", "));
  });

task("secretballot:fulfillDecryption", "Simulate oracle decryption and fulfill results")
  .addParam("id", "Proposal ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const SecretBallot = await deployments.get("SecretBallot");
    const secretBallot = await ethers.getContractAt("SecretBallot", SecretBallot.address);

    const proposalId = taskArguments.id;
    console.log(`\n🔓 Simulating oracle decryption for proposal ${proposalId}...`);

    // Get proposal details
    const proposal = await secretBallot.getProposal(proposalId);
    console.log(`Title: ${proposal.title}`);
    console.log(`Options: ${proposal.options.join(", ")}`);
    console.log(`Total Voters: ${proposal.totalVoters}`);

    if (proposal.decrypted) {
      console.log("❌ Proposal already decrypted!");
      return;
    }

    // Real decryption using Mock FHEVM
    const { MockFhevmInstance } = await import("@fhevm/mock-utils");
    const provider = ethers.provider;
    
    console.log("\n📡 Creating mock FHEVM instance...");
    const instance = await MockFhevmInstance.create(provider, provider, {
      aclContractAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D",
      chainId: 31337,
      gatewayChainId: 55815,
      inputVerifierContractAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030",
      kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
      verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
      verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
    });
    console.log("✓ Mock FHEVM instance created");

    // Prepare decryption
    console.log("\n🔍 Reading encrypted vote counts...");
    const handlesToDecrypt: { handle: string; contractAddress: `0x${string}` }[] = [];
    const handleMap: { [key: string]: number } = {}; // handle -> optionIndex

    for (let optionIndex = 0; optionIndex < proposal.options.length; optionIndex++) {
      const encryptedHandle = await secretBallot.getEncryptedVoteCount(proposalId, optionIndex);
      const handleStr = encryptedHandle.toString();
      console.log(`Option ${optionIndex} (${proposal.options[optionIndex]}): handle = ${handleStr}`);
      
      handlesToDecrypt.push({
        handle: handleStr,
        contractAddress: SecretBallot.address as `0x${string}`
      });
      handleMap[handleStr] = optionIndex;
    }

    // Generate keypair and EIP712 signature (simulating oracle)
    console.log("\n🔐 Generating decryption signature...");
    const keypair = instance.generateKeypair();
    const eip712 = instance.createEIP712(
      keypair.publicKey,
      [SecretBallot.address as `0x${string}`]
    );

    // Sign with first signer (simulating oracle)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    const signature = await signer.signTypedData(
      eip712.domain,
      { Reencrypt: eip712.types.Reencrypt },
      eip712.message
    );
    console.log("✓ Signature generated");

    // Decrypt all handles at once
    console.log("\n🔓 Decrypting vote counts...");
    const decryptResult = await instance.userDecrypt(
      handlesToDecrypt,
      keypair.privateKey,
      keypair.publicKey,
      signature,
      [SecretBallot.address as `0x${string}`],
      signerAddress as `0x${string}`,
      Date.now(),
      7
    );

    // Extract decrypted values in correct order
    const decryptedCounts: bigint[] = new Array(proposal.options.length);
    for (const [handleStr, value] of Object.entries(decryptResult)) {
      const optionIndex = handleMap[handleStr];
      if (optionIndex !== undefined) {
        decryptedCounts[optionIndex] = BigInt(value.toString());
        console.log(`  ${proposal.options[optionIndex]}: ${value} votes`);
      }
    }

    // Verify we have all values
    for (let i = 0; i < decryptedCounts.length; i++) {
      if (decryptedCounts[i] === undefined) {
        console.error(`❌ Missing decrypted value for option ${i}`);
        return;
      }
    }

    console.log("\n📊 Decrypted Results:");
    proposal.options.forEach((option: string, index: number) => {
      console.log(`  ${option}: ${decryptedCounts[index]} votes`);
    });

    // Verify total matches
    const totalDecrypted = decryptedCounts.reduce((sum, count) => sum + count, 0n);
    console.log(`\n✓ Total decrypted votes: ${totalDecrypted} (expected: ${proposal.totalVoters})`);

    // Call fulfillDecryption with the decrypted counts
    console.log("\n⚡ Calling fulfillDecryption...");
    const tx = await secretBallot.fulfillDecryption(proposalId, decryptedCounts);
    const receipt = await tx.wait();
    
    console.log(`✅ Decryption fulfilled! Transaction hash: ${receipt?.hash}`);
    console.log("\n🎉 Real results are now available via getResults()!");
    console.log(`\n💡 View results: npx hardhat secretballot:getProposal --id ${proposalId} --network localhost`);
  });


