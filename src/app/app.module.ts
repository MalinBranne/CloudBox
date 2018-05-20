import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

// ...
// Import example module(s) to run.

// import { CounterModule as RunModule } from './counter/counter.module';
// import { MessagingModule as RunModule } from './messaging/messaging.module';
// import { NgformsModule as RunModule } from './ngforms/ngforms.module';
// import { TodoModule as RunModule } from './todo/todo.module';
//import { PipesModule as RunModule } from './pipes/pipes.module';
//import { RoutesModule as RunModule } from './routes/routes.module';
import { CloudboxModule as RunModule } from './cloudbox/cloudbox.module';


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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
