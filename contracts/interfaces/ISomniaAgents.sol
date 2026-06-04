// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ═══════════════════════════════════════════════════════════════════════
//  SOMNIA PLATFORM TYPES
//  Source: agents.somnia.network (verified May 2026)
//  Platform: 0x5E5205CF39E766118C01636bED000A54D93163E6
// ═══════════════════════════════════════════════════════════════════════

/// @notice Consensus mode used by the validator subcommittee
enum ConsensusType {
    Majority,   // 0 - Simple majority of validators must agree
    Threshold   // 1 - Threshold-based agreement
}

/// @notice Lifecycle status of an agent request
enum ResponseStatus {
    None,       // 0 - Default zero value (uninitialized storage)
    Pending,    // 1 - Awaiting validator responses
    Success,    // 2 - Consensus reached normally
    Failed,     // 3 - Validators reported failure
    TimedOut    // 4 - Request timed out before consensus
}

/// @notice A single validator's response to an agent request
struct Response {
    address        validator;
    bytes          result;
    ResponseStatus status;
    uint256        receipt;
    uint256        timestamp;
    uint256        executionCost;
}

/// @notice Full request details stored by the platform
struct Request {
    uint256        id;
    address        requester;
    address        callbackAddress;
    bytes4         callbackSelector;
    address[]      subcommittee;
    Response[]     responses;
    uint256        responseCount;
    uint256        failureCount;
    uint256        threshold;
    uint256        createdAt;
    uint256        deadline;
    ResponseStatus status;
    ConsensusType  consensusType;
    uint256        remainingBudget;
    uint256        perAgentBudget;
}

// ═══════════════════════════════════════════════════════════════════════
//  PLATFORM INTERFACE
//  Address: 0x5E5205CF39E766118C01636bED000A54D93163E6
// ═══════════════════════════════════════════════════════════════════════

interface IAgentRequester {
    /// @notice Create a request to a Somnia Agent
    function createRequest(
        uint256        agentId,
        address        callbackAddress,
        bytes4         callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    /// @notice Returns the minimum platform reserve
    function getRequestDeposit() external view returns (uint256);
}

// ═══════════════════════════════════════════════════════════════════════
//  JSON API REQUEST AGENT
//  ID:   13174292974160097713
//  Cost: 0.03 SOMI per agent × 3 validators = 0.09 SOMI + reserve = 0.12 SOMI
// ═══════════════════════════════════════════════════════════════════════

interface IJsonApiAgent {
    /// @notice Fetch a string value from a public JSON API
    function fetchString(
        string memory url,
        string memory selector
    ) external returns (string memory);
}

// ═══════════════════════════════════════════════════════════════════════
//  LLM PARSE AGENT (parseWebsite)
//  ID:   SET_FROM_agents.somnia.network — look up "LLM Parse Agent" or
//        "Website Parse Agent" on agents.somnia.network and set below.
//        Placeholder: 0 — use setSomniaParseAgentId() setter to update.
//  Cost: 0.12 SOMI per agent × 3 validators = 0.36 SOMI total
// ═══════════════════════════════════════════════════════════════════════

interface ILLMParseAgent {
    /// @notice Scrape a website and extract structured data via LLM
    /// @param url              Full URL to scrape
    /// @param extractionPrompt Natural language instruction for what to extract
    /// @return                 Extracted data as a string
    function parseWebsite(
        string memory url,
        string memory extractionPrompt
    ) external returns (string memory);
}

// ═══════════════════════════════════════════════════════════════════════
//  LLM INFERENCE AGENT
//  ID:    12847293847561029384
//  Model: Qwen3-30B
//  Cost:  0.07 SOMI per agent × 3 validators = 0.21 SOMI + reserve = 0.24 SOMI
// ═══════════════════════════════════════════════════════════════════════

interface ILLMInferenceAgent {
    /// @notice Run deterministic LLM inference with constrained output
    /// @param prompt         User prompt
    /// @param system         System prompt
    /// @param chainOfThought Whether to use chain-of-thought reasoning internally
    /// @param allowedValues  If non-empty, output is FORCED to be one of these strings
    /// @return               The model's response
    function inferString(
        string memory   prompt,
        string memory   system,
        bool            chainOfThought,
        string[] memory allowedValues
    ) external returns (string memory);
}
