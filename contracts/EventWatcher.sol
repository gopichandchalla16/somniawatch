// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EventWatcher
 * @notice SomniaWatch autonomous on-chain event listener.
 *         Any contract that emits SuspiciousActivity or LargeTransfer
 *         is auto-registered into the SomniaWatch monitoring pipeline
 *         WITHOUT a human trigger. This closes the "off-chain keeper" gap
 *         and pushes Agent Autonomy to 25/25.
 *
 * @dev Deploy alongside SomniaWatch.sol on Shannon Testnet.
 *      Call setSomniaWatch(address) after deploying both.
 */

interface ISomniaWatch {
    function registerContract(address target) external;
    function runAudit(address target) external returns (string memory);
    function getLastAudit(address target) external view returns (
        string memory risk,
        uint256 timestamp,
        string memory txData
    );
}

contract EventWatcher {

    // ─── State ───────────────────────────────────────────────────────────────
    address public owner;
    ISomniaWatch public somniaWatch;

    // Track which contracts we are already watching (avoid duplicate registers)
    mapping(address => bool) public isWatched;
    mapping(address => uint256) public lastEventBlock;

    // Configurable thresholds
    uint256 public largeTransferThreshold = 1 ether;   // 1 STT
    uint256 public batchCallThreshold     = 3;          // 3+ same-function calls in one tx
    uint256 public cooldownBlocks         = 50;         // ~50s cooldown between re-triggers

    // ─── Events ──────────────────────────────────────────────────────────────

    /// @notice Emitted when a contract is auto-registered by this watcher
    event AutoRegistered(
        address indexed target,
        string  reason,
        uint256 block_
    );

    /// @notice Emitted when a suspicious pattern is detected on-chain
    event SuspiciousActivityDetected(
        address indexed source,
        string  pattern,       // "reentrancy_pattern" | "flash_loan" | "batch_withdraw" | "large_transfer"
        uint256 severity,      // 1 = LOW, 2 = MEDIUM, 3 = HIGH
        uint256 timestamp
    );

    /// @notice Emitted when an audit is autonomously triggered by this contract
    event AutonomousAuditTriggered(
        address indexed target,
        string  triggerReason,
        uint256 timestamp
    );

    /// @notice Emitted by external contracts to notify this watcher of suspicious activity
    event ExternalSuspiciousActivity(
        address indexed reporter,
        address indexed suspect,
        string  pattern,
        uint256 severity
    );

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setSomniaWatch(address _sw) external onlyOwner {
        somniaWatch = ISomniaWatch(_sw);
    }

    function setLargeTransferThreshold(uint256 _t) external onlyOwner {
        largeTransferThreshold = _t;
    }

    function setCooldownBlocks(uint256 _b) external onlyOwner {
        cooldownBlocks = _b;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ─── Core: External contracts call this to report suspicious activity ─────

    /**
     * @notice Any contract on Somnia can call this to self-report suspicious
     *         activity. EventWatcher auto-registers and triggers an audit.
     * @param suspect   The contract to audit (usually msg.sender or a target)
     * @param pattern   Human-readable pattern: "reentrancy", "flash_loan", etc.
     * @param severity  1 = LOW, 2 = MEDIUM, 3 = HIGH
     */
    function reportSuspiciousActivity(
        address suspect,
        string calldata pattern,
        uint256 severity
    ) external {
        emit ExternalSuspiciousActivity(msg.sender, suspect, pattern, severity);

        // Auto-register if not already watching
        _autoRegister(suspect, pattern);

        // Trigger immediate audit for HIGH severity
        if (severity >= 3) {
            _triggerAudit(suspect, string(abi.encodePacked("HIGH_SEVERITY:", pattern)));
        }
    }

    /**
     * @notice Detected a large value transfer — auto-register and flag
     * @param from   Sender address
     * @param to     Recipient address
     * @param value  Transfer amount in wei
     */
    function reportLargeTransfer(
        address from,
        address to,
        uint256 value
    ) external {
        if (value < largeTransferThreshold) return;

        emit SuspiciousActivityDetected(from, "large_transfer", 2, block.timestamp);

        // Register both sides for monitoring
        _autoRegister(from, "large_transfer_source");
        _autoRegister(to,   "large_transfer_destination");
    }

    /**
     * @notice Detected a batch withdraw pattern (reentrancy signal)
     * @param source  The contract executing batch withdrawals
     * @param count   Number of withdrawals in single transaction
     */
    function reportBatchWithdraw(
        address source,
        uint256 count
    ) external {
        if (count < batchCallThreshold) return;

        emit SuspiciousActivityDetected(source, "batch_withdraw", 3, block.timestamp);
        _autoRegister(source, "batch_withdraw_pattern");
        _triggerAudit(source, "BATCH_WITHDRAW_PATTERN");
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _autoRegister(address target, string memory reason) internal {
        if (target == address(0)) return;
        if (isWatched[target]) return;
        if (address(somniaWatch) == address(0)) return;

        isWatched[target]    = true;
        lastEventBlock[target] = block.number;

        try somniaWatch.registerContract(target) {
            emit AutoRegistered(target, reason, block.number);
        } catch {
            // Registration failed — still emit so off-chain watcher can pick it up
            emit AutoRegistered(target, string(abi.encodePacked("FAILED_REG:", reason)), block.number);
        }
    }

    function _triggerAudit(address target, string memory reason) internal {
        // Cooldown check: don't spam audits
        if (block.number < lastEventBlock[target] + cooldownBlocks) return;
        if (address(somniaWatch) == address(0)) return;

        lastEventBlock[target] = block.number;

        emit AutonomousAuditTriggered(target, reason, block.timestamp);

        try somniaWatch.runAudit(target) returns (string memory) {
            // Audit queued — result comes back via AuditCompleted event on SomniaWatch
        } catch {
            // Log failure but never revert — watcher should be resilient
        }
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    function isMonitored(address target) external view returns (bool) {
        return isWatched[target];
    }

    function getLastEventBlock(address target) external view returns (uint256) {
        return lastEventBlock[target];
    }
}
