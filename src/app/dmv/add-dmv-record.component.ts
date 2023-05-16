import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService, DmvAttestorsService, DmvRecordService } from '@app/_services';
import { encryptWithSharedKey, signEncode } from '@app/_helpers/ed25519Wrapper';
import * as libSodiumWrapper from 'libsodium-wrappers';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { DMVAttestors } from '@app/_models';

import Web3 from 'web3';
import { MetamaskWrapperService } from '@app/_services/metamask-wrapper/metamask-wrapper.service';
import { zkid_abi, zkid_address } from '@app/_services/ethereum-abi-types/zkid-abi';
import { ContractContext, SubmitDMVdataRequest } from '@app/_services/ethereum-abi-types/Zkid';
let web3: Web3 | undefined = undefined; // Will hold the web3 instance
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
    publicAddress: string = '';
    metamaskWrapperService: MetamaskWrapperService;
    contract!: ContractContext;

    constructor(
        private formBuilder: FormBuilder,
        private alertService: AlertService,
        private dmvRecordService: DmvRecordService,
        private accountService: AccountService,
        private dmvAttestorsService: DmvAttestorsService,
        _metamaskWrapperService: MetamaskWrapperService
    ) {
        this.metamaskWrapperService = _metamaskWrapperService;
        try {
            this.contract = new new Web3((window as any).ethereum).eth.Contract(zkid_abi, zkid_address) as unknown as ContractContext;
        }
        catch (error) {
            console.error(error)
        }
    }

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
        // this.setupWeb3();

    }
    setupWeb3() {
        web3 = new Web3((window as any).ethereum);
        web3.eth.getCoinbase().then(
            (succ) => {
                console.log(succ);
                this.publicAddress = succ.toLowerCase();
            },
            (err) => {
                window.alert('Please activate MetaMask first.');
                console.error(err);
                return;
            },
        );
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
    async submitToBlockChain() {
        let value = this.form.value
        this.dmvAttestorsService.getById(value.attestor).subscribe(
            {
                next: async (attestorDetails) => {
                    await this.submitDetailsToSmartContract(value, attestorDetails);
                },
                error: (err) => {

                },
            }
        )
    }

    private async submitDetailsToSmartContract(value: any, attestorDetails: DMVAttestors) {
        this.alertService.clear();
        let dmvObj = {
            name: value.name,
            DL_no: value.DL_no,
            dob: value.dob,
            postal_address: value.address,
        };
        let data: SubmitDMVdataRequest = {
            attestorPublicAddress: attestorDetails.publicAddress!,
            name: value.name,
            DL_no: value.DL_no,
            dob: value.dob,
            postal_address: value.address,
            dataHash: this.metamaskWrapperService.createSha256Hash(JSON.stringify(dmvObj)),
            attested: false
        };
        this.contract.methods.submitDMVdata(data).send({
            from: this.metamaskWrapperService.publicAddress!
        }).then(
            (succ) => {
                this.alertService.success("Transaction complete")
                this.dmvRecordService.update(this.dmvRecordData.id, { ...this.dmvRecordData, transactionReceipt: succ }).subscribe(
                    {
                        next: (value) => {
                            this.alertService.success("Update complete")
                            console.log(value);
                        },
                        error: (err) => {
                            console.error(err);
                        },
                    }
                )
                
            },
            (err) => {
                this.alertService.error("Error, transaction incomplete")
                console.error('err', err)
            }
        )
    }
}