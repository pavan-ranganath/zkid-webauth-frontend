import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { AddDmvRecordComponent } from './add-dmv-record.component';


const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            // { path: '', component: ListComponent },
            { path: 'add', component: AddDmvRecordComponent },
            // { path: 'edit/:id', component: AddEditComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DmvRoutingModule { }