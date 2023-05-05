import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService, DmvRecordService } from '@app/_services';
import { encryptWithSharedKey, signEncode } from '@app/_helpers/ed25519Wrapper';
import * as libSodiumWrapper from 'libsodium-wrappers';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

@Component({ templateUrl: 'add-dmv-record.component.html' })
export class AddDmvRecordComponent implements OnInit {

    form!: FormGroup;
    id?: string;
    title!: string;
    loading = false;
    submitting = false;
    submitted = false;
    dmvAttestors = [
        {
            id: 'DC',
            name: 'Washington DC DMV'
        },
        {
            id: 'CA',
            name: 'California DMV'
        }
    ];

    constructor(
        private formBuilder: FormBuilder,
        private alertService: AlertService,
        private dmvRecordService: DmvRecordService,
        private accountService: AccountService
    ) { }

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            name: ['pavan ranganath', Validators.required],
            DL_no: ['123456789', Validators.required],
            dob: ['09/07/1994', Validators.required],
            address: ['37 18th cross 20th main, vijaynagar', Validators.required],
            attestor: ['CA', Validators.required],
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }
        this.submitting = true;
        console.log(this.form.value);
        let keyStore = this.accountService.keyStoreValue; 
        console.log(keyStore);
        // console.log(this.accountService.sharedKeyValue)
        // var nonce = libSodiumWrapper.randombytes_buf(libSodiumWrapper.crypto_box_NONCEBYTES)
        // let encryptedData = encryptWithSharedKey(JSON.stringify(this.form.value),decodeBase64(this.accountService.sharedKeyValue),nonce)
        this.dmvRecordService.add({data:this.form.value,signedData:signEncode(JSON.stringify(this.form.value),decodeBase64(keyStore.privateKey))}).subscribe(
            {
                next: (succResp) => {
                    console.log(succResp);
                    this.alertService.success("Submit success!!")
                },
                error: (error) => {
                    this.alertService.error(error);
                    this.submitting = false;
                    this.submitted = false;
                },
                complete: () => {
                    this.submitted = false;
                    this.submitting = false;
                },
            }
        )
    }
}