import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'https://calendar-api-vpl7.onrender.com'; 

  constructor(private http: HttpClient, private api: ApiService) {}

  base(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/`);
  }

  ping(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/ping`);
  }

  
  ngOnInit() {
    this.api.ping().subscribe({
      next: (res) => console.log('API OK:', res),
      error: (err) => console.error('API ERROR:', err)
    });
    this.api.base().subscribe({
      next: (res) => console.log('Base API Response:', res),
      error: (err) => console.error('Base API ERROR:', err)
    });
  }

  
    

}
