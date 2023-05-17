import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Injectable({ providedIn: 'root' })
export class CommonService {

    constructor() { }

        readFileContent(file: File): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                if (!file) {
                    resolve('');
                }
    
                const reader = new FileReader();
                let text = '';
                reader.onload = (e) => {
                    if(reader.result) {
                         text = reader.result.toString();
                    }
                    
                    resolve(text);
    
                };
    
                reader.readAsText(file);
            });
        }
}