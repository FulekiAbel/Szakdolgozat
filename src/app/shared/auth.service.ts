import { Injectable } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {CanActivate, CanActivateFn, Router} from "@angular/router";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private fireauth : AngularFireAuth, private router: Router) { }

  login(email : string, password : string){
    this.fireauth.signInWithEmailAndPassword(email,password).then( () =>{
        localStorage.setItem('token','true');
        this.router.navigate(['/dashboard'])
    },err => {
      alert(err.message);
      this.router.navigate(['/login'])
      })
  }

  register(email: string, password : string){
    this.fireauth.createUserWithEmailAndPassword(email,password).then( () =>{
      this.router.navigate(['/login'])
      alert('Sikeres regisztráció')
    },err =>{
        alert(err.message);
        this.router.navigate(['/register'])
    })
  }

  logout(){
    this.fireauth.signOut().then( () =>{
      localStorage.removeItem('token');
      this.router.navigate(['/login'])
    }, err =>{
      alert(err.message);
    })
  }


  canActivate(): Observable<boolean> {
    return this.fireauth.authState.pipe(
      map(user => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login']); 
          return false;
        }
      })
    );
  }


}
