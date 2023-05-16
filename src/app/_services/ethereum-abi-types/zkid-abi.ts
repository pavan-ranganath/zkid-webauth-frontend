import { AbiItem } from "web3-utils/types/index";
export const zkid_address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const zkid_abi: AbiItem[] = [
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
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "userAddress",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "attest",
          "type": "bool"
        }
      ],
      "name": "attestDMVData",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "attestorPublicAddress",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "DL_no",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "dob",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "postal_address",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "dataHash",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "attested",
              "type": "bool"
            }
          ],
          "internalType": "struct Zkid.DMVAttestation",
          "name": "data",
          "type": "tuple"
        }
      ],
      "name": "submitDMVdata",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userAddressToDMVData",
      "outputs": [
        {
          "internalType": "address",
          "name": "attestorPublicAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "DL_no",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "dob",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "postal_address",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "dataHash",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "attested",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]