import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';


import { AccountService, AlertService } from '@app/_services';
import { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    form!: FormGroup;
    loading = false;
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
        this.form = this.formBuilder.group({
            email: ['', Validators.required],
            // password: ['', Validators.required]
        });
        this.loginForm = this.formBuilder.group({
            email: ['', Validators.required],
            // password: ['', Validators.required]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }
    get fLogin() { return this.loginForm.controls; }
    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        this.accountService.passKeyRegister(this.f.email.value)
            .pipe(first())
            .subscribe({
                next: (opts: any) => {
                    startRegistration(opts).then(
                        (asseResp) => {
                            console.log('startRegistration', asseResp);
                            this.accountService.passKeyVerificationResp(asseResp).subscribe(
                                {
                                    next: (value) =>{
                                        console.log('verificationResp', value)
                                        alert("Registration completed")
                                    },
                                    error: (err) =>{
                                        console.error('verificationErrResp', err)
                                    },
                                    complete: () => {
                                        this.loading = false;
                                    },
                                }
                            )
                        },
                        (err) => { console.error('(asseResp)', err); },
                    )

                    // get return url from query parameters or default to home page

                    console.log(opts);
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

    loginOnSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();
        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }
        this.loginLoading = true;
        this.accountService.passKeylogin(this.f.email.value)
        .pipe(first())
        .subscribe({
                next: async (opts: any)=>{
                    let assesResp = await startAuthentication(opts)
                    this.verifyLogin(assesResp);
                },
                error: (error) => {
                    this.alertService.error(error);
                    this.loading = false;
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