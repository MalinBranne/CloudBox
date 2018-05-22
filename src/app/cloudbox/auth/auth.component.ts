import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  authenticated: boolean;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authenticated = this.authService.isAuthenticated();
  }

  logout(){
    this.authService.logout();
    window.location.href = "http://localhost:4200";
  }

}
