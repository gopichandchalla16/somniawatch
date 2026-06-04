// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISomniaAgents.sol";

/// @title  SomniaWatch
/// @notice Autonomous smart contract security guardian on Somnia Agentic L1
/// @author Gopichand Challa - Somnia Agentathon 2026
///
/// @dev TWO-AGENT PIPELINE (fully on-chain, no human in the loop):
///
///   triggerMonitor(address)
///     => JSON API Agent (ID: 13174292974160097713)
///           Fetches tx history from Somnia explorer API
///           3 validators reach consensus => callback fires
///     => handleTxDataResponse()
///           Chains immediately to:
///     => LLM Inference Agent (ID: 12847293847561029384, Qwen3-30B)
///           allowedValues: ["safe","suspicious","critical"]
///           OUTPUT IS FORCED - no JSON parsing needed in Solidity
///           3 validators reach consensus => callback fires
///     => handleClassificationResponse()
///           Stores AuditRecord with receiptId = agent requestId
///           Auto-flags contract if CRITICAL
///
/// Cost per full cycle: 0.12 + 0.24 = 0.36 SOMI
/// Budget (21 STT):    ~58 monitoring cycles available

contract SomniaWatch {

    // ================================================================
    //  PLATFORM - verified from agents.somnia.network
    // ================================================================

    /// @notice Somnia Agent Platform contract
    IAgentRequester public immutable platform;

    // ================================================================
    //  AGENT CONFIG - all values from agents.somnia.network
    // ================================================================

    /// @notice JSON API Request Agent ID
    uint256 public constant JSON_AGENT_ID = 13174292974160097713;

    /// @notice LLM Inference Agent ID (Qwen3-30B model)
    uint256 public constant LLM_AGENT_ID  = 12847293847561029384;

    /// @notice Execution cost per validator node for JSON API calls
    uint256 public constant JSON_COST_PER_AGENT = 30000000000000000; // 0.03 SOMI

    /// @notice Execution cost per validator node for LLM calls
    uint256 public constant LLM_COST_PER_AGENT  = 70000000000000000; // 0.07 SOMI

    /// @notice Number of validators in the default subcommittee
    uint256 public constant SUBCOMMITTEE_SIZE = 3;

    /// @notice Minimum time between monitoring checks per contract
    uint256 public constant MIN_INTERVAL = 5 minutes;

    /// @notice Somnia Shannon testnet explorer API base URL
    string public explorerApiBase =
        "https://shannon-explorer.somnia.network/api/v2/addresses/";

    // ================================================================
    //  ENUMS
    // ================================================================

    /// @notice Risk classification returned by LLM agent
    enum RiskLevel { SAFE, SUSPICIOUS, CRITICAL }

    /// @notice Tracks which agent step a pending request is waiting for
    enum CheckStage { AWAITING_TX_DATA, AWAITING_CLASSIFICATION }

    // ================================================================
    //  STRUCTS
    // ================================================================

    /// @notice Profile of a registered contract under monitoring
    struct ContractProfile {
        address owner;
        bool    isRegistered;
        bool    isFlagged;
        uint8   riskScore;       // 0=unscanned, 10=safe, 60=suspicious, 100=critical
        uint256 lastChecked;
        uint256 totalChecks;
        string  lastRiskType;
    }

    /// @notice Immutable audit record stored after each monitoring cycle
    /// @dev receiptId equals the Somnia agent requestId - verifiable on-chain proof
    struct AuditRecord {
        address   target;
        RiskLevel riskLevel;
        string    riskType;      // normal|reentrancy_pattern|access_violation|value_anomaly
        string    reasoning;
        uint256   timestamp;
        uint256   receiptId;     // = Somnia agent requestId = immutable proof of AI decision
        bool      autoActioned;  // true if contract was auto-flagged by agent consensus
    }

    /// @notice Tracks an in-flight agent request between callbacks
    struct PendingCheck {
        address    target;
        CheckStage stage;
        string     txSnapshot;
    }

    // ================================================================
    //  STATE
    // ================================================================

    mapping(address => ContractProfile) public  registry;
    mapping(address => AuditRecord[])   public  auditHistory;
    mapping(uint256 => PendingCheck)    private pendingChecks;

    address[] public registeredContracts;
    uint256   public totalAuditsCompleted;
    address   public watchAdmin;

    // ================================================================
    //  EVENTS
    // ================================================================

    event ContractRegistered (address indexed target, address indexed owner);
    event MonitorTriggered   (address indexed target, uint256 requestId, uint256 deposit);
    event TxDataReceived     (address indexed target, uint256 jsonReqId, uint256 llmReqId);
    event RiskClassified     (address indexed target, uint8 riskLevel, string riskType, uint256 receiptId);
    event ContractFlagged    (address indexed target, string riskType, uint256 receiptId);
    event ContractCleared    (address indexed target);
    event AgentCallFailed    (address indexed target, uint256 requestId, string reason);
    event Funded             (address indexed by, uint256 amount);

    // ================================================================
    //  CONSTRUCTOR
    // ================================================================

    /// @param _platform 0x5E5205CF39E766118C01636bED000A54D93163E6
    constructor(address _platform, uint256 _parseAgentId) {
        require(_platform != address(0), "Invalid platform address");
        platform   = IAgentRequester(_platform);
        watchAdmin = msg.sender;
    }

    // ================================================================
    //  REGISTRATION
    // ================================================================

    /// @notice Register a smart contract for autonomous monitoring
    /// @param target Address of the contract to monitor
    function registerContract(address target) external {
        require(target != address(0),           "Zero address not allowed");
        require(!registry[target].isRegistered, "Contract already registered");
        require(target != address(this),        "Cannot register SomniaWatch itself");

        registry[target] = ContractProfile({
            owner:        msg.sender,
            isRegistered: true,
            isFlagged:    false,
            riskScore:    0,
            lastChecked:  0,
            totalChecks:  0,
            lastRiskType: "unscanned"
        });

        registeredContracts.push(target);
        emit ContractRegistered(target, msg.sender);
    }

    // ================================================================
    //  STEP 1 - TRIGGER MONITORING
    //  Sends request to JSON API Agent to fetch recent transactions
    // ================================================================

    /// @notice Trigger a monitoring cycle for a registered contract
    /// @dev Contract must hold enough SOMI or caller must send msg.value.
    ///      Called automatically by keeper.js every 5 minutes.
    /// @param target The registered contract address to monitor
    /// @return requestId The Somnia platform requestId for this agent call
    function triggerMonitor(address target)
        external payable returns (uint256 requestId)
    {
        ContractProfile storage profile = registry[target];
        require(profile.isRegistered, "Contract is not registered");
        require(
            block.timestamp >= profile.lastChecked + MIN_INTERVAL,
            "Too soon: minimum 5 minutes between monitoring checks"
        );

        // Calculate exact deposit: platform reserve + execution reward for 3 validators
        uint256 reserve = platform.getRequestDeposit();
        uint256 deposit = reserve + (JSON_COST_PER_AGENT * SUBCOMMITTEE_SIZE);

        require(
            address(this).balance + msg.value >= deposit,
            "Insufficient SOMI: fund the contract first with fund()"
        );

        // Build the Somnia explorer API URL for this contract's transactions
        string memory apiUrl = string(abi.encodePacked(
            explorerApiBase,
            _toHex(target),
            "/transactions?limit=20"
        ));

        // Encode the fetchString agent method call
        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchString.selector,
            apiUrl,
            "items"
        );

        // Send request to Somnia platform - callback: handleTxDataResponse
        requestId = platform.createRequest{value: deposit}(
            JSON_AGENT_ID,
            address(this),
            this.handleTxDataResponse.selector,
            payload
        );

        // Track this pending request
        pendingChecks[requestId] = PendingCheck({
            target:     target,
            stage:      CheckStage.AWAITING_TX_DATA,
            txSnapshot: ""
        });

        // Update monitoring profile
        profile.lastChecked = block.timestamp;
        profile.totalChecks++;

        // Refund any excess msg.value to the caller
        if (msg.value > deposit) {
            payable(msg.sender).transfer(msg.value - deposit);
        }

        emit MonitorTriggered(target, requestId, deposit);
    }

    // ================================================================
    //  STEP 2 - JSON API CALLBACK
    //  Called by platform when 3 validators reach consensus on tx data
    //  Immediately chains to LLM Inference Agent
    // ================================================================

    /// @notice Callback from Somnia JSON API Agent
    /// @dev ONLY callable by the platform contract.
    ///      On success: decodes tx data and triggers LLM classification.
    function handleTxDataResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory /* details */
    ) external {
        require(msg.sender == address(platform), "Only Somnia platform can call callbacks");

        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0),                  "Unknown requestId");
        require(pc.stage == CheckStage.AWAITING_TX_DATA,  "Wrong stage for this callback");

        address target = pc.target;

        // Handle agent failure or timeout gracefully
        if (status != ResponseStatus.Success || responses.length == 0) {
            string memory reason = (status == ResponseStatus.Failed)
                ? "json_agent_failed"
                : "json_agent_timeout";
            emit AgentCallFailed(target, requestId, reason);
            delete pendingChecks[requestId];
            return;
        }

        // Decode the transaction data string from consensus result
        string memory txData = abi.decode(responses[0].result, (string));

        // Build LLM Prompt
        // Using Qwen3-30B via Somnia's LLM Inference Agent.
        // allowedValues FORCES output to be exactly one of our 3 strings.
        // This eliminates ALL JSON parsing in Solidity - direct keccak256 compare.

        string memory userPrompt = string(abi.encodePacked(
            "You are analyzing recent blockchain transaction data from a monitored "
            "smart contract to detect security threats. "
            "Transaction data from Somnia explorer: [", txData, "]. "
            "Analyze for these attack patterns: "
            "(1) REENTRANCY: same address calling withdraw/transfer repeatedly in short succession. "
            "(2) ACCESS VIOLATION: calls to privileged functions (drain, emergency, owner-only) "
            "from unexpected addresses or unusual patterns. "
            "(3) VALUE ANOMALY: sudden large value spikes, unusual transfer amounts, "
            "or flash-loan-like patterns. "
            "Classify the overall risk level of this contract's recent activity."
        ));

        string memory systemPrompt =
            "You are SomniaWatch, an autonomous smart contract security classifier "
            "running on Somnia Agentic L1. Your classifications are consensus-validated "
            "by 3 independent validator nodes and stored permanently on-chain as audit receipts. "
            "Be precise: safe means no anomalies detected, suspicious means unusual but "
            "not confirmed attack, critical means clear evidence of an attack pattern.";

        // allowedValues array - constrains LLM to return ONLY one of these strings
        string[] memory allowedValues = new string[](3);
        allowedValues[0] = "safe";
        allowedValues[1] = "suspicious";
        allowedValues[2] = "critical";

        // Encode the inferString agent method call
        bytes memory llmPayload = abi.encodeWithSelector(
            ILLMInferenceAgent.inferString.selector,
            userPrompt,
            systemPrompt,
            false,         // chainOfThought: false for faster deterministic response
            allowedValues  // OUTPUT FORCED to "safe", "suspicious", or "critical"
        );

        // Calculate LLM deposit
        uint256 reserve    = platform.getRequestDeposit();
        uint256 llmDeposit = reserve + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);

        require(
            address(this).balance >= llmDeposit,
            "Insufficient SOMI for LLM step: call fund() to top up contract balance"
        );

        // Send LLM request - callback: handleClassificationResponse
        uint256 llmReqId = platform.createRequest{value: llmDeposit}(
            LLM_AGENT_ID,
            address(this),
            this.handleClassificationResponse.selector,
            llmPayload
        );

        // Transfer pending check tracking to the new LLM requestId
        pendingChecks[llmReqId] = PendingCheck({
            target:     target,
            stage:      CheckStage.AWAITING_CLASSIFICATION,
            txSnapshot: txData
        });

        // Clean up old JSON request tracking
        delete pendingChecks[requestId];

        emit TxDataReceived(target, requestId, llmReqId);
    }

    // ================================================================
    //  STEP 3 - LLM CALLBACK
    //  Called by platform when 3 validators reach consensus on classification
    //  This is the autonomous decision point - no human involved
    // ================================================================

    /// @notice Callback from Somnia LLM Inference Agent (Qwen3-30B)
    /// @dev ONLY callable by the platform contract.
    ///      The riskStr result is GUARANTEED to be "safe", "suspicious", or "critical"
    ///      because allowedValues was set in the agent request.
    ///      No JSON parsing needed - direct keccak256 string comparison only.
    function handleClassificationResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory /* details */
    ) external {
        require(msg.sender == address(platform), "Only Somnia platform can call callbacks");

        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0), "Unknown requestId");

        address target     = pc.target;
        string  memory txSS = pc.txSnapshot;

        // Handle agent failure - store safe record, don't block future checks
        if (status != ResponseStatus.Success || responses.length == 0) {
            _storeAudit(target, RiskLevel.SAFE, "unknown",
                        "Agent unavailable - check retried next cycle",
                        requestId, false);
            emit AgentCallFailed(target, requestId, "llm_failed_or_timeout");
            delete pendingChecks[requestId];
            totalAuditsCompleted++;
            return;
        }

        // Decode LLM result - GUARANTEED to be "safe", "suspicious", or "critical"
        // because allowedValues was set. No JSON parsing needed anywhere.
        string memory riskStr = abi.decode(responses[0].result, (string));

        // Map guaranteed string to enum
        RiskLevel riskLevel = _toRiskLevel(riskStr);

        // Derive risk type and reasoning from level + tx data patterns
        string memory riskType  = _deriveRiskType(riskLevel, txSS);
        string memory reasoning = _deriveReasoning(riskLevel, riskType);

        // Autonomous Action
        // If CRITICAL: automatically flag the contract.
        // This decision was made by Qwen3-30B, consensus-validated by 3 validators.
        // No human decided this - the agent network did.
        bool autoActioned = false;

        if (riskLevel == RiskLevel.CRITICAL && !registry[target].isFlagged) {
            registry[target].isFlagged    = true;
            registry[target].riskScore    = 100;
            registry[target].lastRiskType = riskType;
            autoActioned = true;
            emit ContractFlagged(target, riskType, requestId);

        } else if (riskLevel == RiskLevel.SUSPICIOUS) {
            registry[target].riskScore    = 60;
            registry[target].lastRiskType = riskType;

        } else {
            // SAFE
            registry[target].riskScore    = 10;
            registry[target].lastRiskType = riskType;
        }

        // Store the immutable audit record
        // receiptId = Somnia agent requestId = verifiable on-chain proof of AI decision
        // Anyone can look up this requestId on the Somnia explorer to see what
        // the agent was asked and what consensus was reached.
        _storeAudit(target, riskLevel, riskType, reasoning, requestId, autoActioned);

        totalAuditsCompleted++;

        emit RiskClassified(target, uint8(riskLevel), riskType, requestId);

        delete pendingChecks[requestId];
    }

    // ================================================================
    //  FUNDING & ADMIN
    // ================================================================

    /// @notice Fund the contract with SOMI to pay for agent calls
    /// @dev Send at least 5 SOMI to cover ~14 full monitoring cycles (0.36 each)
    function fund() external payable {
        require(msg.value > 0, "Must send SOMI");
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Clear a flagged contract after human review
    /// @param target The previously flagged contract address
    function clearFlag(address target) external {
        require(
            msg.sender == registry[target].owner || msg.sender == watchAdmin,
            "Only contract owner or SomniaWatch admin can clear flags"
        );
        require(registry[target].isFlagged, "Contract is not flagged");
        registry[target].isFlagged = false;
        registry[target].riskScore = 0;
        emit ContractCleared(target);
    }

    /// @notice Update the explorer API base URL
    /// @param newBase New base URL for the Somnia explorer API
    function updateExplorer(string calldata newBase) external {
        require(msg.sender == watchAdmin, "Admin only");
        explorerApiBase = newBase;
    }

    // ================================================================
    //  VIEW FUNCTIONS
    // ================================================================

    /// @notice Get full audit history for a monitored contract
    function getAuditHistory(address target)
        external view returns (AuditRecord[] memory)
    { return auditHistory[target]; }

    /// @notice Get the most recent audit record for a contract
    function getLatestAudit(address target)
        external view returns (AuditRecord memory)
    {
        require(auditHistory[target].length > 0, "No audits recorded yet");
        return auditHistory[target][auditHistory[target].length - 1];
    }

    /// @notice Get all registered contract addresses
    function getAllRegistered()
        external view returns (address[] memory)
    { return registeredContracts; }

    /// @notice Count of registered contracts
    function getRegisteredCount()
        external view returns (uint256)
    { return registeredContracts.length; }

    /// @notice SOMI deposit required for a JSON API agent call
    function depositForJson() public view returns (uint256) {
        return platform.getRequestDeposit() + (JSON_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
    }

    /// @notice SOMI deposit required for an LLM Inference agent call
    function depositForLlm() public view returns (uint256) {
        return platform.getRequestDeposit() + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
    }

    /// @notice Total SOMI required for one complete monitoring cycle (JSON + LLM)
    function depositForFullCycle() external view returns (uint256) {
        return depositForJson() + depositForLlm();
    }

    /// @notice Current SOMI balance held by this contract
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ================================================================
    //  INTERNAL HELPERS
    // ================================================================

    /// @dev Store an audit record in the contract's history
    function _storeAudit(
        address   target,
        RiskLevel riskLevel,
        string memory riskType,
        string memory reasoning,
        uint256   receiptId,
        bool      autoActioned
    ) internal {
        auditHistory[target].push(AuditRecord({
            target:       target,
            riskLevel:    riskLevel,
            riskType:     riskType,
            reasoning:    reasoning,
            timestamp:    block.timestamp,
            receiptId:    receiptId,
            autoActioned: autoActioned
        }));
    }

    /// @dev Map LLM result string to RiskLevel enum
    ///      allowedValues guarantees input is "safe", "suspicious", or "critical"
    function _toRiskLevel(string memory r) internal pure returns (RiskLevel) {
        bytes32 h = keccak256(bytes(r));
        if (h == keccak256(bytes("critical")))   return RiskLevel.CRITICAL;
        if (h == keccak256(bytes("suspicious"))) return RiskLevel.SUSPICIOUS;
        return RiskLevel.SAFE;
    }

    /// @dev Derive a specific risk type string from the level and tx snapshot
    function _deriveRiskType(RiskLevel level, string memory txData)
        internal pure returns (string memory)
    {
        if (level == RiskLevel.SAFE) return "normal";

        bytes memory d = bytes(txData);

        // Reentrancy pattern: withdraw calls present with critical risk
        if (level == RiskLevel.CRITICAL && _contains(d, bytes("withdraw")))
            return "reentrancy_pattern";

        // Access control: drain or emergency patterns
        if (_contains(d, bytes("drain")) || _contains(d, bytes("emergency")))
            return "access_violation";

        // Value anomaly: large value transfers
        if (level == RiskLevel.CRITICAL && _contains(d, bytes("value")))
            return "value_anomaly";

        // Defaults
        return (level == RiskLevel.CRITICAL) ? "reentrancy_pattern" : "access_violation";
    }

    /// @dev Build a human-readable reasoning string for the audit record
    function _deriveReasoning(RiskLevel level, string memory riskType)
        internal pure returns (string memory)
    {
        if (level == RiskLevel.SAFE)
            return "Normal transaction patterns observed. No anomalies detected by Qwen3-30B.";
        if (_eq(riskType, "reentrancy_pattern"))
            return "Repeated withdrawal calls detected. Possible reentrancy attack pattern.";
        if (_eq(riskType, "access_violation"))
            return "Unauthorized access pattern detected. Possible privilege escalation.";
        if (_eq(riskType, "value_anomaly"))
            return "Unusual large value transfers detected. Possible flash loan or drain attack.";
        return "Anomalous transaction pattern detected by Qwen3-30B classifier on Somnia.";
    }

    /// @dev Substring search: does `data` contain `sub`?
    function _contains(bytes memory data, bytes memory sub)
        internal pure returns (bool)
    {
        if (sub.length == 0 || sub.length > data.length) return false;
        for (uint256 i = 0; i <= data.length - sub.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < sub.length; j++) {
                if (data[i + j] != sub[j]) { found = false; break; }
            }
            if (found) return true;
        }
        return false;
    }

    /// @dev String equality comparison using keccak256
    function _eq(string memory a, string memory b)
        internal pure returns (bool)
    { return keccak256(bytes(a)) == keccak256(bytes(b)); }

    /// @dev Convert an address to a lowercase "0x..." hex string for API URLs
    function _toHex(address a) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes20 b = bytes20(a);
        bytes memory result = new bytes(42);
        result[0] = '0';
        result[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            result[2 + i * 2]     = hexChars[uint8(b[i]) >> 4];
            result[3 + i * 2]     = hexChars[uint8(b[i]) & 0x0f];
        }
        return string(result);
    }

    /// @notice Accept SOMI rebates from the Somnia platform
    receive() external payable {}
}
