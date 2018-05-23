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
    currentPath: ""
  };
  subject = new BehaviorSubject(this.fileState);

  constructor(private authService: AuthService) { }

  getFiles(): Observable<FileState>{
      return this.subject.asObservable();
  }

  fetchFiles(path = ""){
    // Set the login anchors href using dbx.getAuthenticationUrl()
    var dbx = new Dropbox({ clientId: this.authService.CLIENT_ID, accessToken: this.authService.USER_ID });
    dbx.filesListFolder({ path })
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
            starred: false
          }
        ))
        console.log(this.fileState);
        this.updateSubscribers();
      });

  }

  uploadFile(){

  }

  downloadFile(){
    
  }

  updateSubscribers(){
    this.subject.next(this.fileState);
  }

}
