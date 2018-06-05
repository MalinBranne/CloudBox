import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BrowserModule } from '@angular/platform-browser';
import { FileService } from '../file.service';

@Component({
  selector: 'preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnInit {

  subscription;
  preview;

  constructor(private fileService: FileService) { }

  ngOnInit() {
    this.subscription = this.fileService.getState()
    .subscribe(fileState => {
      this.preview = fileState.preview;
    });
  }

}
