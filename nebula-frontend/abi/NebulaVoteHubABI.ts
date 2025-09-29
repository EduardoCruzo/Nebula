export const NebulaVoteHubABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "curator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "openAt",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "closeAt",
          "type": "uint64"
        }
      ],
      "name": "MotionCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "author",
          "type": "address"
        }
      ],
      "name": "ShieldSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint32[]",
          "name": "counts",
          "type": "uint32[]"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "proof",
          "type": "string"
        }
      ],
      "name": "SnapshotFinalized",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "choices",
          "type": "string[]"
        },
        {
          "internalType": "uint64",
          "name": "openAt",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "closeAt",
          "type": "uint64"
        },
        {
          "internalType": "uint32",
          "name": "quota",
          "type": "uint32"
        }
      ],
      "name": "createMotion",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "name": "encryptedAggregationOf",
      "outputs": [
        {
          "internalType": "euint32[]",
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        },
        {
          "internalType": "uint32[]",
          "name": "counts",
          "type": "uint32[]"
        },
        {
          "internalType": "string",
          "name": "proof",
          "type": "string"
        }
      ],
      "name": "finalizeSnapshot",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "name": "motionPhase",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "motionsCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "name": "quotaMaxPerAddress",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "name": "quotaUsedBy",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "name": "readMotion",
      "outputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "choices",
          "type": "string[]"
        },
        {
          "internalType": "uint64",
          "name": "openAt",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "closeAt",
          "type": "uint64"
        },
        {
          "internalType": "bool",
          "name": "finalized",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "curator",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        }
      ],
      "name": "snapshotOf",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "motionId",
              "type": "uint256"
            },
            {
              "internalType": "uint32[]",
              "name": "counts",
              "type": "uint32[]"
            },
            {
              "internalType": "string",
              "name": "proof",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "ts",
              "type": "uint64"
            }
          ],
          "internalType": "struct NebulaVoteHub.Snapshot",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32",
          "name": "input",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "submitShieldIndex",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "motionId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32[]",
          "name": "onehot",
          "type": "bytes32[]"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "submitShieldOneHot",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;