import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ams-card',
  templateUrl: './ams-card.component.html',
  styleUrls: ['./ams-card.component.css']
})
export class AmsCardComponent {
  @Input() color: string = '#0069aa';
  @Input() name: string = '';
  @Input() sourceId: string = '';
  @Input() selected: boolean = false;

  @Output() select = new EventEmitter<string>();

  onClick(): void {
    this.select.emit(this.sourceId);
  }
}
