// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract EmergencyPause is PausableUpgradeable, OwnableUpgradeable {
    event EmergencyPauseActivated(address indexed by);
    event EmergencyPauseDeactivated(address indexed by);
    
    function emergencyPause() external onlyOwner {
        _pause();
        emit EmergencyPauseActivated(msg.sender);
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyPauseDeactivated(msg.sender);
    }
}
