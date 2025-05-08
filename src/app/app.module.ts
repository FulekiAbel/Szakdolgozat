import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { Firestore, getFirestore, provideFirestore } from '@angular/fire/firestore';
import {AngularFireModule} from '@angular/fire/compat'
import { environments } from './environments/environments';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";

import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { DemoNgZorroAntdModule } from './DemoNgZorroAntdModule';
import { KiadasComponent } from './components/kiadas/kiadas.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BevetelComponent } from './components/bevetel/bevetel.component';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { ArfolyamComponent } from './components/arfolyam/arfolyam.component';
import { GolokComponent } from './components/golok/golok.component';

import { CommonModule } from '@angular/common'


registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    KiadasComponent,
    BevetelComponent,
    ArfolyamComponent,
    GolokComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environments.firebase),
    
    FormsModule,
    DemoNgZorroAntdModule,
    ReactiveFormsModule,
    NzCardComponent,
    CommonModule,
    HttpClientModule
  ],
  providers: [
    provideFirebaseApp(() => initializeApp({"projectId":"szakdolgozat-eccd8","appId":"1:1034665170335:web:96202b2deaaa107dd4d9aa","storageBucket":"szakdolgozat-eccd8.firebasestorage.app","apiKey":"AIzaSyBG7G2St70nGuSKSnlT4MO9iOg1gyMTs5w","authDomain":"szakdolgozat-eccd8.firebaseapp.com","messagingSenderId":"1034665170335"})),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnimationsAsync(),
    { provide: NZ_I18N, useValue: en_US },
    provideHttpClient()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
