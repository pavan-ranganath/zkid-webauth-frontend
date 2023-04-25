
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Component({ templateUrl: 'verify-email.component.html' })
export class VerifyEmailComponent implements OnInit {
    isEmailVerifiedReq: boolean = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.route.queryParams
        .subscribe(params => {
            const token = params.token
            if (token) {
                this.accountService.verifyEmail(token)
                    .pipe(first())
                    .subscribe({
                        next: () => {
                            this.isEmailVerifiedReq = true;
                        },
                        error: error => {
                            console.log(error);
                            this.alertService.error(error);
                            this.isEmailVerifiedReq = false;
                        },
                    })
            }
        });
    }
}