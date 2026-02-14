// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WithdrawalSafety
 * @dev Implements the pull-over-push pattern for secure ether withdrawals.
 */
contract WithdrawalSafety {
    mapping(address => uint256) public pendingWithdrawals;
    
    event WithdrawalRequested(address indexed to, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    function _safeWithdraw(address to, uint256 amount) internal {
        pendingWithdrawals[to] += amount;
        emit WithdrawalRequested(to, amount);
    }
    
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(msg.sender, amount);
    }
}
