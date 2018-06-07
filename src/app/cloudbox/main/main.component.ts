import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';
import { IFile, FileType, SearchState } from '../constants';
import { SearchService } from '../search.service';

@Component({
  selector: 'main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  subscription;
  searchList: SearchState[];
  fileList: IFile[];
  FileType = FileType;
  error;

  constructor(private fileService: FileService, private searchService: SearchService) { }

  ngOnInit() {
    this.subscription = this.fileService.getFiles()
      .subscribe(fileState => {
        //här ska vi lägga in felhantering
        // if(det vi får tillbaka är en lista gör detta:)

        this.fileList = fileState.paths[fileState.currentPath];
        this.error = fileState.error;
        //Else: gör detta (error)
      });
    this.fileService.fetchFiles();

  }

  fileAction(event) {
    let fileId = event.path[1].id;
    let file = this.fileService.getFileFromId(fileId);
    if (file.fileType === FileType.folder) {
      this.fileService.fetchFiles(file.path);
    }
  }

  toggleStar(event) {
    this.fileService.toggleStar(event.path[2].id);
  }

  downloadFile(event) {
    let id = event.path[2].id;
    this.fileService.downloadFile(id);
  }

  handleFileUpload(files: FileList) {
    this.fileService.uploadFile(files.item(0));
  }

}
