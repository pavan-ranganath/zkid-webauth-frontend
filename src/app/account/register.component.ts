﻿import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { startRegistration } from '@simplewebauthn/browser';

import { AccountService, AlertService } from '@app/_services';
import { decryptWithSharedKey, encryptWithSharedKey, generateKeyPair, generateSharedKey, signEncode } from '@app/_helpers/ed25519Wrapper';
import {
    decodeBase64,
    decodeUTF8,
    encodeBase64,
    encodeUTF8,
} from 'tweetnacl-util';
import * as libSodiumWrapper from "libsodium-wrappers";

import { encrypt, decrypt, sign } from '../_helpers/ed25519Wrapper';
import { KeyPair, randombytes_buf } from 'libsodium-wrappers';
import { CookieStorage } from 'cookie-storage';

@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    registerDisabled = false;
    loginDisabled = false;
    userInfo: any;
    userList: any[] | undefined = [];
    cookieStorage = new CookieStorage();
    registrationSuccess = false;

    constructor(
        private formBuilder: FormBuilder,
        private accountService: AccountService,
        private alertService: AlertService,
        private router: Router,
        private route: ActivatedRoute,
        // private cookieStorage:CookieStorage
    ) { }

    ngOnInit() {
        this.getregisteredUserList()
        this.form = this.formBuilder.group({
            name: ['', Validators.required],
            username: ['', Validators.required],
            // password: ['', Validators.required]
        });
        this.form.get("username")?.valueChanges.subscribe(x => {
            this.checkUserExistsInStorage(x);
        });
    }
    private checkUserExistsInStorage(x: any) {
        if(!this.userList?.length) {
            this.registerDisabled = false;
            this.loginDisabled = true;
            return
        }
        this.userList!.forEach(element => {
            if (element === x) {
                this.registerDisabled = true;
                this.loginDisabled = false;
            } else {
                this.registerDisabled = false;
                this.loginDisabled = true;
            }
        });
    }
    
    getregisteredUserList() {
        for (let i = 0; i < this.cookieStorage.length; i++) {
            const key = this.cookieStorage.key(i)
            this.userList?.push(key);
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    // passkey
    // onSubmit() {
    //     this.submitted = true;

    //     // reset alerts on submit
    //     this.alertService.clear();

    //     // stop here if form is invalid
    //     if (this.form.invalid) {
    //         return;
    //     }

    //     this.loading = true;
    //     this.accountService.passKeyRegister(this.f.email.value)
    //     .pipe(first())
    //     .subscribe({
    //         next: (opts: any) => {
    //             startRegistration(opts).then(
    //                 (asseResp) => {
    //                     console.log('startRegistration', asseResp);
    //                     this.accountService.passKeyVerificationResp(asseResp).subscribe(
    //                         {
    //                             next: (value) =>{
    //                                 console.log('verificationResp', value)
    //                                 alert("Registration completed")
    //                                 // this.form.reset();
    //                             },
    //                             error: (err) =>{
    //                                 console.error('verificationErrResp', err)
    //                             },
    //                             complete: () => {
    //                                 this.loading = false;
    //                             },
    //                         }
    //                     )
    //                 },
    //                 (err) => { console.error('(asseResp)', err); },
    //             )

    //             // get return url from query parameters or default to home page

    //             console.log(opts);
    //         },
    //         error: error => {
    //             this.alertService.error(error);
    //             this.loading = false;
    //         },
    //         complete: () => {
    //             this.loading = false;
    //         },
    //     });
    // }

    async register() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }
        const keyPair = await generateKeyPair();
        this.loading = true;
        let reqObj = { ...this.form.value, publicKey: encodeBase64(keyPair.publicKey) }
        console.log(keyPair);
        this.accountService.entradaAuthRegister(reqObj)
            .pipe(first())
            .subscribe({
                next: (opts: any) => {
                    this.storeUserKeys(this.form.value['username'], { privateKey: encodeBase64(keyPair.privateKey), publicKey: encodeBase64(keyPair.publicKey), keyType: keyPair.keyType });
                    // get return url from query parameters or default to home page
                    this.challengeReceived(opts, keyPair, this.form.value['username']);
                    console.log(opts);
                },
                error: error => {
                    this.cookieStorage.removeItem(this.form.value['username'])
                    this.alertService.error(error);
                    this.loading = false;
                },
                complete: () => {
                    // this.loading = false;
                },
            });
    }
    private storeUserKeys(username: string, value: Object) {
        this.cookieStorage.setItem(username, JSON.stringify(value),{
            path: '/',
            domain: 'localhost',
            expires: addOneYear(new Date()),
            secure: true,
            sameSite: 'Strict' // Can be 'Strict' or 'Lax'.
          });
        // localStorage.setItem(username, JSON.stringify(value));
    }
    private getUserKeys(username: string) {
        // return localStorage.getItem(username)
        return this.cookieStorage.getItem(username);
    }
    async challengeReceived(respObj: any, userKey: KeyPair, username: string) {
        const encryptedChallenge = respObj.encryptedChallenge;
        const ephemeralPubKey = decodeBase64(respObj.ephemeralPubKey);
        const userId = respObj.userId;

        // DECRYPT CHALLENGE USING USER PUBLIC KEY 
        let challenge = decrypt(encryptedChallenge, userKey.publicKey, userKey.privateKey);

        // GENERATE SHARED SECRET
        let sharedKey = generateSharedKey(userKey.privateKey, ephemeralPubKey)
        console.log('sharedKey', encodeBase64(sharedKey));
        // ENCRYPT CHALLENGE USING SHARED  KEY
        var nonce = libSodiumWrapper.randombytes_buf(libSodiumWrapper.crypto_box_NONCEBYTES)
        let challengeEncryptWithSharedKey = encryptWithSharedKey(challenge, sharedKey, nonce)

        // CREATE MESSAGE AND SIGN
        let plainMsg = `I, ${username} would like to register with my challenge code: ${challenge} with user ID: ${userId}`;
        let signedMsg = signEncode(plainMsg, userKey.privateKey);

        let reqObj = {
            plainMsg: plainMsg,
            signedMsg: signedMsg,
            encryptedChallengeWithShared: challengeEncryptWithSharedKey,
            nonce: encodeBase64(nonce)
        }


        this.accountService.entradaAuthRegistrationVerification(reqObj)
            .pipe(first())
            .subscribe({
                next: (opts: any) => {
                    let userKeyStore = this.getUserKeys(username)
                    if (!userKeyStore) {
                        alert("Error!!, keystore not found")
                        return
                    }
                    let registrationCode = opts.registrationCode

                    // DECRYPT REGISTRATION CODE
                    let plainRegistrationCode = decryptWithSharedKey(registrationCode.encryptedData, sharedKey, decodeBase64(registrationCode.nonce))
                    let tempKeyStoreObj = JSON.parse(userKeyStore)

                    // STORE USER INFO IN LOCAL STORAGE
                    this.storeUserKeys(username, { ...tempKeyStoreObj, userId: opts.userId, registrationCode: plainRegistrationCode, name: this.form.value.name })
                    this.userInfo = { ...tempKeyStoreObj, userId: opts.userId, registrationCode: plainRegistrationCode };
                    this.registrationSuccess = true;
                    alert("SUCCESS!! REGISTRATION COMPLETED")
                },
                error: error => {
                    this.alertService.error(error);
                    // this.loading = false;
                    this.cookieStorage.removeItem(this.form.value['username'])
                },
                complete: () => {
                    this.loading = false;
                    this.registerDisabled = true;
                    this.loginDisabled = false;
                },
            });

    }

}
function addOneYear(date:any) {
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }