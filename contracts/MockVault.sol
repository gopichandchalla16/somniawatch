// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  MockVault
/// @notice Demo target contract for SomniaWatch monitoring
/// @dev    Deploy this first. Run deploy.js which auto-populates it
///         with 10+ transactions to create a realistic monitoring scenario.
///         emergencyDrain() and batchWithdraw() create suspicious patterns
///         that the LLM agent will classify as CRITICAL.
contract MockVault {

    address public owner;
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    mapping(address => uint256) public balances;

    event Deposit      (address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawal   (address indexed user, uint256 amount, uint256 remaining);
    event EmergencyDrain(address indexed by, uint256 amount);
    event BatchWithdraw(address indexed user, uint256 amount, uint8 times);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Deposit STT into the vault
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        balances[msg.sender] += msg.value;
        totalDeposits        += msg.value;
        emit Deposit(msg.sender, msg.value, balances[msg.sender]);
    }

    /// @notice Withdraw STT from the vault
    /// @param amount Amount in wei to withdraw
    function withdraw(uint256 amount) external {
        require(amount > 0,                        "Amount must be > 0");
        require(balances[msg.sender] >= amount,    "Insufficient vault balance");
        require(address(this).balance >= amount,   "Insufficient contract balance");

        balances[msg.sender] -= amount;
        totalWithdrawals     += amount;

        (bool sent,) = payable(msg.sender).call{value: amount}("");
        require(sent, "STT transfer failed");

        emit Withdrawal(msg.sender, amount, balances[msg.sender]);
    }

    /// @notice Owner-only emergency drain — simulates access control vulnerability
    /// @dev This creates the "access_violation" pattern SomniaWatch detects
    function emergencyDrain() external {
        require(msg.sender == owner, "Only owner can call emergencyDrain");
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to drain");
        payable(owner).transfer(bal);
        emit EmergencyDrain(msg.sender, bal);
    }

    /// @notice Rapid repeated withdrawals — simulates reentrancy pattern for demo
    /// @dev Creates the suspicious transaction frequency pattern SomniaWatch detects
    /// @param amount Amount per withdrawal
    /// @param times  Number of rapid withdrawals (max 10)
    function batchWithdraw(uint256 amount, uint8 times) external {
        require(times > 0 && times <= 10, "Times must be 1-10");
        require(balances[msg.sender] >= amount * times, "Insufficient balance for batch");

        for (uint8 i = 0; i < times; i++) {
            balances[msg.sender] -= amount;
            totalWithdrawals     += amount;
            (bool sent,) = payable(msg.sender).call{value: amount}("");
            require(sent, "Transfer failed in batch");
        }

        emit BatchWithdraw(msg.sender, amount, times);
    }

    /// @notice Get current vault STT balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get caller's vault balance
    function myBalance() external view returns (uint256) {
        return balances[msg.sender];
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits        += msg.value;
        emit Deposit(msg.sender, msg.value, balances[msg.sender]);
    }
}
