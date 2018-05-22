import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent  {

  constructor() { }

  @Output() logoutCallback = new EventEmitter();

  logout(){
    this.logoutCallback.emit();
  }

}
