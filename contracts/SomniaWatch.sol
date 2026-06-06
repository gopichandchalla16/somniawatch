// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISomniaAgents.sol";

/// @title  SomniaWatch
/// @notice Autonomous smart contract security guardian on Somnia Agentic L1
/// @author Gopichand Challa - Somnia Agentathon 2026
contract SomniaWatch {

    IAgentRequester public immutable platform;

    uint256 public constant JSON_AGENT_ID       = 13174292974160097713;
    uint256 public constant LLM_AGENT_ID        = 12847293847561029384;

    // Hardcoded deposits — avoids calling platform.getRequestDeposit() which reverts on testnet
    // JSON agent: 0.04 STT x 3 validators = 0.12 STT. Send 0.13 to cover platform reserve.
    // LLM  agent: 0.08 STT x 3 validators = 0.24 STT. Send 0.25 to cover platform reserve.
    uint256 public constant JSON_DEPOSIT        = 0.13 ether;
    uint256 public constant LLM_DEPOSIT         = 0.25 ether;
    uint256 public constant SUBCOMMITTEE_SIZE   = 3;
    uint256 public constant MIN_INTERVAL        = 5 minutes;

    string public explorerApiBase = "https://shannon-explorer.somnia.network/api/v2/addresses/";

    enum RiskLevel  { SAFE, SUSPICIOUS, CRITICAL }
    enum CheckStage { AWAITING_TX_DATA, AWAITING_CLASSIFICATION }

    struct ContractProfile {
        address owner;
        bool    isRegistered;
        bool    isFlagged;
        uint8   riskScore;
        uint256 lastChecked;
        uint256 totalChecks;
        string  lastRiskType;
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
    }

    mapping(address => ContractProfile) public  registry;
    mapping(address => AuditRecord[])   public  auditHistory;
    mapping(uint256 => PendingCheck)    private pendingChecks;

    address[] public registeredContracts;
    uint256   public totalAuditsCompleted;
    address   public watchAdmin;

    event ContractRegistered(address indexed target, address indexed owner);
    event MonitorTriggered  (address indexed target, uint256 requestId, uint256 deposit);
    event TxDataReceived    (address indexed target, uint256 jsonReqId, uint256 llmReqId);
    event RiskClassified    (address indexed target, uint8 riskLevel, string riskType, uint256 receiptId);
    event ContractFlagged   (address indexed target, string riskType, uint256 receiptId);
    event ContractCleared   (address indexed target);
    event AgentCallFailed   (address indexed target, uint256 requestId, string reason);
    event Funded            (address indexed by, uint256 amount);

    constructor(address _platform) {
        require(_platform != address(0), "Invalid platform");
        platform   = IAgentRequester(_platform);
        watchAdmin = msg.sender;
    }

    function registerContract(address target) external {
        require(target != address(0),           "Zero address");
        require(!registry[target].isRegistered, "Already registered");
        require(target != address(this),        "Cannot self-register");
        registry[target] = ContractProfile(msg.sender, true, false, 0, 0, 0, "unscanned");
        registeredContracts.push(target);
        emit ContractRegistered(target, msg.sender);
    }

    function triggerMonitor(address target) external payable returns (uint256 requestId) {
        ContractProfile storage profile = registry[target];
        require(profile.isRegistered, "Not registered");
        require(block.timestamp >= profile.lastChecked + MIN_INTERVAL, "Too soon");
        // Use hardcoded JSON_DEPOSIT — no platform call needed
        require(address(this).balance + msg.value >= JSON_DEPOSIT, "Insufficient SOMI: fund() first");

        string memory apiUrl = string(abi.encodePacked(
            explorerApiBase, _toHex(target), "/transactions?limit=20"
        ));
        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchString.selector, apiUrl, "items"
        );

        requestId = platform.createRequest{value: JSON_DEPOSIT}(
            JSON_AGENT_ID, address(this), this.handleTxDataResponse.selector, payload
        );

        pendingChecks[requestId] = PendingCheck(target, CheckStage.AWAITING_TX_DATA, "");
        profile.lastChecked = block.timestamp;
        profile.totalChecks++;
        if (msg.value > JSON_DEPOSIT) payable(msg.sender).transfer(msg.value - JSON_DEPOSIT);
        emit MonitorTriggered(target, requestId, JSON_DEPOSIT);
    }

    function handleTxDataResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory
    ) external {
        require(msg.sender == address(platform), "Platform only");
        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0), "Unknown requestId");
        require(pc.stage == CheckStage.AWAITING_TX_DATA, "Wrong stage");
        address target = pc.target;

        if (uint8(status) != 0 || responses.length == 0) {
            string memory reason = uint8(status) == 1 ? "json_agent_failed" : "json_agent_timeout";
            emit AgentCallFailed(target, requestId, reason);
            delete pendingChecks[requestId];
            return;
        }

        string memory txData = abi.decode(responses[0].result, (string));

        string memory userPrompt = string(abi.encodePacked(
            "Analyze this smart contract transaction data for security threats: [",
            txData,
            "]. Detect: (1) REENTRANCY: repeated withdraw calls. "
            "(2) ACCESS VIOLATION: unauthorized privileged calls. "
            "(3) VALUE ANOMALY: large unexpected transfers. Classify risk."
        ));
        string memory systemPrompt =
            "You are SomniaWatch, autonomous smart contract security classifier on Somnia Agentic L1. "
            "Classifications are consensus-validated by 3 validators and stored on-chain. "
            "safe=no anomalies, suspicious=unusual not confirmed, critical=clear attack pattern.";

        string[] memory allowedValues = new string[](3);
        allowedValues[0] = "safe";
        allowedValues[1] = "suspicious";
        allowedValues[2] = "critical";

        bytes memory llmPayload = abi.encodeWithSelector(
            ILLMInferenceAgent.inferString.selector,
            userPrompt, systemPrompt, false, allowedValues
        );

        require(address(this).balance >= LLM_DEPOSIT, "Insufficient SOMI for LLM: fund() first");

        uint256 llmReqId = platform.createRequest{value: LLM_DEPOSIT}(
            LLM_AGENT_ID, address(this), this.handleClassificationResponse.selector, llmPayload
        );

        pendingChecks[llmReqId] = PendingCheck(target, CheckStage.AWAITING_CLASSIFICATION, txData);
        delete pendingChecks[requestId];
        emit TxDataReceived(target, requestId, llmReqId);
    }

    function handleClassificationResponse(
        uint256        requestId,
        Response[]     memory responses,
        ResponseStatus status,
        Request        memory
    ) external {
        require(msg.sender == address(platform), "Platform only");
        PendingCheck storage pc = pendingChecks[requestId];
        require(pc.target != address(0), "Unknown requestId");
        address target = pc.target;
        string memory txSS = pc.txSnapshot;

        if (uint8(status) != 0 || responses.length == 0) {
            _storeAudit(target, RiskLevel.SAFE, "unknown", "Agent unavailable - retry next cycle", requestId, false);
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
            registry[target].riskScore    = 10;
            registry[target].lastRiskType = riskType;
        }

        _storeAudit(target, riskLevel, riskType, reasoning, requestId, autoActioned);
        totalAuditsCompleted++;
        emit RiskClassified(target, uint8(riskLevel), riskType, requestId);
        delete pendingChecks[requestId];
    }

    function fund() external payable {
        require(msg.value > 0, "Must send SOMI");
        emit Funded(msg.sender, msg.value);
    }

    function clearFlag(address target) external {
        require(msg.sender == registry[target].owner || msg.sender == watchAdmin, "Not authorized");
        require(registry[target].isFlagged, "Not flagged");
        registry[target].isFlagged = false;
        registry[target].riskScore = 0;
        emit ContractCleared(target);
    }

    function updateExplorer(string calldata newBase) external {
        require(msg.sender == watchAdmin, "Admin only");
        explorerApiBase = newBase;
    }

    function getAuditHistory(address target) external view returns (AuditRecord[] memory) {
        return auditHistory[target];
    }

    function getLatestAudit(address target) external view returns (AuditRecord memory) {
        require(auditHistory[target].length > 0, "No audits yet");
        return auditHistory[target][auditHistory[target].length - 1];
    }

    function getAllRegistered() external view returns (address[] memory) {
        return registeredContracts;
    }

    function getRegisteredCount() external view returns (uint256) {
        return registeredContracts.length;
    }

    // Pure view — no platform call, safe to call anytime
    function depositForFullCycle() external pure returns (uint256) {
        return JSON_DEPOSIT + LLM_DEPOSIT;
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _storeAudit(address target, RiskLevel riskLevel, string memory riskType,
        string memory reasoning, uint256 receiptId, bool autoActioned) internal {
        auditHistory[target].push(AuditRecord(
            target, riskLevel, riskType, reasoning, block.timestamp, receiptId, autoActioned
        ));
    }

    function _toRiskLevel(string memory r) internal pure returns (RiskLevel) {
        bytes32 h = keccak256(bytes(r));
        if (h == keccak256(bytes("critical")))   return RiskLevel.CRITICAL;
        if (h == keccak256(bytes("suspicious"))) return RiskLevel.SUSPICIOUS;
        return RiskLevel.SAFE;
    }

    function _deriveRiskType(RiskLevel level, string memory txData) internal pure returns (string memory) {
        if (level == RiskLevel.SAFE) return "normal";
        bytes memory d = bytes(txData);
        if (level == RiskLevel.CRITICAL && _contains(d, bytes("withdraw"))) return "reentrancy_pattern";
        if (_contains(d, bytes("drain")) || _contains(d, bytes("emergency"))) return "access_violation";
        if (level == RiskLevel.CRITICAL && _contains(d, bytes("value"))) return "value_anomaly";
        return level == RiskLevel.CRITICAL ? "reentrancy_pattern" : "access_violation";
    }

    function _deriveReasoning(RiskLevel level, string memory riskType) internal pure returns (string memory) {
        if (level == RiskLevel.SAFE) return "Normal transaction patterns. No anomalies detected by Qwen3-30B.";
        if (_eq(riskType, "reentrancy_pattern")) return "Repeated withdrawal calls detected. Possible reentrancy attack.";
        if (_eq(riskType, "access_violation"))   return "Unauthorized access pattern detected. Possible privilege escalation.";
        if (_eq(riskType, "value_anomaly"))       return "Unusual large value transfers. Possible flash loan or drain attack.";
        return "Anomalous transaction pattern detected by Qwen3-30B on Somnia.";
    }

    function _contains(bytes memory data, bytes memory sub) internal pure returns (bool) {
        if (sub.length == 0 || sub.length > data.length) return false;
        for (uint256 i = 0; i <= data.length - sub.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < sub.length; j++) {
                if (data[i+j] != sub[j]) { found = false; break; }
            }
            if (found) return true;
        }
        return false;
    }

    function _eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    function _toHex(address a) internal pure returns (string memory) {
        bytes memory h = "0123456789abcdef";
        bytes20 b = bytes20(a);
        bytes memory r = new bytes(42);
        r[0] = '0'; r[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            r[2+i*2]   = h[uint8(b[i]) >> 4];
            r[3+i*2]   = h[uint8(b[i]) & 0x0f];
        }
        return string(r);
    }

    receive() external payable {}
}
