import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
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


  http: HttpClient;

  constructor(private authService: AuthService, private fileService: FileService) { }

  // token = this.authService.ACCESS_TOKEN;
  // // authenticated = this.authService.isAuthenticated(); //?


  result = [];
  matches;

  getFiles(): Observable<SearchState> {
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
          console.log(match.metadata); //testing search result
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
          }

          )


          // this.result = match.metadata.name,
          // this.searchState.latestSearch.push(this.result),
          // console.log(this.result));
        })

        this.result = this.searchState.latestSearch;
        console.log(this.result);
        this.updateSubscribers();

      })


    //   .then(response => {
    //     let show = document.getElementById("results");

    //     response.matches.forEach(match => {
    //       // console.log(match.metadata.name);
    //       return (this.result = match.metadata.name,
    //         show.innerHTML += `<p>${this.result}</p>`,
    //         console.log(this.result))
    //     })

    //     this.matches = response; // flytta detta till search.component

    // gör en searchList i searchService som finns i state och dela den med main och sidebar. 
    // i main.component, subscriba på searchList på samma sätt som fileService (byt ut mot searchService). // kolla hur vi gör en observable i fileService som dom andra komponentena kan prenumerera på






    // this.latestSearch.push(this.result)
    // console.log(this.result),
    //   console.log(this.latestSearch)

    return observable;
  }

  updateSubscribers() {
    console.log("Updating: ");
    console.log(this.searchState);
    this.subject.next(this.searchState);
  }
}
