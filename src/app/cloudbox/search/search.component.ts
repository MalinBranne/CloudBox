import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { SearchService } from '../search.service';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import { HttpBackend } from '@angular/common/http/src/backend';
import { HttpClient } from 'selenium-webdriver/http';
import { IFile, FileType, SearchState } from '../constants';
import { FileService } from '../file.service';


@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  results;
  currentSearch;
  queryStream = new Subject<string>();
  subscription;
  currentFile;

  constructor(private searchService: SearchService, private fileService: FileService) { }

  ngOnInit() {



    this.subscription = this.searchService.getFiles()
      .subscribe(searchState => {
        //här ska vi lägga in felhantering
        // if(det vi får tillbaka är en lista gör detta:)

        // this.results = this.searchService.result;
        this.currentSearch = searchState.latestSearch;
        console.log(this.currentSearch);
        //Else: gör detta (error)
      });

    this.queryStream
      .debounceTime(400)
      .distinctUntilChanged()
      .switchMap(query => this.searchService.search(query))
      .subscribe(results => this.results = results);
  }

  setQuery(query) {
    this.queryStream.next(query);
  }


  search(query) {
    this.searchService.search(query)
      .subscribe(results => this.results = results);

  }

  getFileFromId(id) {
    this.currentFile = this.searchService.searchState.latestSearch
      .find(file => file.id === id);
    console.log('hey');
    console.log(this.currentFile);
    return this.currentFile;
  }

  fileAction(event) {

    console.log(event);
    let fileId = event.path[0].id;
    let file = this.getFileFromId(fileId);

    let path = this.currentFile.path;
    console.log(file.fileType);
    if (file.fileType === "folder") {

      this.fileService.fetchFiles(path);

    }
    else {
      let pos = path.lastIndexOf("/");
      let folderPath = path.substring(0, pos);
      console.log(folderPath);
      this.fileService.fetchFiles(folderPath);
    }

  }
}
