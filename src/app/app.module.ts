import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { CloudboxModule as RunModule } from './cloudbox/cloudbox.module';
import { AuthService } from './cloudbox/auth.service';
import { FileService } from './cloudbox/file.service';
import { SearchService } from './cloudbox/search.service';


// ...

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RunModule
  ],
  exports: [
    RunModule
  ],
  providers: [AuthService, FileService, SearchService],
  bootstrap: [AppComponent]
})
export class AppModule { }
