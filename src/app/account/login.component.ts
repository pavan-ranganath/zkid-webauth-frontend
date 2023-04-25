import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';


import { AccountService, AlertService } from '@app/_services';
import { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';
import { CookieStorage } from 'cookie-storage';
import { signEncode } from '@app/_helpers/ed25519Wrapper';
import { decodeBase64 } from 'tweetnacl-util';

@Component({ templateUrl: 'login.component.html' })
// export class LoginComponent implements OnInit {
//     submitted = false;
//     loginForm!: FormGroup;
//     loginLoading = false;

//     constructor(
//         private formBuilder: FormBuilder,
//         private route: ActivatedRoute,
//         private router: Router,
//         private accountService: AccountService,
//         private alertService: AlertService
//     ) { }

//     ngOnInit() {

//         this.loginForm = this.formBuilder.group({
//             email: ['', Validators.required],
//             // password: ['', Validators.required]
//         });
//     }

//     get fLogin() { return this.loginForm.controls; }

//     loginOnSubmit() {
//         let credential: Credential | null;
//         this.submitted = true;

//         // reset alerts on submit
//         this.alertService.clear();
//         // stop here if form is invalid
//         if (this.loginForm.invalid) {
//             return;
//         }
//         this.loginLoading = true;
//         this.accountService.passKeylogin(this.fLogin.email.value)
//         .pipe(first())
//         .subscribe({
//                 next: async (opts: any)=>{
//                     try {
//                         // crypto.subtle.encrypt()
//                         credential = (await navigator.credentials.get());
//                     }
//                     catch (err) {
//                         console.error(err);
//                     }
//                     if (!credential) {
//                         throw new Error('Authentication was not completed');
//                     }
//                     // let assesResp = await startAuthentication(opts)
//                     // this.verifyLogin(assesResp);
//                 },
//                 error: (error) => {
//                     this.alertService.error(error);
//                     this.loginLoading = false;
//                 },
//                 complete: () => {

//                 },

//             })
//     }

//     private verifyLogin(assesResp:AuthenticationResponseJSON) {
//         this.accountService.passKeyLoginVerify(assesResp).subscribe({
//             next: (value) => {
//                 console.log('passKeyLoginVerify', value)
//                 alert("Authentication completed")
//             },
//             error: (err) => {
//                 console.error('verificationErrResp', err);
//             },
//             complete: () => {
//                 this.loginLoading = false;
//             },
//         });
//     }
// }
export class LoginComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    registerDisabled = false;
    loginDisabled = false;
    userInfo: any;
    userList: any[] | undefined = [];
    cookieStorage = new CookieStorage();

    constructor(
        private formBuilder: FormBuilder,
        private accountService: AccountService,
        private alertService: AlertService,
        private router: Router,
        private route: ActivatedRoute,
        // private cookieStorage:CookieStorage
    ) { }

    ngOnInit() {

        this.form = this.formBuilder.group({
            // name: ['', Validators.required],
            username: ['', Validators.required],
            // password: ['', Validators.required]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }
    private getUserKeys(username: string) {
        // return localStorage.getItem(username)
        return this.cookieStorage.getItem(username);
    }
    login() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }
        this.loading = true;


        const username = this.form.value.username
        let userKeyStore = this.getUserKeys(username)
        if (!userKeyStore) {
            alert("Error!!, keystore not found")
            return
        }
        let keyStoreObj = JSON.parse(userKeyStore)
        // CREATE MESSAGE AND SIGN
        let plainMsg = `I, ${username} would like to login with my challenge code: ${keyStoreObj.registrationCode} with user ID: ${keyStoreObj.userId}`;
        let signedMsg = signEncode(plainMsg, decodeBase64(keyStoreObj.privateKey));

        let reqObj = {
            username: username,
            signedMsg: signedMsg,
            plainMsg: plainMsg
        }
        this.accountService.entradaAuthLogin(reqObj)
            .pipe(first())
            .subscribe({
                next: (succResp: any) => {
                    console.log("succResp",succResp);
                    this.accountService.loginSuccess(succResp.user)
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
}