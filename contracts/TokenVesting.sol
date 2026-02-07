// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @dev A contract for linear token vesting with a cliff period.
 */
contract TokenVesting is Ownable, ReentrancyGuard {
    struct VestingSchedule {
        address beneficiary;
        uint256 start;
        uint256 cliff;
        uint256 duration;
        uint256 totalAmount;
        uint256 releasedAmount;
        bool revoked;
    }

    IERC20 public immutable token;
    mapping(address => VestingSchedule) public vestingSchedules;

    event VestingScheduleCreated(address indexed beneficiary, uint256 amount);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);

    constructor(address _token, address _initialOwner) Ownable(_initialOwner) {
        token = IERC20(_token);
    }

    function createVestingSchedule(
        address _beneficiary,
        uint256 _start,
        uint256 _cliffDuration,
        uint256 _duration,
        uint256 _amount
    ) external onlyOwner {
        require(_beneficiary != address(0), "Beneficiary cannot be 0");
        require(_amount > 0, "Amount must be > 0");
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Schedule already exists");

        vestingSchedules[_beneficiary] = VestingSchedule({
            beneficiary: _beneficiary,
            start: _start,
            cliff: _start + _cliffDuration,
            duration: _duration,
            totalAmount: _amount,
            releasedAmount: 0,
            revoked: false
        });

        emit VestingScheduleCreated(_beneficiary, _amount);
    }

    function release() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule found");
        require(!schedule.revoked, "Vesting revoked");

        uint256 releasable = _calculateReleasableAmount(schedule);
        require(releasable > 0, "No tokens releasable");

        schedule.releasedAmount += releasable;
        token.transfer(schedule.beneficiary, releasable);

        emit TokensReleased(schedule.beneficiary, releasable);
    }

    function revoke(address _beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(schedule.totalAmount > 0, "No schedule found");
        require(!schedule.revoked, "Already revoked");

        schedule.revoked = true;
        emit VestingRevoked(_beneficiary);
    }

    function _calculateReleasableAmount(VestingSchedule memory _schedule) internal view returns (uint256) {
        if (block.timestamp < _schedule.cliff) {
            return 0;
        } else if (block.timestamp >= _schedule.start + _schedule.duration) {
            return _schedule.totalAmount - _schedule.releasedAmount;
        } else {
            uint256 timeFromStart = block.timestamp - _schedule.start;
            uint256 vestedAmount = (_schedule.totalAmount * timeFromStart) / _schedule.duration;
            return vestedAmount - _schedule.releasedAmount;
        }
    }

    function getReleasableAmount(address _beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];
        if (schedule.revoked) return 0;
        return _calculateReleasableAmount(schedule);
    }
}
