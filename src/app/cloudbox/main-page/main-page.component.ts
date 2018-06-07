import { Component, OnInit } from '@angular/core';
import { SearchService } from '../search.service';

@Component({
  selector: 'main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent {

  constructor(private searchService: SearchService) { }

  ngOnInit() { }

}
