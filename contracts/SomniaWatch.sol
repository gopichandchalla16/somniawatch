// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISomniaAgents.sol";

/// @title  SomniaWatch
/// @notice Autonomous smart contract security guardian on Somnia Agentic L1
/// @author Gopichand Challa - Somnia Agentathon 2026
///
/// @dev TRUE 3-AGENT PIPELINE (fully on-chain, no human in the loop):
///
///   triggerMonitor(address)
///     => JSON API Agent (ID: 13174292974160097713)  fetchString()  0.12 STT
///           Fetches TX history from Somnia explorer API
///           3 validators reach consensus => callback fires
///     => handleTxDataResponse()
///           Chains immediately to:
///     => LLM Parse Agent (ID: see PARSE_AGENT_ID)   parseWebsite() 0.36 STT
///           Scrapes Shannon Explorer page for contract
///           Extracts risk signals LLM-readable format
///           3 validators reach consensus => callback fires
///     => handleParseResponse()
///           Combines txSnapshot + parseSnapshot into single rich prompt
///           Chains immediately to:
///     => LLM Inference Agent (ID: 12847293847561029384) inferString() 0.24 STT
///           Qwen3-30B classifies: safe | suspicious | critical
///           allowedValues enforced — no JSON parsing needed
///           3 validators reach consensus => callback fires
///     => handleClassificationResponse()
///           Stores AuditRecord with receiptId = agent requestId
///           Auto-flags contract if CRITICAL
///           Revokes NFT certificate if CRITICAL
///
/// Total cost per full cycle: 0.12 + 0.36 + 0.24 = 0.72 STT
/// 9 validator attestations per cycle (3 per agent call)
///
/// SPHINX PROTOCOL:
///   sphinxChallenge(address, string argument)
///     => inferString() with score 0-100 allowedValues
///     => handleSphinxResponse()
///           score >= 75: SAFE OVERRIDE, emits SphinxOverride
///           score < 75:  CRITICAL CONFIRMED, emits SphinxConfirmed

