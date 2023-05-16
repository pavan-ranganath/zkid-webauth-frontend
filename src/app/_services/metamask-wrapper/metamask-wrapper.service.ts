import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { sha256 } from 'js-sha256';

@Injectable({
  providedIn: 'root'
})
export class MetamaskWrapperService {
  web3: Web3 | undefined = undefined; // Will hold the web3 instance
  publicAddress: string | undefined;

  constructor() {
    this.web3 = new Web3((window as any).ethereum);
    console.log(this.web3);
    this.getPublicAddress();
  }

  async getPublicAddress() {
    const coinbase = await this.web3!.eth.getCoinbase();
    console.log(coinbase);
    if (!coinbase) {
      window.alert('Please activate MetaMask first.');
      return;
    }

    this.publicAddress = coinbase.toLowerCase();

  }

  async signData(data: string) {
    let signature: string = ''
    try {
      signature = await this.web3!.eth.personal.sign(
        data,
        this.publicAddress!,
        '' // MetaMask will ignore the password argument here
      );
    } catch (err) {
      console.log(err)
      throw new Error(
        'You need to sign the message to be able to log in.'
      );
    }
    return signature;
  }
  createSha256Hash(arg0: string | undefined) {
    return sha256(arg0!).toString()
  }
}
