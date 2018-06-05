import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';
import { FileType } from '../constants';

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  starredList;

  constructor(private fileService: FileService) { }
  
  ngOnInit() {
    this.starredList = this.fileService.starredFiles;    
  }

  getStarredItem(event){
    let starFile = this.starredList
      .find(file => file.id === event.target.id);
      
    if(starFile.fileType === FileType.folder){
      this.fileService.fetchFiles(starFile.path);
    }
    else{ // File
      this.fileService.fetchFiles(starFile.path, FileType.file);
      this.fileService.fetchFileData(starFile.path);
    }
  }

}
