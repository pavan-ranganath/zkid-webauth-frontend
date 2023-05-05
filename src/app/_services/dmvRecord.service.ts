import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '@environments/environment';
import { User } from '@app/_models';
import { AccountService } from './account.service';

@Injectable({ providedIn: 'root' })
export class DmvRecordService {
    keyStore: any;

    constructor(private router: Router,
        private accountService:AccountService,
        private http: HttpClient) {
             this.keyStore = this.accountService.keyStoreValue; 
        }
        
    add(opts:any) {
        let headers: HttpHeaders = new HttpHeaders({ 'public-address': this.keyStore.publicKey })
        return this.http.post(`${environment.apiUrl}/v1/dmv-record`, opts,{
            headers: headers
        });
    }
    getAll() {
        return this.http.get<User[]>(`${environment.apiUrl}/v1/dmv-record`);
    }
    getById(id: string) {
        return this.http.get<User>(`${environment.apiUrl}/v1/dmv-record/${id}`);
    }
    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/v1/dmv-record/${id}`, params);    
    }
    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/v1/dmv-record/${id}`);
    }
}