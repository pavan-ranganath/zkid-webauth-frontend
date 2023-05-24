import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { startRegistration } from '@simplewebauthn/browser';

import { AccountService, AlertService } from '@app/_services';
// import { sign, decryptWithSharedKey, encryptWithSharedKey, generateKeyPair, generateSharedKey } from '@app/_helpers/ed25519Wrapper';
import {
    decodeBase64,
    decodeUTF8,
    encodeBase64,
    encodeUTF8,
} from 'tweetnacl-util';
import * as libSodiumWrapper from "libsodium-wrappers";

import { KeyPair, StringKeyPair, randombytes_buf } from 'libsodium-wrappers';
import { CookieStorage } from 'cookie-storage';
import { CommonService } from '@app/_services/common.service';
import { readOpenSslKeys, sign, getSharedKey, verifySign, decryptWithSharedKey, readOpenSslPrivateKeys, convertEd25519PrivateKeyToCurve25519, convertEd25519PublicKeyToCurve25519,encryptWithSharedKey } from '@app/_helpers/ed25519NewWrapper';
const zKID = 'ZKID_v1';


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
        private common: CommonService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['pavan ranganath', Validators.required],
            username: ['pavanr@entradasolutions.com', Validators.required],
            privateKey: ['', Validators.required],
            publicKey: ['', Validators.required]
        });

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


        this.loading = true;

        // let privKey = (await this.common.readFileContent(this.form.value.privateKey)).split('\n')[1]
        // let pubKey = (await this.common.readFileContent(this.form.value.publicKey)).split('\n')[1]
        let privKey = (await this.common.readFileContent(this.form.value.privateKey))
        let pubKey = (await this.common.readFileContent(this.form.value.publicKey))
        let plainMsg = `I, ${this.form.value.name} would like to register with email "${this.form.value.username}" to ${zKID} service`;
        let paredKeyPair = readOpenSslKeys(privKey, pubKey)
        let signedMsg = sign(plainMsg, paredKeyPair.privateKey)

        // let reqObj = { ...this.form.value}
        // delete reqObj['privateKey']
        this.accountService.entradaAuthRegister({ username: this.form.value.username, name: this.form.value.name, publicKey: pubKey, plainMsg: plainMsg, signedMsg: signedMsg.toHex() })
            .pipe(first())
            .subscribe({
                next: (opts: any) => {
                    this.storeUserKeys(
                        this.form.value['username'], 
                        { 
                            username: this.form.value.username, 
                            pivateKey: Buffer.from(paredKeyPair.privateKey).toString('base64'),  
                            publicKey: Buffer.from(paredKeyPair.publicKey).toString('base64')
                        });
                    // get return url from query parameters or default to home page
                    this.challengeReceived(opts, paredKeyPair.privateKey, paredKeyPair.publicKey, this.form.value['username']);
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
        this.cookieStorage.setItem(username, JSON.stringify(value), {
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
    async challengeReceived(respObj: any, clientPrivateKey: any, clientPublicKey: any, username: string) {
        const signedChallengeEncrypt = respObj.signedChallengeEncrypt;
        const challengeEncrypt = respObj.challengeEncrypt;
        const ephemeralPubKey = Buffer.from(respObj.ephemeralPubKey, "base64");
        const userId = respObj.userId;

        // TODO: VERIFY SIGNATURE
        // if (!verifySign(signedChallengeEncrypt,challengeEncrypt,(ephemeralPubKey))) {
        //     this.alertService.error('Invalid Signature');
        //     return;
        // }

        // GENERATE SHARED SECRET
        let sharedKey = getSharedKey(
            convertEd25519PrivateKeyToCurve25519(clientPrivateKey),
            convertEd25519PublicKeyToCurve25519(ephemeralPubKey)
        )

        console.log('Client shared key (Base64):', Buffer.from(sharedKey).toString('base64'));

        // DECRYPT CHALLENGE USING USER PUBLIC KEY 
        let challenge = decryptWithSharedKey(challengeEncrypt, sharedKey);

        // ENCRYPT CHALLENGE USING SHARED  KEY
        // var nonce = libSodiumWrapper.randombytes_buf(libSodiumWrapper.crypto_box_NONCEBYTES,"base64")
        // let challengeEncryptWithSharedKey = encryptWithSharedKey(challenge, sharedKey, nonce)

        // CREATE MESSAGE AND SIGN
        let msgObj = {
            username: username,
            challenge: challenge,
            userId: userId
        }
        let encryptedData = encryptWithSharedKey(JSON.stringify(msgObj),sharedKey)
        let afterSignature = sign(encryptedData, clientPrivateKey);
        let reqObj = {
            signature: afterSignature.toHex(),
            encryptedData: encryptedData,
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
                    let plainRegistrationCode = decryptWithSharedKey(registrationCode, sharedKey)
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
function addOneYear(date: any) {
    date.setFullYear(date.getFullYear() + 1);
    return date;
}