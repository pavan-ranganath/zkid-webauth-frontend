import { Component } from '@angular/core';
import Web3 from 'web3';
declare var window: any;
let web3: Web3 | undefined = undefined;
import { AccountService } from './_services';
import { User } from './_models';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    user?: User | null;

    constructor(private accountService: AccountService) {
        if(this.accountService.user) {
            this.accountService.user.subscribe(x => this.user = x);
            // this.check().then((succ)=>{
    
            // },(err) => {
            //  console.error(err);
            // }) 
        }
       
    }

    logout() {
        this.accountService.logout();
    }
    async check() {
        if(!await (window as any).ethereum) {
          window.alert('Please install MetaMask first.');
        }
        if (!web3) {
                try {
                    // Request account access if needed
                    await (window as any).ethereum.enable();
    
                    // We don't know window.web3 version, so we use our own instance of Web3
                    // with the injected provider given by MetaMask
                    web3 = new Web3((window as any).ethereum);
                } catch (error) {
                    window.alert('You need to allow MetaMask.');
                    return;
                }
            }
      }
    
}