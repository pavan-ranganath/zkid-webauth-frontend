import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  PromiEvent,
  TransactionReceipt,
  EventResponse,
  EventData,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';

export interface CallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

export interface SendOptions {
  from: string;
  value?: number | string | BN | BigNumber;
  gasPrice?: string;
  gas?: number;
}

export interface EstimateGasOptions {
  from?: string;
  value?: number | string | BN | BigNumber;
  gas?: number;
}

export interface MethodPayableReturnContext {
  send(options: SendOptions): PromiEvent<TransactionReceipt>;
  send(
    options: SendOptions,
    callback: (error: Error, result: any) => void
  ): PromiEvent<TransactionReceipt>;
  estimateGas(options: EstimateGasOptions): Promise<number>;
  estimateGas(
    options: EstimateGasOptions,
    callback: (error: Error, result: any) => void
  ): Promise<number>;
  encodeABI(): string;
}

export interface MethodConstantReturnContext<TCallReturn> {
  call(): Promise<TCallReturn>;
  call(options: CallOptions): Promise<TCallReturn>;
  call(
    options: CallOptions,
    callback: (error: Error, result: TCallReturn) => void
  ): Promise<TCallReturn>;
  encodeABI(): string;
}

export interface MethodReturnContext extends MethodPayableReturnContext {}

export type ContractContext = Web3ContractContext<
  Zkid,
  ZkidMethodNames,
  ZkidEventsContext,
  ZkidEvents
>;
export type ZkidEvents = 'OwnershipTransferred';
export interface ZkidEventsContext {
  OwnershipTransferred(
    parameters: {
      filter?: {
        previousOwner?: string | string[];
        newOwner?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
}
export type ZkidMethodNames =
  | 'new'
  | 'attestDMVData'
  | 'owner'
  | 'renounceOwnership'
  | 'submitDMVdata'
  | 'transferOwnership'
  | 'userAddressToDMVData';
export interface OwnershipTransferredEventEmittedResponse {
  previousOwner: string;
  newOwner: string;
}
export interface SubmitDMVdataRequest {
  attestorPublicAddress: string;
  name: string;
  DL_no: string;
  dob: string;
  postal_address: string;
  dataHash: string;
  attested: boolean;
}
export interface UserAddressToDMVDataResponse {
  attestorPublicAddress: string;
  name: string;
  DL_no: string;
  dob: string;
  postal_address: string;
  dataHash: string;
  attested: boolean;
}
export interface Zkid {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   */
  'new'(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param userAddress Type: address, Indexed: false
   * @param attest Type: bool, Indexed: false
   */
  attestDMVData(userAddress: string, attest: boolean): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  owner(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  renounceOwnership(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param data Type: tuple, Indexed: false
   */
  submitDMVdata(data: SubmitDMVdataRequest): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newOwner Type: address, Indexed: false
   */
  transferOwnership(newOwner: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   */
  userAddressToDMVData(
    parameter0: string
  ): MethodConstantReturnContext<UserAddressToDMVDataResponse>;
}
