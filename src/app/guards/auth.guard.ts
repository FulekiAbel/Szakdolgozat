import { Injectable } from '@angular/core';
import {CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return new Observable(subscriber => {
      onAuthStateChanged(this.auth, user => {
        if (user) {
          subscriber.next(true);
        } else {
          subscriber.next(this.router.parseUrl('/login'));
        }
        subscriber.complete();
      });
    });
  }
}
