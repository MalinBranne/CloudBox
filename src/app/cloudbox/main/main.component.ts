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
  FileType = FileType;

  constructor(private fileService: FileService) { }

  ngOnInit() {
    this.subscription = this.fileService.getState()
      .subscribe(fileState => {
        //här ska vi lägga in felhantering
        // if(det vi får tillbaka är en lista gör detta:)
        this.fileList = fileState.paths[fileState.currentPath];
        //Else: gör detta (error)
      });
    this.fileService.fetchFiles();
  }

  fileAction(event){
    let fileId = event.path[1].id;
    let file = this.fileService.getFileFromId(fileId);
    if(file.fileType === FileType.folder){
      this.fileService.fetchFiles(file.path);
    }
    else { // File type is file
      this.fileService.fetchFileData(file.path);
    }
  }

  toggleStar(event){
    this.fileService.toggleStar(event.path[2].id);
  }

  downloadFile(event) {
    let id = event.path[2].id;
    this.fileService.downloadFile(id);
  }

  handleFileUpload(files: FileList){
    this.fileService.uploadFile(files.item(0));
  }

}
