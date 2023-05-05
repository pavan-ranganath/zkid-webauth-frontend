import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Injectable({ providedIn: 'root' })
export class CommonService {

    constructor(private router: Router,
        private http: HttpClient) { }

    
}