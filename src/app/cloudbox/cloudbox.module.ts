import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './auth/auth.component';
import { MainComponent } from './main/main.component';
import { SearchComponent } from './search/search.component';
import { DownloadComponent } from './download/download.component';
import { StarredComponent } from './starred/starred.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { MainPageComponent } from './main-page/main-page.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { PreviewComponent } from './preview/preview.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [MainComponent, AuthComponent],
  declarations: [AuthComponent, MainComponent, SearchComponent, DownloadComponent, StarredComponent, LoginPageComponent, MainPageComponent, BreadcrumbComponent, SidebarComponent, PreviewComponent]
})
export class CloudboxModule { }
