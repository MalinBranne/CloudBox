import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';
import { IFile, FileType } from '../constants';

@Component({
  selector: 'main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  subscription;
  fileList: IFile[];

  constructor(private fileService: FileService) { }

  ngOnInit() {
    this.subscription = this.fileService.getFiles()
      .subscribe(fileState => {
        this.fileList = fileState.paths[fileState.currentPath];
      });
    this.fileService.fetchFiles();
  }

  fileAction(event){
    let fileName = event.target.innerText;
    let file = this.fileList.find(file => fileName === file.name);
    console.log(file);
    if(file.fileType === FileType.folder){
      this.fileService.fetchFiles(file.path);
    }
    
  }

}
