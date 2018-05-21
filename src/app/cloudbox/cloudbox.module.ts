import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './auth/auth.component';
import { MainComponent } from './main/main.component';
import { SearchComponent } from './search/search.component';
import { DownloadComponent } from './download/download.component';
import { StarredComponent } from './starred/starred.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [MainComponent, AuthComponent],
  declarations: [AuthComponent, MainComponent, SearchComponent, DownloadComponent, StarredComponent]
})
export class CloudboxModule { }
