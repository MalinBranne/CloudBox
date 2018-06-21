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

  // Subscriptions 
  subscription;
  fileList: IFile[];
  currentPath: string;
  error;
  selectedFile: string;

  // Locals
  deletingFile: IFile;

  // Is needed so that FileType enum is recognized
  FileType = FileType;

  constructor(private fileService: FileService) { }

  ngOnInit() {


    this.subscription = this.fileService.getState()
      .subscribe(fileState => {
        this.fileList = fileState.paths[fileState.currentPath];
        this.currentPath = fileState.currentPath;
        this.error = fileState.error;
        this.selectedFile = fileState.selectedFile;
      });
    this.fileService.fetchFiles();

  }

  fileAction(event) {
    let fileId = this.fileService.getFileIdByParentFromEvent(event);
    let file = this.fileList.find(file => file.id === fileId);

    if (file.fileType === FileType.folder) {
      this.fileService.fetchFiles(file.path);
    }
    else { // File type is file
      this.fileService.setSelectedFile(fileId);
      this.fileService.fetchFileData(file.path);
    }
  }

  toggleStar(event) {
    let fileId = this.fileService.getFileIdByParentFromEvent(event);
    let file = this.fileList.find(file => file.id === fileId);

    this.fileService.toggleStar(file);
  }

  notifyDeleteFile(event){
    let fileId = this.fileService.getFileIdByParentFromEvent(event);
    this.deletingFile = this.fileList.find(file => file.id === fileId);
    console.log(this.deletingFile);
  }

  cancelDeleteFile(){
    this.deletingFile = null;
  }

  deleteFile() {
    this.fileService.deleteFile(this.deletingFile);
    this.deletingFile = null;
  }

  downloadFile(event) {
    let fileId = this.fileService.getFileIdByParentFromEvent(event);
    let file = this.fileList.find(file => file.id === fileId);

    this.fileService.downloadFile(file);
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

  getFileTypeAsString(file: IFile){
    if(file.fileType == FileType.file)
      return "file";
    else
      return "folder";
  }

}
