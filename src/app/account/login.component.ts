import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';


import { AccountService, AlertService } from '@app/_services';
import { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    submitted = false;
    loginForm!: FormGroup;
    loginLoading = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
       
        this.loginForm = this.formBuilder.group({
            email: ['', Validators.required],
            // password: ['', Validators.required]
        });
    }

    get fLogin() { return this.loginForm.controls; }

    loginOnSubmit() {
        let credential: Credential | null;
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();
        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }
        this.loginLoading = true;
        this.accountService.passKeylogin(this.fLogin.email.value)
        .pipe(first())
        .subscribe({
                next: async (opts: any)=>{
                    try {
                        // crypto.subtle.encrypt()
                        credential = (await navigator.credentials.get());
                    }
                    catch (err) {
                        console.error(err);
                    }
                    if (!credential) {
                        throw new Error('Authentication was not completed');
                    }
                    // let assesResp = await startAuthentication(opts)
                    // this.verifyLogin(assesResp);
                },
                error: (error) => {
                    this.alertService.error(error);
                    this.loginLoading = false;
                },
                complete: () => {
                    
                },
                
            })
    }

    private verifyLogin(assesResp:AuthenticationResponseJSON) {
        this.accountService.passKeyLoginVerify(assesResp).subscribe({
            next: (value) => {
                console.log('passKeyLoginVerify', value)
                alert("Authentication completed")
            },
            error: (err) => {
                console.error('verificationErrResp', err);
            },
            complete: () => {
                this.loginLoading = false;
            },
        });
    }
}