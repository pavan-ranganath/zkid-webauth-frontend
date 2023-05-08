import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService, DmvAttestorsService, DmvRecordService } from '@app/_services';
import { encryptWithSharedKey, signEncode } from '@app/_helpers/ed25519Wrapper';
import * as libSodiumWrapper from 'libsodium-wrappers';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { DMVAttestors } from '@app/_models';

@Component({ templateUrl: 'add-dmv-record.component.html' })
export class AddDmvRecordComponent implements OnInit {

    form!: FormGroup;
    id?: string;
    title!: string;
    loading = false;
    submitting = false;
    submitted = false;
    dmvRecordData: any;
    dmvAttestors: DMVAttestors[] = [
        // {
        //     id: 'DC',
        //     name: 'Washington DC DMV'
        // },
        // {
        //     id: 'CA',
        //     name: 'California DMV'
        // }
    ];
    readOnly: boolean = false;

    constructor(
        private formBuilder: FormBuilder,
        private alertService: AlertService,
        private dmvRecordService: DmvRecordService,
        private accountService: AccountService,
        private dmvAttestorsService: DmvAttestorsService
    ) { }

    ngOnInit(): void {
        // this.loading = true;
        this.form = this.formBuilder.group({
            name: ['', Validators.required],
            DL_no: ['', Validators.required],
            dob: ['', Validators.required],
            address: ['', Validators.required],
            attestor: ['', Validators.required],

        });
        this.getDmvAttestors();
        this.getDMVDetailsIfExists()
    }
    getDmvAttestors() {
        this.dmvAttestorsService.getAll().subscribe(
            {
                next: (value) => {
                    console.log(value);
                    this.dmvAttestors = value.results;
                },
                error: (error) => { },
                complete: () => { }
            }
        )
    }
    getDMVDetailsIfExists() {
        this.dmvRecordService.getByUserId(this.accountService.userValue?.id!).subscribe(
            {
                next: (value) => {
                    this.dmvRecordData = value;
                    this.form.setValue({
                        name: value.name,
                        DL_no: value.DL_no,
                        dob: value.dob,
                        address: value.address,
                        attestor: value.attestor
                    });
                    this.readOnly = true
                }, error: (err) => {

                }, complete: () => {
                    // this.loading = false;
                },
            }
        )
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
        this.dmvRecordService.add({ data: this.form.value, signedData: signEncode(JSON.stringify(this.form.value), decodeBase64(keyStore.privateKey)) }).subscribe(
            {
                next: (succResp) => {
                    console.log(succResp);
                    this.alertService.success("Submit success!!")
                    this.getDMVDetailsIfExists()
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