import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { IFile, FileType, FileState } from './constants';

let Dropbox = require('dropbox').Dropbox;
import 'rxjs/add/operator/map';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class FileService {

  fileState: FileState = {
    paths: {},
    currentPath: "",
    
  };
  subject = new BehaviorSubject(this.fileState);

  starredFiles = [];

  dbx = new Dropbox({ clientId: this.authService.CLIENT_ID, accessToken: this.authService.USER_ID });

  constructor(private authService: AuthService) { 
    if(!localStorage.getItem("starredFiles" + this.authService.USER_ID)){
      localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
    }
    this.starredFiles = JSON.parse(localStorage.getItem("starredFiles" + this.authService.USER_ID));
  }

  getFiles(): Observable<FileState>{
      return this.subject.asObservable();
  }

  fetchFiles(path = ""){
    if(this.fileState.paths[path]){
      this.fileState.currentPath = path;
      this.updateSubscribers();
    }
    else{
      // Set the login anchors href using dbx.getAuthenticationUrl()
      this.dbx.filesListFolder({ path })
        .then(response => response.entries)
        .then(files => {
          console.log(files);
          this.fileState.currentPath = path;
          this.fileState.paths[path] = files.map(file => ({
              id: file.id,
              fileType: FileType[file[".tag"] as FileType],
              name: file.name,
              path: file.path_display,
              modified: file.client_modified,
              size: file.size,
              starred: this.starredFiles.find(id => file.id === id)
            }
          ))
          console.log(this.fileState);
          this.updateSubscribers();
        });
    }
  }

  uploadFile(){

  }
 
  downloadFile(id: string){
    let currentFile = this.getFileFromId(id);
    this.dbx.filesGetTemporaryLink({path: currentFile["path"]})
    .then(
      response => response.link)
      .then(link => {
        console.log(link);
        const a = document.createElement('a');
        a.setAttribute('href', link);
        a.setAttribute('download', currentFile.name);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
  }

  getFileFromId(id){
    let currentFile = this.fileState.paths[this.fileState.currentPath]
      .find(file => file.id === id);
    return currentFile;
  }

  toggleStar(fileId){
    let currentFile = this.getFileFromId(fileId);
    currentFile.starred = !currentFile.starred;

    if (currentFile.starred){
      this.starredFiles.push(fileId);
    } else {
      let index = this.starredFiles.indexOf(fileId);
      this.starredFiles.splice(index,1);
    }
    localStorage.setItem("starredFiles" + this.authService.USER_ID, JSON.stringify(this.starredFiles));
    console.log(localStorage.getItem("starredFiles" + this.authService.USER_ID));
  }

  updateSubscribers(){
    this.subject.next(this.fileState);
  }

}
