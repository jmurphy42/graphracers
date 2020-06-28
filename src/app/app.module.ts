import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TrackComponent } from './track/track.component';
import { MsgComponent } from './msg/msg.component';

@NgModule({
  declarations: [
    AppComponent,
    TrackComponent,
    MsgComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
