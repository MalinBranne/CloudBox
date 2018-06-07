import { Injectable } from '@angular/core';
import Utils from './utils'

@Injectable()
export class AuthService {

  CLIENT_ID = 'nu8teo9p5a3op4l'; // APP_ID
  ACCESS_TOKEN: string;
  USER_ID: string;

  constructor() { }

  // Parses the url and gets the access token if it is in the urls hash
  getAccessTokenFromUrl() {
    return new Utils().parseQueryString(window.location.hash).access_token;
  }
  
  // Parses the url and gets the access token if it is in the urls hash
  getUIDFromUrl() {
    return new Utils().parseQueryString(window.location.hash).uid;
  }

  // If the user was just redirected from authenticating, the urls hash will
  // contain the access token.
  isAuthenticated() {
    if (localStorage.getItem("accessToken") && localStorage.getItem("uid")) {
      this.ACCESS_TOKEN = localStorage.getItem("accessToken");
      this.USER_ID = localStorage.getItem("uid");
      return true;
    }
    else if (this.getAccessTokenFromUrl()) {
      this.ACCESS_TOKEN  = this.getAccessTokenFromUrl();
      localStorage.setItem("accessToken", this.ACCESS_TOKEN );

      this.USER_ID = this.getUIDFromUrl();
      localStorage.setItem("uid", this.USER_ID);

      return true;
    }

    return false;
  }

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("uid");
    this.ACCESS_TOKEN = null;
  }

}
