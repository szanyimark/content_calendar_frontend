import { Component, EventEmitter, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    FormsModule,
    NzModalModule,
    NzInputModule,
    NzDatePickerModule,
    NzSelectModule
],
  templateUrl: './create-event.html',
    styleUrls: ['./create-event.css']
})
export class CreateEventComponent {
  isVisible = false;

  @Output() eventCreated = new EventEmitter<any>();

  newEvent = {
    type: '',
    title: '',
    description: '',
    date: null as Date | null,
    place: '',
    link: '',
    photo: '',
    graphics: [] as string[],
    text: [] as string[],
    posted: false
  };

  show() {
    this.isVisible = true;
  }

  handleOk() {
    this.eventCreated.emit(this.newEvent);
    this.isVisible = false;

    // Reset
    this.newEvent = {
      type: '',
      title: '',
      description: '',
      date: null,
      place: '',
      link: '',
      photo: '',
      graphics: [],
      text: [],
      posted: false
    };
  }

  handleCancel() {
    this.isVisible = false;
  }
}
