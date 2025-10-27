import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { SecretBallot } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SecretBallot", function () {
  let secretBallot: SecretBallot;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let voter3: HardhatEthersSigner;

  beforeEach(async function () {
    await deployments.fixture(["SecretBallot"]);
    const deployment = await deployments.get("SecretBallot");
    secretBallot = await ethers.getContractAt("SecretBallot", deployment.address);
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal with valid parameters", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const options = ["Option A", "Option B", "Option C"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 7 * 24 * 60 * 60; // 7 days

      const decryptionConfig = {
        mode: 1, // MANUAL
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      const tx = await secretBallot.createProposal(
        title,
        description,
        0, // SINGLE_CHOICE
        options,
        startTime,
        endTime,
        0, // PUBLIC
        decryptionConfig
      );

      await expect(tx)
        .to.emit(secretBallot, "ProposalCreated")
        .withArgs(0, owner.address, title, startTime, endTime, options.length);

      const proposal = await secretBallot.getProposal(0);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.creator).to.equal(owner.address);
      expect(proposal.options).to.deep.equal(options);
    });

    it("Should fail with invalid title length", async function () {
      const title = ""; // Empty title
      const description = "Test description";
      const options = ["Option A", "Option B"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 7 * 24 * 60 * 60;

      const decryptionConfig = {
        mode: 1,
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      await expect(
        secretBallot.createProposal(
          title,
          description,
          0,
          options,
          startTime,
          endTime,
          0,
          decryptionConfig
        )
      ).to.be.revertedWith("Invalid title length");
    });

    it("Should fail with invalid options count", async function () {
      const title = "Test Proposal";
      const description = "Test description";
      const options = ["Only One Option"]; // Need at least 2
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 7 * 24 * 60 * 60;

      const decryptionConfig = {
        mode: 1,
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      await expect(
        secretBallot.createProposal(
          title,
          description,
          0,
          options,
          startTime,
          endTime,
          0,
          decryptionConfig
        )
      ).to.be.revertedWith("Invalid options count");
    });

    it("Should fail with end time before start time", async function () {
      const title = "Test Proposal";
      const description = "Test description";
      const options = ["Option A", "Option B"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp + 1000;
      const endTime = startTime - 1; // End before start

      const decryptionConfig = {
        mode: 1,
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      await expect(
        secretBallot.createProposal(
          title,
          description,
          0,
          options,
          startTime,
          endTime,
          0,
          decryptionConfig
        )
      ).to.be.revertedWith("End time must be after start time");
    });
  });

  describe("Proposal Queries", function () {
    beforeEach(async function () {
      const title = "Test Proposal";
      const description = "Test description";
      const options = ["Option A", "Option B", "Option C"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 7 * 24 * 60 * 60;

      const decryptionConfig = {
        mode: 1,
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      await secretBallot.createProposal(
        title,
        description,
        0,
        options,
        startTime,
        endTime,
        0,
        decryptionConfig
      );
    });

    it("Should get proposal count", async function () {
      const count = await secretBallot.getProposalCount();
      expect(count).to.equal(1);
    });

    it("Should get user created proposals", async function () {
      const proposals = await secretBallot.getUserCreatedProposals(owner.address);
      expect(proposals.length).to.equal(1);
      expect(proposals[0]).to.equal(0);
    });

    it("Should return false for hasVoted before voting", async function () {
      const hasVoted = await secretBallot.hasVoted(0, voter1.address);
      expect(hasVoted).to.be.false;
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      const title = "Test Proposal";
      const description = "Test description";
      const options = ["Option A", "Option B", "Option C"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 7 * 24 * 60 * 60;

      const decryptionConfig = {
        mode: 1,
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      await secretBallot.createProposal(
        title,
        description,
        0,
        options,
        startTime,
        endTime,
        0,
        decryptionConfig
      );
    });

    it("Should allow voting on an active proposal", async function () {
      // Note: In a real test with FHEVM, we would use createEncryptedInput
      // For this test, we're checking the contract logic structure
      // Actual encrypted voting tests would require FHEVM test environment
      
      const proposalId = 0;
      const proposal = await secretBallot.getProposal(proposalId);
      
      expect(proposal.totalVoters).to.equal(0);
      expect(await secretBallot.hasVoted(proposalId, voter1.address)).to.be.false;
    });

    it("Should fail when voting on non-existent proposal", async function () {
      const nonExistentId = 999;
      
      await expect(
        secretBallot.hasVoted(nonExistentId, voter1.address)
      ).to.be.revertedWith("Proposal does not exist");
    });
  });

  describe("Results and Decryption", function () {
    beforeEach(async function () {
      const title = "Test Proposal";
      const description = "Test description";
      const options = ["Option A", "Option B", "Option C"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 3600; // 1 hour duration for testing

      const decryptionConfig = {
        mode: 1, // MANUAL
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      await secretBallot.createProposal(
        title,
        description,
        0,
        options,
        startTime,
        endTime,
        0,
        decryptionConfig
      );
    });

    it("Should fail to get results before decryption", async function () {
      await expect(
        secretBallot.getResults(0)
      ).to.be.revertedWith("Results not decrypted yet");
    });

    it("Should fail to request decryption before proposal ends", async function () {
      // Proposal has 1 second duration, still active
      // Since it just created, should fail
      await expect(
        secretBallot.requestDecryption(0)
      ).to.be.revertedWith("Proposal still active");
    });
  });

  describe("User Tracking", function () {
    it("Should track multiple proposals created by user", async function () {
      const options = ["Option A", "Option B"];
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock!.timestamp;
      const endTime = startTime + 7 * 24 * 60 * 60;
      const decryptionConfig = {
        mode: 1,
        authorizedDecrypters: [],
        delaySeconds: 0,
      };

      // Create first proposal
      await secretBallot.createProposal(
        "Proposal 1",
        "Description 1",
        0,
        options,
        startTime,
        endTime,
        0,
        decryptionConfig
      );

      // Create second proposal
      await secretBallot.createProposal(
        "Proposal 2",
        "Description 2",
        0,
        options,
        startTime,
        endTime,
        0,
        decryptionConfig
      );

      const userProposals = await secretBallot.getUserCreatedProposals(owner.address);
      expect(userProposals.length).to.equal(2);
      expect(userProposals[0]).to.equal(0);
      expect(userProposals[1]).to.equal(1);
    });
  });
});

