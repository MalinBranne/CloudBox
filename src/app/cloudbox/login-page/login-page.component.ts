import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  authUrl;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authUrl = this.authService.getAuthUrl();
  }

}
