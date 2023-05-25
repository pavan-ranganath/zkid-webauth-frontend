import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';


import { AccountService, AlertService } from '@app/_services';
import { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';
import { CookieStorage } from 'cookie-storage';
import { convertEd25519PrivateKeyToCurve25519, convertEd25519PublicKeyToCurve25519, getSharedKey, readOpenSslKeys, sign } from '@app/_helpers/ed25519NewWrapper';
import { CommonService } from '@app/_services/common.service';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    registerDisabled = false;
    loginDisabled = false;
    userInfo: any;
    userList: any[] | undefined = [];
    cookieStorage = new CookieStorage();
    usersFromStorage!: any;

    constructor(
        private formBuilder: FormBuilder,
        private accountService: AccountService,
        private alertService: AlertService,
        private router: Router,
        private route: ActivatedRoute,
        private common: CommonService
    ) { }

    ngOnInit() {

        this.form = this.formBuilder.group({
            username: ['', Validators.required],
            privateKey: ['', Validators.required],
            publicKey: ['', Validators.required],
        });
        this.loadUsersFromStorage();
    }

    loadUsersFromStorage() {
        let _users = localStorage.getItem('users')
        if (_users) {
            this.usersFromStorage = JSON.parse(_users);
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }
    // private getUserKeys(username: string) {
    //     // return localStorage.getItem(username)
    //     return this.cookieStorage.getItem(username);
    // }
    async login() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }
        this.loading = true;


        const username = this.form.value.username

        let privKey = await this.common.readFileContent(this.form.value.privateKey)
        let pubKey = await this.common.readFileContent(this.form.value.publicKey)

        // READ openssl private key and public key
        let keyPair = readOpenSslKeys(privKey, pubKey)

        this.sendRequestToServer(
            username,
            Buffer.from(keyPair.privateKey).toString('base64'),
            Buffer.from(keyPair.publicKey).toString('base64'));
    }
    private sendRequestToServer(username: any, privateKey: string, publicKey: string) {
        let plainMsg = `I, ${username} would like to login`;
        let bufferPrivateKey = Buffer.from(privateKey, 'base64')
        let signature = sign(plainMsg, bufferPrivateKey);

        let reqObj = {
            username: username,
            signature: signature.toHex(),
            plainMsg: plainMsg
        };
        this.accountService.entradaAuthLogin(reqObj)
            .pipe(first())
            .subscribe({
                next: (succResp: any) => {
                    console.log("succResp", succResp);
                    // GENERATE SHARED SECRET
                    let sharedKey = getSharedKey(
                        convertEd25519PrivateKeyToCurve25519(bufferPrivateKey),
                        convertEd25519PublicKeyToCurve25519(Buffer.from(succResp.ephemeralPubKey, "base64"))
                    );
                    this.accountService.loginSuccess(
                        succResp.user,
                        Buffer.from(sharedKey).toString('base64')
                        );
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigateByUrl(returnUrl);
                    // this.router.navigateByUrl('/home');
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                },
                complete: () => {
                    this.loading = false;
                },
            });
    }

    loginUsingStoredDetails(userInfo: any) {
        this.sendRequestToServer(userInfo.username, userInfo.privateKey, userInfo.publicKey)
    }

}