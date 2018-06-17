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
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  results;
  currentSearch;
  queryStream = new Subject<string>();
  subscription;
  currentFile;
  starredList;

  constructor(private fileService: FileService, private searchService: SearchService) { }

  ngOnInit() {
    this.starredList = this.fileService.starredFiles;

    this.subscription = this.searchService.getState()
      .subscribe(searchState => {
        // this.results = this.searchService.result;
        this.currentSearch = searchState.latestSearch;
      });

    this.queryStream
      .debounceTime(400)
      .distinctUntilChanged()
      .switchMap(query => this.searchService.search(query))
      .subscribe(results => this.results = results);
  }

  getStarredItem(event) {
    let starFile = this.starredList
      .find(file => file.id === event.target.id);

    if (starFile.fileType === FileType.folder) {
      this.fileService.fetchFiles(starFile.path);
    }
    else { // File
      this.fileService.fetchFiles(starFile.path, FileType.file);
      this.fileService.setSelectedFile(starFile.id);
      this.fileService.fetchFileData(starFile.path);
    }
  }

  toggleStar(event){
    let fileId = this.fileService.getFileIdByParentFromEvent(event);
    let file = this.starredList.find(file => file.id === fileId);

    this.fileService.toggleStar(file)
  }

  setQuery(query) {
    this.queryStream.next(query);
  }


  search(query) {
    this.searchService.search(query)
      .subscribe(results => this.results = results);
  }

  getFileFromId(id) {
    this.currentFile = this.currentSearch
      .find(file => file.id === id);
    return this.currentFile;
  }

  fileAction(event) {
    let fileId = event.path[0].id;
    let file = this.getFileFromId(fileId);

    let path = this.currentFile.path;
    if (file.fileType === FileType.folder) {
      this.fileService.fetchFiles(path);
    }
    else { // File
      let pos = path.lastIndexOf("/");
      let folderPath = path.substring(0, pos);
      this.fileService.fetchFiles(folderPath);
      this.fileService.setSelectedFile(fileId);
      this.fileService.fetchFileData(path);
    }

  }

}