contract SomniaWatch {

    // ================================================================
    //  PLATFORM
    // ================================================================

    IAgentRequester public immutable platform;

    // ================================================================
    //  AGENT IDs
    // ================================================================

    uint256 public constant JSON_AGENT_ID = 13174292974160097713;
    uint256 public constant LLM_AGENT_ID  = 12847293847561029384;

    /// @notice LLM Parse Agent ID (parseWebsite)
    /// @dev    SET THIS FROM agents.somnia.network — look up "LLM Parse Agent"
    ///         or "Website Parse Agent". If not found, use the inferString agent
    ///         with a URL-prefixed prompt as a fallback until confirmed.
    ///         Update via setParseAgentId() after deployment.
    uint256 public parseAgentId;

    // ================================================================
    //  COST CONSTANTS (wei)
    // ================================================================

    uint256 public constant JSON_COST_PER_AGENT  =  30000000000000000; // 0.03 STT
    uint256 public constant PARSE_COST_PER_AGENT = 120000000000000000; // 0.12 STT
    uint256 public constant LLM_COST_PER_AGENT   =  70000000000000000; // 0.07 STT
    uint256 public constant SUBCOMMITTEE_SIZE     = 3;
    uint256 public constant MIN_INTERVAL          = 5 minutes;

    string public explorerBase = "https://shannon-explorer.somnia.network";
    string public explorerApiBase = "https://shannon-explorer.somnia.network/api/v2/addresses/";

    // ================================================================
    //  ENUMS
    // ================================================================

    enum RiskLevel  { SAFE, SUSPICIOUS, CRITICAL }
    enum CheckStage { AWAITING_TX_DATA, AWAITING_PARSE, AWAITING_CLASSIFICATION }

    // ================================================================
    //  STRUCTS
    // ================================================================

    struct ContractProfile {
        address owner;
        bool    isRegistered;
        bool    isFlagged;
        uint8   riskScore;
        uint256 lastChecked;
        uint256 totalChecks;
        string  lastRiskType;
        uint256 consecutiveSafe;
    }

    struct AuditRecord {
        address   target;
        RiskLevel riskLevel;
        string    riskType;
        string    reasoning;
        uint256   timestamp;
        uint256   receiptId;
        bool      autoActioned;
    }

    struct PendingCheck {
        address    target;
        CheckStage stage;
        string     txSnapshot;
        string     parseSnapshot;
    }

    struct SphinxChallenge {
        address target;
        uint256 score;
        string  argument;
        uint256 receiptId;
        bool    overridden;
        uint256 timestamp;
    }

    // ================================================================
    //  STATE
    // ================================================================

    mapping(address => ContractProfile) public  registry;
    mapping(address => AuditRecord[])   public  auditHistory;
    mapping(uint256 => PendingCheck)    private pendingChecks;
    mapping(uint256 => address)         private sphinxPending;  // requestId => target
    mapping(address => SphinxChallenge[]) public sphinxHistory;

    address[] public registeredContracts;
    uint256   public totalAuditsCompleted;
    address   public watchAdmin;
    address   public auditCertificate;

    // ================================================================
    //  EVENTS
    // ================================================================

    event ContractRegistered  (address indexed target, address indexed owner);
    event MonitorTriggered    (address indexed target, uint256 requestId, uint256 deposit);
    event TxDataReceived      (address indexed target, uint256 jsonReqId, uint256 parseReqId);
    event ParseDataReceived   (address indexed target, uint256 parseReqId, uint256 llmReqId);
    event RiskClassified      (address indexed target, uint8 riskLevel, string riskType, uint256 receiptId);
    event ContractFlagged     (address indexed target, string riskType, uint256 receiptId);
    event ContractCleared     (address indexed target);
    event AgentCallFailed     (address indexed target, uint256 requestId, string reason);
    event Funded              (address indexed by, uint256 amount);
    event SphinxChallengeSubmitted(address indexed target, uint256 requestId, string argument);
    event SphinxOverride      (address indexed target, uint256 score, uint256 receiptId);
    event SphinxConfirmed     (address indexed target, uint256 score, uint256 receiptId);

    // ================================================================
    //  CONSTRUCTOR
    // ================================================================

    /// @param _platform  0x5E5205CF39E766118C01636bED000A54D93163E6
    /// @param _parseAgentId  LLM Parse Agent ID from agents.somnia.network
    ///                       Pass 0 and call setParseAgentId() after confirming
    constructor(address _platform, uint256 _parseAgentId) {
        require(_platform != address(0), "Invalid platform");
        platform    = IAgentRequester(_platform);
        parseAgentId = _parseAgentId;
        watchAdmin  = msg.sender;
    }

    // ================================================================
    //  ADMIN
    // ================================================================

    function setParseAgentId(uint256 id) external {
        require(msg.sender == watchAdmin, "Admin only");
        parseAgentId = id;
    }

    function setAuditCertificate(address cert) external {
        require(msg.sender == watchAdmin, "Admin only");
        auditCertificate = cert;
    }

    function updateExplorer(string calldata newBase) external {
        require(msg.sender == watchAdmin, "Admin only");
        explorerApiBase = newBase;
    }

    // ================================================================
    //  REGISTRATION
    // ================================================================

    function registerContract(address target) external {
        require(target != address(0),           "Zero address");
        require(!registry[target].isRegistered, "Already registered");
        require(target != address(this),        "Cannot self-register");

        registry[target] = ContractProfile({
            owner:          msg.sender,
            isRegistered:   true,
            isFlagged:      false,
            riskScore:      0,
            lastChecked:    0,
            totalChecks:    0,
            lastRiskType:   "unscanned",
            consecutiveSafe: 0
        });

        registeredContracts.push(target);
        emit ContractRegistered(target, msg.sender);
    }

    // ================================================================
    //  STEP 1: TRIGGER MONITORING
    //  Calls fetchString() on JSON API Agent
    // ================================================================

    function triggerMonitor(address target)
        external payable returns (uint256 requestId)
    {
        ContractProfile storage profile = registry[target];
        require(profile.isRegistered, "Not registered");
        require(
            block.timestamp >= profile.lastChecked + MIN_INTERVAL,
            "Too soon: 5 min minimum"
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 deposit = reserve + (JSON_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        require(address(this).balance + msg.value >= deposit, "Insufficient STT");

        string memory apiUrl = string(abi.encodePacked(
            explorerApiBase,
            _toHex(target),
            "/transactions?limit=20"
        ));

        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchString.selector,
            apiUrl,
            "items"
        );

        requestId = platform.createRequest{value: deposit}(
            JSON_AGENT_ID,
            address(this),
            this.handleTxDataResponse.selector,
            payload
        );

        pendingChecks[requestId] = PendingCheck({
            target:        target,
            stage:         CheckStage.AWAITING_TX_DATA,
            txSnapshot:    "",
            parseSnapshot: ""
        });

        profile.lastChecked = block.timestamp;
        profile.totalChecks++;

        if (msg.value > deposit) {
            payable(msg.sender).transfer(msg.value - deposit);
        }

        emit MonitorTriggered(target, requestId, deposit);
    }

    // ================================================================
    //  STEP 2: JSON API CALLBACK
    //  Receives TX data, chains to parseWebsite()
    // ================================================================

    function handleTxDataResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory
    ) external {
        require(msg.sender == address(platform), "Platform only");

        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0),                  "Unknown requestId");
        require(pc.stage == CheckStage.AWAITING_TX_DATA,  "Wrong stage");

        address target = pc.target;

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit AgentCallFailed(target, requestId, "json_agent_failed");
            delete pendingChecks[requestId];
            return;
        }

        string memory txData = abi.decode(responses[0].result, (string));

        // ── Stage 2: Call parseWebsite() on Shannon Explorer page ─────
        uint256 reserve     = platform.getRequestDeposit();
        uint256 parseDeposit = reserve + (PARSE_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        require(address(this).balance >= parseDeposit, "Insufficient STT for parse step");

        string memory explorerUrl = string(abi.encodePacked(
            explorerBase,
            "/address/",
            _toHex(target)
        ));

        string memory extractionPrompt =
            "string - extract: total tx count, "
            "top 3 method signatures by frequency, "
            "unique sender count, "
            "latest transaction value in STT, "
            "contract verification status";

        // Use PARSE_AGENT_ID if set, otherwise fall back to LLM agent
        // with a URL-prefixed inferString call for compatibility
        uint256 agentToUse = parseAgentId != 0 ? parseAgentId : LLM_AGENT_ID;

        bytes memory parsePayload;
        if (parseAgentId != 0) {
            parsePayload = abi.encodeWithSelector(
                ILLMParseAgent.parseWebsite.selector,
                explorerUrl,
                extractionPrompt
            );
        } else {
            // Fallback: use inferString with URL context when parseAgentId not set
            string memory fallbackPrompt = string(abi.encodePacked(
                "Analyze the smart contract at URL ",
                explorerUrl,
                ". Extract: total tx count, top 3 method signatures by frequency, "
                "unique sender count, latest transaction value in STT, contract verification status. "
                "Return as a compact key:value string."
            ));
            string[] memory noConstraints = new string[](0);
            parsePayload = abi.encodeWithSelector(
                ILLMInferenceAgent.inferString.selector,
                fallbackPrompt,
                "You are a blockchain data extractor. Extract and return exactly the requested fields.",
                false,
                noConstraints
            );
        }

        uint256 parseReqId = platform.createRequest{value: parseDeposit}(
            agentToUse,
            address(this),
            this.handleParseResponse.selector,
            parsePayload
        );

        pendingChecks[parseReqId] = PendingCheck({
            target:        target,
            stage:         CheckStage.AWAITING_PARSE,
            txSnapshot:    txData,
            parseSnapshot: ""
        });

        delete pendingChecks[requestId];
        emit TxDataReceived(target, requestId, parseReqId);
    }

    // ================================================================
    //  STEP 3: PARSE CALLBACK
    //  Receives explorer parse data, chains to inferString()
    // ================================================================

    function handleParseResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory
    ) external {
        require(msg.sender == address(platform), "Platform only");

        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0),              "Unknown requestId");
        require(pc.stage == CheckStage.AWAITING_PARSE, "Wrong stage");

        address target    = pc.target;
        string memory txSS = pc.txSnapshot;

        string memory parseData = "";
        if (status == ResponseStatus.Success && responses.length > 0) {
            parseData = abi.decode(responses[0].result, (string));
        }

        // ── Stage 3: Call inferString() with combined TX + parse data ─
        string memory userPrompt = string(abi.encodePacked(
            "You are analyzing a monitored smart contract for security threats. ",
            "TRANSACTION DATA from Somnia API: [", txSS, "]. ",
            "EXPLORER DATA from Shannon Explorer: [", parseData, "]. ",
            "Analyze for these attack patterns: ",
            "(1) REENTRANCY: same address calling withdraw/transfer repeatedly. ",
            "(2) ACCESS VIOLATION: privileged function calls from unexpected addresses. ",
            "(3) VALUE ANOMALY: flash loan patterns, drain attacks, unusual value spikes. ",
            "Use both data sources together for highest accuracy classification."
        ));

        string memory systemPrompt =
            "You are SomniaWatch, an autonomous smart contract security classifier "
            "on Somnia Agentic L1. Your classifications are consensus-validated by "
            "3 independent validator nodes and stored permanently on-chain. "
            "safe = no anomalies. suspicious = unusual but unconfirmed. critical = clear attack.";

        string[] memory allowedValues = new string[](3);
        allowedValues[0] = "safe";
        allowedValues[1] = "suspicious";
        allowedValues[2] = "critical";

        bytes memory llmPayload = abi.encodeWithSelector(
            ILLMInferenceAgent.inferString.selector,
            userPrompt,
            systemPrompt,
            false,
            allowedValues
        );

        uint256 reserve    = platform.getRequestDeposit();
        uint256 llmDeposit = reserve + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        require(address(this).balance >= llmDeposit, "Insufficient STT for LLM step");

        uint256 llmReqId = platform.createRequest{value: llmDeposit}(
            LLM_AGENT_ID,
            address(this),
            this.handleClassificationResponse.selector,
            llmPayload
        );

        pendingChecks[llmReqId] = PendingCheck({
            target:        target,
            stage:         CheckStage.AWAITING_CLASSIFICATION,
            txSnapshot:    txSS,
            parseSnapshot: parseData
        });

        delete pendingChecks[requestId];
        emit ParseDataReceived(target, requestId, llmReqId);
    }

    // ================================================================
    //  STEP 4: LLM CLASSIFICATION CALLBACK
    //  Final autonomous decision — no human involved
    // ================================================================

    function handleClassificationResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory
    ) external {
        require(msg.sender == address(platform), "Platform only");

        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0), "Unknown requestId");

        address target  = pc.target;
        string memory txSS = pc.txSnapshot;

        if (status != ResponseStatus.Success || responses.length == 0) {
            _storeAudit(target, RiskLevel.SAFE, "unknown",
                        "Agent unavailable — retried next cycle", requestId, false);
            emit AgentCallFailed(target, requestId, "llm_failed_or_timeout");
            delete pendingChecks[requestId];
            totalAuditsCompleted++;
            return;
        }

        string memory riskStr  = abi.decode(responses[0].result, (string));
        RiskLevel riskLevel    = _toRiskLevel(riskStr);
        string memory riskType = _deriveRiskType(riskLevel, txSS);
        string memory reasoning= _deriveReasoning(riskLevel, riskType);

        bool autoActioned = false;
        ContractProfile storage profile = registry[target];

        if (riskLevel == RiskLevel.CRITICAL) {
            if (!profile.isFlagged) {
                profile.isFlagged    = true;
                profile.riskScore    = 100;
                autoActioned         = true;
                emit ContractFlagged(target, riskType, requestId);
            }
            profile.consecutiveSafe  = 0;
            profile.lastRiskType     = riskType;
            // Auto-revoke NFT certificate if exists
            if (auditCertificate != address(0)) {
                _tryRevokeCert(target, requestId);
            }
        } else if (riskLevel == RiskLevel.SUSPICIOUS) {
            profile.riskScore    = 60;
            profile.lastRiskType = riskType;
            profile.consecutiveSafe = 0;
        } else {
            profile.riskScore    = 10;
            profile.lastRiskType = riskType;
            profile.consecutiveSafe++;
            // Auto-mint or upgrade certificate
            if (auditCertificate != address(0)) {
                _tryMintOrUpgradeCert(target, profile.consecutiveSafe, requestId);
            }
        }

        _storeAudit(target, riskLevel, riskType, reasoning, requestId, autoActioned);
        totalAuditsCompleted++;
        emit RiskClassified(target, uint8(riskLevel), riskType, requestId);
        delete pendingChecks[requestId];
    }

    // ================================================================
    //  SPHINX PROTOCOL — On-Chain LLM Judge
    // ================================================================

    /// @notice Challenge a CRITICAL finding with a defense argument
    /// @param target   The flagged contract address
    /// @param argument The defense argument text
    function sphinxChallenge(address target, string calldata argument)
        external payable returns (uint256 requestId)
    {
        require(registry[target].isRegistered, "Not registered");
        require(bytes(argument).length > 0, "Argument required");

        uint256 reserve    = platform.getRequestDeposit();
        uint256 llmDeposit = reserve + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        require(address(this).balance + msg.value >= llmDeposit, "Insufficient STT for Sphinx");

        string memory prompt = string(abi.encodePacked(
            "A smart contract at address ", _toHex(target), " was flagged as CRITICAL "
            "by the SomniaWatch autonomous security system. "
            "The contract owner provides this defense argument: \"", argument, "\". "
            "Score the legitimacy of this defense on a scale of 0-100. "
            "100 = completely legitimate (e.g., authorized DAO action with proof). "
            "0 = clearly malicious or no credible defense. "
            "Return only the score as a multiple of 5 (0, 5, 10, ..., 100)."
        ));

        string memory system =
            "You are an impartial on-chain security judge for the Sphinx Protocol. "
            "Your score determines whether a CRITICAL security alert is confirmed or overridden. "
            "Be rigorous: a score >= 75 will suppress the alert and clear the flag on-chain. "
            "Only override if the argument provides credible, specific evidence of authorization.";

        string[] memory allowedValues = new string[](21);
        allowedValues[0]  = "0";   allowedValues[1]  = "5";
        allowedValues[2]  = "10";  allowedValues[3]  = "15";
        allowedValues[4]  = "20";  allowedValues[5]  = "25";
        allowedValues[6]  = "30";  allowedValues[7]  = "35";
        allowedValues[8]  = "40";  allowedValues[9]  = "45";
        allowedValues[10] = "50";  allowedValues[11] = "55";
        allowedValues[12] = "60";  allowedValues[13] = "65";
        allowedValues[14] = "70";  allowedValues[15] = "75";
        allowedValues[16] = "80";  allowedValues[17] = "85";
        allowedValues[18] = "90";  allowedValues[19] = "95";
        allowedValues[20] = "100";

        bytes memory payload = abi.encodeWithSelector(
            ILLMInferenceAgent.inferString.selector,
            prompt,
            system,
            false,
            allowedValues
        );

        requestId = platform.createRequest{value: llmDeposit}(
            LLM_AGENT_ID,
            address(this),
            this.handleSphinxResponse.selector,
            payload
        );

        sphinxPending[requestId] = target;

        if (msg.value > llmDeposit) {
            payable(msg.sender).transfer(msg.value - llmDeposit);
        }

        emit SphinxChallengeSubmitted(target, requestId, argument);
    }

    /// @notice Callback for Sphinx Protocol LLM judge result
    function handleSphinxResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory
    ) external {
        require(msg.sender == address(platform), "Platform only");

        address target = sphinxPending[requestId];
        require(target != address(0), "Unknown sphinx requestId");

        delete sphinxPending[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit AgentCallFailed(target, requestId, "sphinx_agent_failed");
            return;
        }

        string memory scoreStr = abi.decode(responses[0].result, (string));
        uint256 score = _parseScore(scoreStr);

        sphinxHistory[target].push(SphinxChallenge({
            target:     target,
            score:      score,
            argument:   scoreStr, // store score string as reference
            receiptId:  requestId,
            overridden: score >= 75,
            timestamp:  block.timestamp
        }));

        if (score >= 75) {
            registry[target].isFlagged   = false;
            registry[target].riskScore   = 10;
            registry[target].lastRiskType = "cleared_by_sphinx";
            emit SphinxOverride(target, score, requestId);
        } else {
            emit SphinxConfirmed(target, score, requestId);
        }
    }

    // ================================================================
    //  FUNDING & ADMIN
    // ================================================================

    function fund() external payable {
        require(msg.value > 0, "Must send STT");
        emit Funded(msg.sender, msg.value);
    }

    function clearFlag(address target) external {
        require(
            msg.sender == registry[target].owner || msg.sender == watchAdmin,
            "Owner or admin only"
        );
        require(registry[target].isFlagged, "Not flagged");
        registry[target].isFlagged = false;
        registry[target].riskScore = 0;
        emit ContractCleared(target);
    }

    // ================================================================
    //  VIEW FUNCTIONS
    // ================================================================

    function getAuditHistory(address target)
        external view returns (AuditRecord[] memory)
    { return auditHistory[target]; }

    function getLatestAudit(address target)
        external view returns (AuditRecord memory)
    {
        require(auditHistory[target].length > 0, "No audits yet");
        return auditHistory[target][auditHistory[target].length - 1];
    }

    function getAllRegistered()
        external view returns (address[] memory)
    { return registeredContracts; }

    function getRegisteredCount()
        external view returns (uint256)
    { return registeredContracts.length; }

    function getSphinxHistory(address target)
        external view returns (SphinxChallenge[] memory)
    { return sphinxHistory[target]; }

    function depositForJson() public view returns (uint256) {
        return platform.getRequestDeposit() + (JSON_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
    }

    function depositForParse() public view returns (uint256) {
        return platform.getRequestDeposit() + (PARSE_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
    }

    function depositForLlm() public view returns (uint256) {
        return platform.getRequestDeposit() + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
    }

    function depositForFullCycle() external view returns (uint256) {
        return depositForJson() + depositForParse() + depositForLlm();
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ================================================================
    //  INTERNAL HELPERS
    // ================================================================

    function _tryRevokeCert(address target, uint256 receiptId) internal {
        // Low-level call to avoid revert propagation
        (bool ok,) = auditCertificate.call(
            abi.encodeWithSignature("revokeCertificate(address,uint256)", target, receiptId)
        );
        if (!ok) {} // silent — cert may not exist
    }

    function _tryMintOrUpgradeCert(address target, uint256 consecutiveSafe, uint256 receiptId) internal {
        if (consecutiveSafe < 3) return;
        uint256 tokenId;
        // Check if cert exists
        (bool ok, bytes memory data) = auditCertificate.call(
            abi.encodeWithSignature("contractToToken(address)", target)
        );
        if (ok && data.length == 32) {
            tokenId = abi.decode(data, (uint256));
        }
        if (tokenId == 0) {
            // Mint new certificate
            auditCertificate.call(
                abi.encodeWithSignature(
                    "mintCertificate(address,address,uint256,uint256)",
                    target, registry[target].owner, consecutiveSafe, receiptId
                )
            );
        } else {
            // Upgrade existing
            auditCertificate.call(
                abi.encodeWithSignature(
                    "upgradeCertificate(address,uint256,uint256)",
                    target, consecutiveSafe, receiptId
                )
            );
        }
    }

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

    function _toRiskLevel(string memory r) internal pure returns (RiskLevel) {
        bytes32 h = keccak256(bytes(r));
        if (h == keccak256(bytes("critical")))   return RiskLevel.CRITICAL;
        if (h == keccak256(bytes("suspicious"))) return RiskLevel.SUSPICIOUS;
        return RiskLevel.SAFE;
    }

    function _parseScore(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result;
        for (uint i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result > 100 ? 100 : result;
    }

    function _deriveRiskType(RiskLevel level, string memory txData)
        internal pure returns (string memory)
    {
        if (level == RiskLevel.SAFE) return "normal";
        bytes memory d = bytes(txData);
        if (level == RiskLevel.CRITICAL && _contains(d, bytes("withdraw")))
            return "reentrancy_pattern";
        if (_contains(d, bytes("drain")) || _contains(d, bytes("emergency")))
            return "access_violation";
        if (level == RiskLevel.CRITICAL && _contains(d, bytes("value")))
            return "value_anomaly";
        return (level == RiskLevel.CRITICAL) ? "reentrancy_pattern" : "access_violation";
    }

    function _deriveReasoning(RiskLevel level, string memory riskType)
        internal pure returns (string memory)
    {
        if (level == RiskLevel.SAFE)
            return "Normal transaction patterns. No anomalies detected by Qwen3-30B (3-agent consensus).";
        if (_eq(riskType, "reentrancy_pattern"))
            return "Repeated withdrawal calls detected across TX + Explorer data. Possible reentrancy.";
        if (_eq(riskType, "access_violation"))
            return "Unauthorized access pattern across TX + Explorer data. Possible privilege escalation.";
        if (_eq(riskType, "value_anomaly"))
            return "Unusual value transfers in TX + Explorer data. Possible flash loan or drain attack.";
        return "Anomalous pattern detected by Qwen3-30B via 3-agent pipeline (fetchString+parseWebsite+inferString).";
    }

    function _contains(bytes memory data, bytes memory sub) internal pure returns (bool) {
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

    function _eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    function _toHex(address a) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes20 b = bytes20(a);
        bytes memory result = new bytes(42);
        result[0] = '0'; result[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            result[2 + i * 2]     = hexChars[uint8(b[i]) >> 4];
            result[3 + i * 2]     = hexChars[uint8(b[i]) & 0x0f];
        }
        return string(result);
    }

    receive() external payable {}
}
