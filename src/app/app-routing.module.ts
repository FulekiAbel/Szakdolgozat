import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { AppComponent } from './app.component';
import { KiadasComponent } from './components/kiadas/kiadas.component';
import { BevetelComponent } from './components/bevetel/bevetel.component';
import { ArfolyamComponent } from './components/arfolyam/arfolyam.component';
import { GolokComponent } from './components/golok/golok.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'kiadas', component: KiadasComponent, canActivate: [AuthGuard] },
  { path: 'bevetel', component: BevetelComponent, canActivate: [AuthGuard] },
  { path: 'arfolyam', component: ArfolyamComponent, canActivate: [AuthGuard] },
  { path: 'golok', component: GolokComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
