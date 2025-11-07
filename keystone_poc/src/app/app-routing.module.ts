import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MaTuckInsComponent } from './ma-tuck-ins/ma-tuck-ins.component';

const routes: Routes = [
  { path: 'ma-tuck-ins', component: MaTuckInsComponent },
  // leave root path to show AppComponent's home content by default
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { bindToComponentInputs: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
