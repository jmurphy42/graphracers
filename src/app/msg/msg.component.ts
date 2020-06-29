import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-msg',
  template: `
    <div #msgBack id="msgBack" [ngClass]="{dismissed: message.length === 0}">
        <div #msgDiv id="msgDiv" [ngClass]="{dismissed: message.length === 0}">
            <p *ngFor="let m of message" [innerHTML]="m"></p>
        </div>
    </div>
  `,
  styles: [
  ]
})
export class MsgComponent implements OnInit {

  constructor() { }

  @ViewChild('msgDiv', { static: true })
  msgDiv: ElementRef<HTMLDivElement>;
  @ViewChild('msgBack', { static: true })
  msgBack: ElementRef<HTMLDivElement>;
  @Input()
  message: string[] = [];

  @Output() dismissMessageEvent = new EventEmitter<void>()

  ngOnInit(): void {
    this.msgDiv.nativeElement.onmouseup = this.handleMouseClick.bind(this);
    this.msgBack.nativeElement.onmouseup = this.handleMouseClick.bind(this);
  }

  private handleMouseClick(event) {
    this.dismissMessageEvent.emit();
  }
}
