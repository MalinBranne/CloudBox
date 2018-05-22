import { Injectable } from '@angular/core';
import Utils from './utils'

@Injectable()
export class AuthService {

  CLIENT_ID = 'nu8teo9p5a3op4l'; // APP_ID
  USER_ID: string;

  constructor() { }

  // Parses the url and gets the access token if it is in the urls hash
  getAccessTokenFromUrl() {
    return new Utils().parseQueryString(window.location.hash).access_token;
  }

  // If the user was just redirected from authenticating, the urls hash will
  // contain the access token.
  isAuthenticated() {
    if(localStorage.getItem("accessToken")){
      this.USER_ID = localStorage.getItem("accessToken");
      return true;
    }
    else if(this.getAccessTokenFromUrl()){
      let accessToken = this.getAccessTokenFromUrl();
      localStorage.setItem("accessToken", accessToken);
      this.USER_ID = accessToken;
      return true;
    }

    return false;
  }

  logout() {
    localStorage.removeItem("accessToken");
    this.USER_ID = null;
  }

}
