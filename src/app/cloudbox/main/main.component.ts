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
  fileList: IFile[];
  currentPath: string;
  error;
  selectedFile: string;

  // Is needed so that FileType enum is recognized
  FileType = FileType;

  constructor(private fileService: FileService) { }

  ngOnInit() {


    this.subscription = this.fileService.getState()
      .subscribe(fileState => {
        this.fileService.fileState.error = null; // test, wanna make sure there is no error in state on init, but if I make a new folder and then delete it disapears when clicking
        this.fileList = fileState.paths[fileState.currentPath];
        this.currentPath = fileState.currentPath;
        this.error = fileState.error;
        this.selectedFile = fileState.selectedFile;
      });
    this.fileService.fetchFiles();

  }

  fileAction(event) {
    let fileId = event.path[1].id;
    let file = this.fileService.getFileFromId(fileId);
    console.log(event);
    console.log(fileId);
    console.log(file);
    if (file.fileType === FileType.folder) {
      this.fileService.fetchFiles(file.path);
    }
    else { // File type is file
      this.fileService.setSelectedFile(fileId);
      this.fileService.fetchFileData(file.path);
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

  backToParentFolder() {
    const pos = this.currentPath.lastIndexOf("/");
    const parentPath = this.currentPath.substring(0, pos);
    this.fileService.fetchFiles(parentPath);
  }

  backToHome() {
    this.fileService.fetchFiles();
  }

}
