// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title NebulaVoteHub — 私密投票（方法名与事件命名有差异，功能等价）
contract NebulaVoteHub is SepoliaConfig {
    struct Motion {
        string title;
        string description;
        string[] choices;
        uint64 openAt;
        uint64 closeAt;
        address curator;
        bool finalized;
    }

    struct ShieldBallot {
        uint256 id;
        uint256 motionId;
        euint32 choice;
        address author;
    }

    struct Snapshot {
        uint256 motionId;
        uint32[] counts;
        string proof;
        uint64 ts;
    }

    event MotionCreated(uint256 indexed motionId, address indexed curator, string title, uint64 openAt, uint64 closeAt);
    event ShieldSubmitted(uint256 indexed motionId, address indexed author);
    event SnapshotFinalized(uint256 indexed motionId, uint32[] counts, string proof);

    uint256 private _motionSeq;
    uint256 private _ballotSeq;

    mapping(uint256 => Motion) private _motions;
    mapping(uint256 => uint256[]) private _motionBallots;
    mapping(uint256 => ShieldBallot) private _ballots;
    mapping(uint256 => mapping(address => uint32)) private _votedCount;
    mapping(uint256 => uint32) private _quotaPerAddress;
    mapping(uint256 => euint32[]) private _encryptedAggregates;
    mapping(uint256 => Snapshot) private _snapshots;

    modifier motionExists(uint256 motionId) {
        require(bytes(_motions[motionId].title).length != 0, "motion missing");
        _;
    }

    function createMotion(
        string memory title,
        string memory description,
        string[] memory choices,
        uint64 openAt,
        uint64 closeAt,
        uint32 quota
    ) external returns (uint256 motionId) {
        require(bytes(title).length > 0, "title");
        require(choices.length >= 2, "choices");
        require(closeAt > openAt && closeAt > block.timestamp, "time");
        _motionSeq += 1;
        motionId = _motionSeq;
        Motion storage m = _motions[motionId];
        m.title = title;
        m.description = description;
        m.choices = choices;
        m.openAt = openAt;
        m.closeAt = closeAt;
        m.curator = msg.sender;
        m.finalized = false;
        _quotaPerAddress[motionId] = quota == 0 ? 1 : quota;
        emit MotionCreated(motionId, msg.sender, title, openAt, closeAt);
    }

    function submitShieldIndex(uint256 motionId, externalEuint32 input, bytes calldata proof) external motionExists(motionId) {
        Motion storage m = _motions[motionId];
        require(block.timestamp >= m.openAt && block.timestamp <= m.closeAt, "window");
        uint32 used = _votedCount[motionId][msg.sender];
        require(used < _quotaPerAddress[motionId], "quota");
        _votedCount[motionId][msg.sender] = used + 1;
        euint32 enc = FHE.fromExternal(input, proof);
        FHE.allowThis(enc);
        FHE.allow(enc, msg.sender);
        _ballotSeq += 1;
        uint256 bid = _ballotSeq;
        _ballots[bid] = ShieldBallot({id: bid, motionId: motionId, choice: enc, author: msg.sender});
        _motionBallots[motionId].push(bid);
        emit ShieldSubmitted(motionId, msg.sender);
    }

    function submitShieldOneHot(uint256 motionId, externalEuint32[] calldata onehot, bytes calldata proof) external motionExists(motionId) {
        Motion storage m = _motions[motionId];
        require(block.timestamp >= m.openAt && block.timestamp <= m.closeAt, "window");
        require(onehot.length == m.choices.length, "len");
        uint32 used = _votedCount[motionId][msg.sender];
        require(used < _quotaPerAddress[motionId], "quota");
        _votedCount[motionId][msg.sender] = used + 1;
        euint32[] memory enc = new euint32[](onehot.length);
        for (uint256 i = 0; i < onehot.length; i++) {
            enc[i] = FHE.fromExternal(onehot[i], proof);
        }
        euint32[] storage agg = _encryptedAggregates[motionId];
        if (agg.length == 0) {
            for (uint256 i = 0; i < enc.length; i++) agg.push(enc[i]);
        } else {
            require(agg.length == enc.length, "agg-len");
            for (uint256 i = 0; i < enc.length; i++) {
                agg[i] = FHE.add(agg[i], enc[i]);
            }
        }
        for (uint256 i = 0; i < enc.length; i++) {
            FHE.allowThis(agg[i]);
            FHE.allow(agg[i], m.curator);
            FHE.allow(agg[i], msg.sender);
        }
        emit ShieldSubmitted(motionId, msg.sender);
    }

    function readMotion(uint256 motionId)
        external
        view
        motionExists(motionId)
        returns (string memory title, string memory description, string[] memory choices, uint64 openAt, uint64 closeAt, bool finalized, address curator)
    {
        Motion storage m = _motions[motionId];
        return (m.title, m.description, m.choices, m.openAt, m.closeAt, m.finalized, m.curator);
    }

    function motionsCount() external view returns (uint256) { return _motionSeq; }

    function motionPhase(uint256 motionId) external view motionExists(motionId) returns (uint8) {
        Motion storage m = _motions[motionId];
        if (m.finalized) return 3;
        if (block.timestamp < m.openAt) return 0;
        if (block.timestamp <= m.closeAt) return 1;
        return 2;
    }

    function encryptedAggregationOf(uint256 motionId) external view motionExists(motionId) returns (euint32[] memory) {
        euint32[] storage agg = _encryptedAggregates[motionId];
        euint32[] memory out = new euint32[](agg.length);
        for (uint256 i = 0; i < agg.length; i++) out[i] = agg[i];
        return out;
    }

    function finalizeSnapshot(uint256 motionId, uint32[] calldata counts, string calldata proof) external motionExists(motionId) {
        Motion storage m = _motions[motionId];
        require(block.timestamp > m.closeAt, "not closed");
        require(!m.finalized, "finalized");
        require(counts.length == m.choices.length, "len");
        _snapshots[motionId] = Snapshot({motionId: motionId, counts: counts, proof: proof, ts: uint64(block.timestamp)});
        m.finalized = true;
        emit SnapshotFinalized(motionId, counts, proof);
    }

    function snapshotOf(uint256 motionId) external view motionExists(motionId) returns (Snapshot memory) { return _snapshots[motionId]; }

    function quotaUsedBy(address user, uint256 motionId) external view returns (uint32) { return _votedCount[motionId][user]; }
    function quotaMaxPerAddress(uint256 motionId) external view returns (uint32) { return _quotaPerAddress[motionId]; }
}




