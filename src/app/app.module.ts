import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {AngularFireModule} from '@angular/fire/compat'
import { environments } from './environments/environments';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from "@angular/material/icon";
import {MatRadioModule} from '@angular/material/radio';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatButton} from "@angular/material/button";
import {MatInputModule} from '@angular/material/input';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environments.firebase),
    
    FormsModule,
    
    MatFormFieldModule,
    MatIconModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatButton,
    MatInputModule
  ],
  providers: [
    provideFirebaseApp(() => initializeApp({"projectId":"szakdolgozat-eccd8","appId":"1:1034665170335:web:96202b2deaaa107dd4d9aa","storageBucket":"szakdolgozat-eccd8.firebasestorage.app","apiKey":"AIzaSyBG7G2St70nGuSKSnlT4MO9iOg1gyMTs5w","authDomain":"szakdolgozat-eccd8.firebaseapp.com","messagingSenderId":"1034665170335"})),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
