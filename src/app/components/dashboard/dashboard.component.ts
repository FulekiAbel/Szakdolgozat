import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {AuthService} from "../../shared/auth.service";
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit{

  ngOnInit(): void {
    
  }
  constructor(private authService : AuthService){

  }


  logout(){
    this.authService.logout();
  }
  

}
