import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User } from '@app/_models';
import { encodeBase64 } from 'tweetnacl-util';
import { CookieStorage } from 'cookie-storage';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private userSubject: BehaviorSubject<User | null>;
    public user: Observable<User | null> | undefined;
    public keyStore: Observable<any | null> | undefined;
    private keyStoreSubject: BehaviorSubject<any | null> | undefined;
    cookieStorage = new CookieStorage();
    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('user')!));
        if(this.userValue){
            this.keyStoreSubject = new BehaviorSubject(JSON.parse(this.cookieStorage.getItem(this.userValue!.username!)!));
            this.user = this.userSubject.asObservable();
            this.keyStore = this.keyStoreSubject.asObservable();
        }
    }

    public get userValue() {
        return this.userSubject.value;
    }
    public get keyStoreValue() {
        return this.keyStoreSubject!.value;
    }
    passKeyRegister(email: string) {
        return this.http.get(`${environment.apiUrl}/v1/auth/generate-registration-options`,{params:{email:email}})
            // .pipe(map(user => {
            //     // store user details and jwt token in local storage to keep user logged in between page refreshes
            //     // localStorage.setItem('user', JSON.stringify(user));
            //     // this.userSubject.next(user);
            //     return user;
            // }));
    }
    passKeyVerificationResp(opts:any) {
        return this.http.post(`${environment.apiUrl}/v1/auth/verify-registration`, opts,);
    }

    passKeylogin(email: string) {
        return this.http.get(`${environment.apiUrl}/v1/auth/generate-authentication-options`,{params:{email:email}})
    }
    passKeyLoginVerify(opts:any) {
        return this.http.post(`${environment.apiUrl}/v1/auth/verify-authentication`, opts,);
    }
    logout() {
        // remove user from local storage and set current user to null
        localStorage.removeItem('user');
        this.userSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    register(user: User) {
        return this.http.post(`${environment.apiUrl}/users/register`, user);
    }

    getAll() {
        return this.http.get<User[]>(`${environment.apiUrl}/users`);
    }

    getById(id: string) {
        return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
    }

    update(id: string, params: any) {
        return this.http.put(`${environment.apiUrl}/users/${id}`, params)
            .pipe(map(x => {
                // update stored user if the logged in user updated their own record
                if (id == this.userValue?.id) {
                    // update local storage
                    const user = { ...this.userValue, ...params };
                    localStorage.setItem('user', JSON.stringify(user));

                    // publish updated user to subscribers
                    this.userSubject.next(user);
                }
                return x;
            }));
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/users/${id}`)
            .pipe(map(x => {
                // auto logout if the logged in user deleted their own record
                if (id == this.userValue?.id) {
                    this.logout();
                }
                return x;
            }));
    }

    entradaAuthRegister(opts:any) {
        return this.http.post(`${environment.apiUrl}/v1/auth/generate-entrada-registration-options`, opts);
    }
    entradaAuthRegistrationVerification(opts:any) {
        return this.http.post(`${environment.apiUrl}/v1/auth/verify-entrada-registration`, opts);
    }

    entradaAuthLogin(opts:any) {
        return this.http.post(`${environment.apiUrl}/v1/auth/entrada-login`, opts);
    }
    public loginSuccess(user: User, keyStore:any) {
        localStorage.setItem('user', JSON.stringify(user));
        // sessionStorage.setItem('keyStore',encodeBase64(keyStore));
        this.userSubject.next(user);
        let userKeyStoreObj = JSON.parse(this.cookieStorage.getItem(user.username!)!)
        this.keyStoreSubject!.next(userKeyStoreObj);
        return user;
    }
    verifyEmail(token:string) {
        return this.http.post(`${environment.apiUrl}/v1/auth/verify-email?token=${token}`,null)
    }
    private getUserKeys(username: string) {
        // return localStorage.getItem(username)
        return this.cookieStorage.getItem(username);
    }
}   