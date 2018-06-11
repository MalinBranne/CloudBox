import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';

@Component({
  selector: 'logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private fileService: FileService) { }

  ngOnInit() {
  }

  logout(){
    this.fileService.logout();
    window.location.href = `https://${window.location.host}`;
  }

}
