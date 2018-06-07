import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { IFile, FileType, FileState, SearchState } from './constants';
import { AuthService } from './auth.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import { BehaviorSubject } from 'rxjs';
import { FileService } from './file.service';
let Dropbox = require('dropbox').Dropbox;


@Injectable()
export class SearchService {

  //state
  searchState: SearchState = {
    latestSearch: [],
  }
  subject = new BehaviorSubject(this.searchState);

  constructor(private authService: AuthService, private fileService: FileService) { }

  getState(): Observable<SearchState> {
    return this.subject.asObservable();
  }

  search(query) {
    if (!query) {
      return Observable.of([]);
    }

    // this.searchState.latestSearch = []; // empty old list if any
    let observable = this.fileService.dbx.filesSearch({
      "path": "", //searching root folder
      "query": query,
      "start": 0,
      "max_results": 10,
      "mode": "filename"
    })
      .then(response => {

        this.searchState.latestSearch = response.matches.map(match => {
          //map over result and create new IFile-files fro each entry tht is saved in latestSearch-list

          let fileType: string = match.metadata[".tag"]; // Finding out if search result object is a File or Folder
          return ({
            id: match.metadata.id,
            fileType: match.metadata[".tag"],
            name: match.metadata.name,
            path: match.metadata.path_display,
            modified: match.metadata.client_modified,
            size: match.metadata.size,
            starred: this.fileService.starredFiles.find(id => match.metadata.id === id) ? true : false,
            iconPath: this.fileService.getIconPath(match.metadata.name, fileType)
          });
        });

        this.updateSubscribers();
      });

    return observable;
  }

  updateSubscribers() {
    console.log(this.searchState);
    this.subject.next(this.searchState);
  }
}
