import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DmvRoutingModule } from './dmv-routing.module';
import { LayoutComponent } from './layout.component';
import { AddDmvUserComponent } from './add-dmv-user.component';


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DmvRoutingModule
    ],
    declarations: [
        LayoutComponent,
        AddDmvUserComponent
    ]
})
export class DmvModule { }