import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';
import { DMVAttestors } from '@app/_models';

export class dmvAtteestorsResp {
    results!: DMVAttestors[];
    page!:number;
    limit!:number;
    totalPages!:number;
    totalResults!:number;
}

@Injectable({ providedIn: 'root' })
export class DmvAttestorsService {
    constructor(
        private http: HttpClient) {
    }

    getAll() {
        return this.http.get<dmvAtteestorsResp>(`${environment.apiUrl}/v1/dmv-attestor`);
    }
    getById(id: string) {
        return this.http.get<DMVAttestors>(`${environment.apiUrl}/v1/dmv-attestor/${id}`);
    }
}