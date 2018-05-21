import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

// require('isomorphic-fetch'); // or another library of choice.


@Component({
  selector: 'auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  constructor(private authService: AuthService) { }

  login() {

    this.authService.auth();

  }

  ngOnInit() {



    // let CLIENT_ID = 'nu8teo9p5a3op4l'; // Our app key from dropbox https://www.dropbox.com/developers/apps/info/nu8teo9p5a3op4l

    // var dbx = new Dropbox({ accessToken: 'Uuyc1vyWkaAAAAAAAAAAB_B40vIY09xiadCd3X2rmcggUjvYj4PU2Qvilkxd6pEdE' }); //our  access-token generated from our app dropbox-page

    // dbx.usersGetCurrentAccount()
    //   .then(function (response) {
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     console.error(error);
    //   });

    // var dbx = new Dropbox({ accessToken: 'Uuyc1vyWkaAAAAAAAAAAB_B40vIY09xiadCd3X2rmcggUjvYj4PU2Qvilkxd6pEdE' }); //our  access-token generated from our app dropbox-page
    // dbx.filesListFolder({ path: '' })
    //   .then(function (response) {
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });
  }

}
