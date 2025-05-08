import { Component, OnInit } from '@angular/core';
import {AuthService} from "../../shared/auth.service";
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit{

  hide = true;
  email : string = '';
  password : string = '';

  ngOnInit():void {}

  constructor(private auth: AuthService, private router: Router) {  }

  login() {
    if (this.email == '') {
      alert('Add meg az emailt');
      return;
    }
    if (this.password == '') {
      alert('Add meg a jelszot');
      return;
    }
    this.auth.login(this.email,this.password);
    this.email = '';
    this.password = '';
  }

}
