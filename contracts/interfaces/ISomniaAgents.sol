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
    address        validator;     // Validator node address
    bytes          result;        // ABI-encoded result bytes
    ResponseStatus status;        // This validator's status
    uint256        receipt;       // Validator's execution receipt
    uint256        timestamp;     // When this response was submitted
    uint256        executionCost; // Gas cost of execution
}

/// @notice Full request details stored by the platform
struct Request {
    uint256        id;
    address        requester;        // Contract that created this request
    address        callbackAddress;  // Where to call back with result
    bytes4         callbackSelector; // Which function to call
    address[]      subcommittee;     // Selected validator nodes
    Response[]     responses;        // All collected responses
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
    /// @param agentId          uint256 agent ID from agents.somnia.network
    /// @param callbackAddress  Contract address to receive the result
    /// @param callbackSelector 4-byte selector of the callback function
    /// @param payload          ABI-encoded agent method call
    /// @return requestId       Unique ID — store this as your on-chain receipt
    function createRequest(
        uint256        agentId,
        address        callbackAddress,
        bytes4         callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    /// @notice Returns the minimum platform reserve (operations floor)
    /// @dev Add (COST_PER_AGENT * SUBCOMMITTEE_SIZE) on top for execution reward
    function getRequestDeposit() external view returns (uint256);
}

// ═══════════════════════════════════════════════════════════════════════
//  JSON API REQUEST AGENT
//  ID:   13174292974160097713
//  Cost: 0.03 SOMI per agent × 3 validators = 0.09 SOMI + reserve = 0.12 SOMI
// ═══════════════════════════════════════════════════════════════════════

interface IJsonApiAgent {
    /// @notice Fetch a string value from a public JSON API
    /// @param url      Full URL to fetch
    /// @param selector JSONPath-style selector for the value to extract
    /// @return         Extracted string value
    function fetchString(
        string memory url,
        string memory selector
    ) external returns (string memory);
}

// ═══════════════════════════════════════════════════════════════════════
//  LLM INFERENCE AGENT
//  ID:    12847293847561029384
//  Model: Qwen3-30B
//  Cost:  0.07 SOMI per agent × 3 validators = 0.21 SOMI + reserve = 0.24 SOMI
//
//  KEY FEATURE: allowedValues parameter constrains LLM output to exact strings.
//  Use this to guarantee clean output without any JSON parsing in Solidity.
// ═══════════════════════════════════════════════════════════════════════

interface ILLMInferenceAgent {
    /// @notice Run deterministic LLM inference with constrained output
    /// @param prompt         User prompt — the question / task
    /// @param system         System prompt — role and rules for the model
    /// @param chainOfThought Whether to use chain-of-thought reasoning internally
    /// @param allowedValues  If non-empty, output is FORCED to be one of these strings
    /// @return               The model's response (constrained if allowedValues set)
    function inferString(
        string memory   prompt,
        string memory   system,
        bool            chainOfThought,
        string[] memory allowedValues
    ) external returns (string memory);
}
