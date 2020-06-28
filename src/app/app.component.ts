import { Component, ViewChild, ElementRef } from '@angular/core';
import { Logger } from './logger';


@Component({
  selector: 'app-root',
  template: `
  <div #main id="mainDiv">
    <app-track (messageEvent)="displayMessage($event)" id="appTrack"></app-track>
    <app-msg (dismissMessageEvent)="dismissMessage($event)" [ngClass]="{dismissed: message.length === 0}" [message]="message" id="appMsg"></app-msg>
  </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'Graph Racers';
  
  @ViewChild('main', { static: true })
  div: ElementRef<HTMLDivElement>;

  message: string[] = [];

  ngOnInit() {
    Logger.enable = true; // remove to disable console logging
    Logger.enableVerbose = true; // remove to disable verbose and debounce console logging
  }
  
  displayMessage($event) {
    Logger.log("MSG >> " + $event);
    this.message = $event
  }

  dismissMessage($event) {
    Logger.log("MSG >> <dismiss>");
    this.message = [];
  }
}