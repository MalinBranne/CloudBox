import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';

@Component({
  selector: 'breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {

  subscription;
  breadCrumbs;

  constructor(private fileService: FileService) { }

  ngOnInit() {
    this.subscription = this.fileService.getState()
      .subscribe(fileState => {
        let currentPath = fileState.currentPath;
        this.breadCrumbs = currentPath.split("/");
        this.breadCrumbs.shift();
      });
  }

  changeFolder(event){
    let path = "";
    for(let i = 0; i <= event.target.id; i++){
      path += `/${this.breadCrumbs[i]}`;
    }
    this.fileService.fetchFiles(path);
  }

}
