import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../services/event';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrls: ['./details.css']
})
export class EventDetailsComponent {
  selectedEvent: any | null = null;

  constructor(private eventService: EventService) {
    this.eventService.selectedEvent$.subscribe(event => {
      this.selectedEvent = event;
    });
  }
}
