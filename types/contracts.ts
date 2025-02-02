export const CertificateNFTAbi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "courseName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "issueDate",
                "type": "uint256"
            }
        ],
        "name": "CertificateIssued",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "getCertificate",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "courseName",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "recipientName",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "issueDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "issuerName",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "isValid",
                        "type": "bool"
                    }
                ],
                "internalType": "struct CertificateNFT.Certificate",
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
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "courseName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "recipientName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "issuerName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "tokenURI",
                "type": "string"
            }
        ],
        "name": "issueCertificate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
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
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "revokeCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const PaymentTrackerAbi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "InvalidAmount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidPin",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "SessionAlreadyExists",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "SessionNotFound",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "kraPin",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "sessionId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "SessionCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "sessionId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "enum PaymentTracker.SessionStatus",
                "name": "status",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "SessionStatusUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "sessionId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "paymentReference",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "PaymentRecorded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "sessionId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "kraPin",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "createSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "cartId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "CartCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "cartId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "enum PaymentTracker.CartStatus",
                "name": "status",
                "type": "uint8"
            }
        ],
        "name": "CartUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "cartId",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "createCart",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "cartId",
                "type": "string"
            }
        ],
        "name": "processPayment",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getUserCarts",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "cartId",
                        "type": "string"
                    },
                    {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "createdAt",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "lastUpdated",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isPaid",
                        "type": "bool"
                    },
                    {
                        "internalType": "enum PaymentTracker.CartStatus",
                        "name": "status",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct PaymentTracker.Cart[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
