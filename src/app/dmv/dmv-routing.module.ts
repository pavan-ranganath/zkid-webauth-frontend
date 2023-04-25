import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { AddDmvUserComponent } from './add-dmv-user.component';


const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            // { path: '', component: ListComponent },
            { path: 'add', component: AddDmvUserComponent },
            // { path: 'edit/:id', component: AddEditComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DmvRoutingModule { }