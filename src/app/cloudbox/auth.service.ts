import { Injectable } from '@angular/core';
import Utils from './utils'
// import { Dropbox } from 'Dropbox';
let Dropbox = require('dropbox').Dropbox;

@Injectable()
export class AuthService {

  constructor() { }
  CLIENT_ID = 'nu8teo9p5a3op4l'; // APP_ID
  USER_ID = 'Uuyc1vyWkaAAAAAAAAAAB_B40vIY09xiadCd3X2rmcggUjvYj4PU2Qvilkxd6pEd';

  // Parses the url and gets the access token if it is in the urls hash
  getAccessTokenFromUrl() {
    console.log("hej");
    return new Utils().parseQueryString(window.location.hash).access_token;
  }

  // If the user was just redirected from authenticating, the urls hash will
  // contain the access token.
  isAuthenticated() {
    return !!this.getAccessTokenFromUrl();
  }

  // Render a list of items to #files
  renderItems(items) {
    var filesContainer = document.getElementById('files');
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.innerHTML = item.name;
      filesContainer.appendChild(li);
    });
  }

  // This example keeps both the authenticate and non-authenticated setions
  // in the DOM and uses this function to show/hide the correct section.


  auth() {

    console.log("Nu kör vi");

    if (this.isAuthenticated()) {

      // Create an instance of Dropbox with the access token and use it to
      // fetch and render the files in the users root directory.
      var dbx = new Dropbox({ accessToken: this.getAccessTokenFromUrl() });
      dbx.filesListFolder({ path: '' })
        .then(function (response) {
          this.renderItems(response.entries);
        })
        .catch(function (error) {
          console.error(error);
        });
    } else {


      // Set the login anchors href using dbx.getAuthenticationUrl()
      var dbx = new Dropbox({ clientId: this.CLIENT_ID, accessToken: this.USER_ID });
      var authUrl = dbx.getAuthenticationUrl('http://localhost:4200/auth')
      dbx.filesListFolder({ path: '' })
        .then(response => {
          console.log(response.entries);
          console.log(authUrl);
          //window.location.href = authUrl;
          this.USER_ID = this.getAccessTokenFromUrl();
        }
        )


    }
  }

  logout() {

  }

}
