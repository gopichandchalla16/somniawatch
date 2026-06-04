// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ======================================================================
//  ISomniaAgents.sol
//  Interfaces for Somnia Agentic L1 platform
//  Platform address: 0x5E5205CF39E766118C01636bED000A54D93163E6
//  Chain ID: 50312
// ======================================================================

/// @notice Response status returned by the platform after agent consensus
enum ResponseStatus { Success, Failure, Timeout }

/// @notice A single validator response
struct Response {
    bytes  result;    // ABI-encoded return value
    uint8  status;    // 0=success, 1=failure
}

/// @notice The original request parameters
struct Request {
    uint256 agentId;
    address callbackContract;
    bytes4  callbackSelector;
    bytes   payload;
}

// ======================================================================
//  IAgentRequester — core platform interface
// ======================================================================

interface IAgentRequester {
    /// @notice Submit an agent request to the Somnia validator network
    /// @param  agentId           Agent ID from agents.somnia.network
    /// @param  callbackContract  Contract to receive consensus callback
    /// @param  callbackSelector  Function selector for the callback
    /// @param  payload           ABI-encoded agent call (fetchString/parseWebsite/inferString)
    /// @return requestId         Unique ID — becomes receiptId after consensus
    function createRequest(
        uint256 agentId,
        address callbackContract,
        bytes4  callbackSelector,
        bytes   calldata payload
    ) external payable returns (uint256 requestId);

    /// @notice Minimum ETH deposit required per request
    function getRequestDeposit() external view returns (uint256);
}

// ======================================================================
//  IJsonApiAgent — fetchString (Agent ID: 13174292974160097713)
//  Cost: 0.12 STT total (0.04 STT × 3 validators)
// ======================================================================

interface IJsonApiAgent {
    /// @notice Fetch a JSON field from a REST API endpoint
    /// @param  url    Full URL to fetch (must return valid JSON)
    /// @param  field  Top-level JSON field to extract (e.g. "items", "result")
    /// @return        ABI-encoded string of the extracted field value
    function fetchString(
        string memory url,
        string memory field
    ) external returns (string memory);
}

// ======================================================================
//  ILLMParseAgent — parseWebsite (LLM Parse Agent)
//  Agent ID: SET THIS FROM agents.somnia.network — search "LLM Parse Agent"
//            or "Website Parse Agent". Update PARSE_AGENT_ID in SomniaWatch.sol.
//  Cost: 0.36 STT total (0.12 STT × 3 validators)
// ======================================================================

interface ILLMParseAgent {
    /// @notice Scrape a webpage and extract structured data via LLM
    /// @param  url               Full URL to scrape
    /// @param  extractionPrompt  Instructions for what to extract
    ///                           e.g. "string - extract: total tx count, top 3 method signatures"
    /// @return                   ABI-encoded string with extracted data
    function parseWebsite(
        string memory url,
        string memory extractionPrompt
    ) external returns (string memory);
}

// ======================================================================
//  ILLMInferenceAgent — inferString (Agent ID: 12847293847561029384)
//  Cost: 0.24 STT total (0.08 STT × 3 validators)
//  Model: Qwen3-30B
// ======================================================================

interface ILLMInferenceAgent {
    /// @notice Run LLM inference with optional constrained output
    /// @param  userPrompt    The main prompt / question
    /// @param  systemPrompt  System context for the LLM
    /// @param  stream        Set false for on-chain use
    /// @param  allowedValues Constrained output set (empty = free text)
    ///                       When set, model MUST return one of these values
    ///                       Eliminates JSON parsing and hallucination risk
    /// @return               ABI-encoded string response
    function inferString(
        string memory   userPrompt,
        string memory   systemPrompt,
        bool            stream,
        string[] memory allowedValues
    ) external returns (string memory);
}
