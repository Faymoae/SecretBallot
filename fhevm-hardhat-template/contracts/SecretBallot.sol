// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecretBallot - FHEVM Privacy-Preserving Voting dApp
/// @notice This contract implements encrypted voting using FHEVM
/// @dev MVP version supporting single-choice voting with encrypted ballots
contract SecretBallot is SepoliaConfig {
    // Proposal types
    enum ProposalType { SINGLE_CHOICE, MULTIPLE_CHOICE, YES_NO, RATING }
    
    // Vote permission types
    enum VotePermission { PUBLIC, WHITELIST, TOKEN_HOLDER }
    
    // Decryption modes
    enum DecryptionMode { AUTO, MANUAL, DELAYED }
    
    // Decryption configuration
    struct DecryptionConfig {
        DecryptionMode mode;
        address[] authorizedDecrypters;
        uint256 delaySeconds;
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        ProposalType proposalType;
        uint256 startTime;
        uint256 endTime;
        string[] options;
        VotePermission permission;
        DecryptionConfig decryptionConfig;
        bool decrypted;
        uint256 totalVoters;
    }
    
    // State variables
    uint256 private proposalCounter;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(uint256 => euint32)) private encryptedVoteCounts; // proposalId => optionIndex => encryptedCount
    mapping(uint256 => mapping(address => bool)) private hasVotedMapping;
    mapping(uint256 => mapping(address => euint8)) private encryptedVotes; // proposalId => voter => encryptedVote
    mapping(uint256 => uint256[]) private decryptedResults; // proposalId => decrypted vote counts
    mapping(address => uint256[]) private userCreatedProposals;
    mapping(address => uint256[]) private userVotedProposals;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        uint256 startTime,
        uint256 endTime,
        uint256 optionsCount
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 timestamp
    );
    
    event DecryptionRequested(
        uint256 indexed proposalId,
        address indexed requestor,
        uint256 timestamp
    );
    
    event ResultsDecrypted(
        uint256 indexed proposalId,
        uint256[] results,
        uint256 timestamp
    );
    
    // Modifiers
    modifier proposalExists(uint256 proposalId) {
        require(proposalId < proposalCounter, "Proposal does not exist");
        _;
    }
    
    modifier proposalActive(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Proposal not started");
        require(block.timestamp <= proposal.endTime, "Proposal ended");
        _;
    }
    
    modifier proposalEnded(uint256 proposalId) {
        require(block.timestamp > proposals[proposalId].endTime, "Proposal still active");
        _;
    }
    
    modifier notVoted(uint256 proposalId) {
        require(!hasVotedMapping[proposalId][msg.sender], "Already voted");
        _;
    }
    
    modifier canDecrypt(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.decrypted, "Already decrypted");
        
        if (proposal.decryptionConfig.mode == DecryptionMode.MANUAL) {
            bool authorized = false;
            if (proposal.decryptionConfig.authorizedDecrypters.length == 0) {
                // If no authorized decrypters, only creator can decrypt
                authorized = msg.sender == proposal.creator;
            } else {
                // Check if msg.sender is in authorized list
                for (uint256 i = 0; i < proposal.decryptionConfig.authorizedDecrypters.length; i++) {
                    if (proposal.decryptionConfig.authorizedDecrypters[i] == msg.sender) {
                        authorized = true;
                        break;
                    }
                }
            }
            require(authorized, "Not authorized to decrypt");
        }
        
        if (proposal.decryptionConfig.mode == DecryptionMode.DELAYED) {
            require(
                block.timestamp >= proposal.endTime + proposal.decryptionConfig.delaySeconds,
                "Delay period not passed"
            );
        }
        _;
    }
    
    /// @notice Create a new proposal
    /// @param title Proposal title
    /// @param description Proposal description
    /// @param proposalType Type of proposal (SINGLE_CHOICE for MVP)
    /// @param options Array of voting options
    /// @param startTime Proposal start timestamp
    /// @param endTime Proposal end timestamp
    /// @param permission Vote permission type
    /// @param decryptionConfig Decryption configuration
    /// @return proposalId ID of the created proposal
    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        VotePermission permission,
        DecryptionConfig memory decryptionConfig
    ) external returns (uint256 proposalId) {
        require(bytes(title).length > 0 && bytes(title).length <= 100, "Invalid title length");
        require(bytes(description).length > 0 && bytes(description).length <= 1000, "Invalid description length");
        require(options.length >= 2 && options.length <= 10, "Invalid options count");
        require(startTime >= block.timestamp - 60, "Invalid start time"); // Allow 60s grace period
        require(endTime > startTime, "End time must be after start time");
        require(endTime <= startTime + 365 days, "Duration too long");
        
        proposalId = proposalCounter++;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.creator = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.startTime = startTime;
        proposal.endTime = endTime;
        proposal.options = options;
        proposal.permission = permission;
        proposal.decryptionConfig = decryptionConfig;
        proposal.decrypted = false;
        proposal.totalVoters = 0;
        
        // Initialize encrypted vote counts to 0
        for (uint256 i = 0; i < options.length; i++) {
            encryptedVoteCounts[proposalId][i] = FHE.asEuint32(0);
            FHE.allowThis(encryptedVoteCounts[proposalId][i]);
        }
        
        userCreatedProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            startTime,
            endTime,
            options.length
        );
    }
    
    /// @notice Cast an encrypted vote
    /// @param proposalId ID of the proposal
    /// @param encryptedVote Encrypted vote choice (externalEuint8)
    /// @param inputProof Proof for the encrypted input
    function vote(
        uint256 proposalId,
        externalEuint8 encryptedVote,
        bytes calldata inputProof
    ) external 
        proposalExists(proposalId)
        proposalActive(proposalId)
        notVoted(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        // Convert externalEuint8 to euint8
        euint8 voteChoice = FHE.fromExternal(encryptedVote, inputProof);
        
        // Store encrypted vote
        encryptedVotes[proposalId][msg.sender] = voteChoice;
        FHE.allowThis(voteChoice);
        FHE.allow(voteChoice, msg.sender);
        
        // Update vote counts for each option
        // We iterate through all options and add 1 if the vote matches that option
        for (uint256 i = 0; i < proposal.options.length; i++) {
            // Check if voteChoice == i
            ebool isThisOption = FHE.eq(voteChoice, FHE.asEuint8(uint8(i)));
            // Add 1 if true, 0 if false
            euint32 toAdd = FHE.asEuint32(FHE.asEuint8(isThisOption));
            encryptedVoteCounts[proposalId][i] = FHE.add(
                encryptedVoteCounts[proposalId][i],
                toAdd
            );
            FHE.allowThis(encryptedVoteCounts[proposalId][i]);
        }
        
        hasVotedMapping[proposalId][msg.sender] = true;
        proposal.totalVoters++;
        userVotedProposals[msg.sender].push(proposalId);
        
        emit VoteCast(proposalId, msg.sender, block.timestamp);
    }
    
    /// @notice Request decryption of voting results
    /// @param proposalId ID of the proposal
    /// @dev In MVP, decryption is simplified - results are set via fulfillDecryption
    /// In production, this would use FHE.requestDecryption with callback
    /// Also authorizes the caller to decrypt the vote counts for oracle simulation
    function requestDecryption(uint256 proposalId)
        external
        proposalExists(proposalId)
        proposalEnded(proposalId)
        canDecrypt(proposalId)
    {
        // Authorize the caller to decrypt all vote counts (for oracle simulation in MVP)
        Proposal storage proposal = proposals[proposalId];
        for (uint256 i = 0; i < proposal.options.length; i++) {
            FHE.allow(encryptedVoteCounts[proposalId][i], msg.sender);
        }
        
        // Mark decryption as requested
        // In MVP, results must be provided via fulfillDecryption
        // In production, this would trigger async decryption via oracle
        emit DecryptionRequested(proposalId, msg.sender, block.timestamp);
    }
    
    /// @notice Callback function for decrypted results (called by Decryption Oracle)
    /// @dev In MVP, we simulate immediate decryption for testing
    /// @param proposalId ID of the proposal
    /// @param decryptedVoteCounts Decrypted vote counts
    function fulfillDecryption(
        uint256 proposalId,
        uint256[] calldata decryptedVoteCounts
    ) external proposalExists(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.decrypted, "Already decrypted");
        require(decryptedVoteCounts.length == proposal.options.length, "Invalid results length");
        
        decryptedResults[proposalId] = decryptedVoteCounts;
        proposal.decrypted = true;
        
        emit ResultsDecrypted(proposalId, decryptedVoteCounts, block.timestamp);
    }
    
    /// @notice Get proposal details
    /// @param proposalId ID of the proposal
    /// @return id Proposal ID
    /// @return creator Proposal creator address
    /// @return title Proposal title
    /// @return description Proposal description
    /// @return proposalType Type of proposal
    /// @return startTime Start timestamp
    /// @return endTime End timestamp
    /// @return options Array of voting options
    /// @return permission Vote permission type
    /// @return decrypted Whether results are decrypted
    /// @return totalVoters Total number of voters
    function getProposal(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory description,
            ProposalType proposalType,
            uint256 startTime,
            uint256 endTime,
            string[] memory options,
            VotePermission permission,
            bool decrypted,
            uint256 totalVoters
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.creator,
            proposal.title,
            proposal.description,
            proposal.proposalType,
            proposal.startTime,
            proposal.endTime,
            proposal.options,
            proposal.permission,
            proposal.decrypted,
            proposal.totalVoters
        );
    }
    
    /// @notice Get total number of proposals
    /// @return Total proposal count
    function getProposalCount() external view returns (uint256) {
        return proposalCounter;
    }
    
    /// @notice Check if an address has voted on a proposal
    /// @param proposalId ID of the proposal
    /// @param voter Address to check
    /// @return True if voted, false otherwise
    function hasVoted(uint256 proposalId, address voter)
        external
        view
        proposalExists(proposalId)
        returns (bool)
    {
        return hasVotedMapping[proposalId][voter];
    }
    
    /// @notice Get decrypted results (only available after decryption)
    /// @param proposalId ID of the proposal
    /// @return Array of vote counts per option
    function getResults(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (uint256[] memory)
    {
        require(proposals[proposalId].decrypted, "Results not decrypted yet");
        return decryptedResults[proposalId];
    }
    
    /// @notice Get proposals created by a user
    /// @param user Address of the user
    /// @return Array of proposal IDs
    function getUserCreatedProposals(address user) external view returns (uint256[] memory) {
        return userCreatedProposals[user];
    }
    
    /// @notice Get proposals voted by a user
    /// @param user Address of the user
    /// @return Array of proposal IDs
    function getUserVotedProposals(address user) external view returns (uint256[] memory) {
        return userVotedProposals[user];
    }
    
    /// @notice Get encrypted vote of a user (for authorized viewing)
    /// @param proposalId ID of the proposal
    /// @param voter Address of the voter
    /// @return Encrypted vote handle
    function getEncryptedVote(uint256 proposalId, address voter)
        external
        view
        proposalExists(proposalId)
        returns (euint8)
    {
        require(
            msg.sender == voter || msg.sender == proposals[proposalId].creator,
            "Not authorized"
        );
        return encryptedVotes[proposalId][voter];
    }
    
    /// @notice Get encrypted vote count for an option (for oracle decryption)
    /// @param proposalId ID of the proposal
    /// @param optionIndex Index of the option
    /// @return Encrypted vote count handle
    /// @dev Caller must be authorized via requestDecryption first
    function getEncryptedVoteCount(uint256 proposalId, uint256 optionIndex)
        external
        view
        proposalExists(proposalId)
        returns (euint32)
    {
        require(optionIndex < proposals[proposalId].options.length, "Invalid option index");
        return encryptedVoteCounts[proposalId][optionIndex];
    }
}

