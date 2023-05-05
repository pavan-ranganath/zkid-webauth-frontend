import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DmvRoutingModule } from './dmv-routing.module';
import { LayoutComponent } from './layout.component';
import { AddDmvRecordComponent } from './add-dmv-record.component';


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DmvRoutingModule
    ],
    declarations: [
        LayoutComponent,
        AddDmvRecordComponent
    ]
})
export class DmvModule { }