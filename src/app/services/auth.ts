import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://calendar-api-vpl7.onrender.com';

  constructor(private http: HttpClient) {}

  // Get CSRF cookie
  getCsrfCookie() {
    return this.http.get(`${this.apiUrl}/sanctum/csrf-cookie`, { withCredentials: true });
  }

  // Login
  login(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/api/login`, { email, password }, { withCredentials: true });
  }

  // Fetch authenticated user
  getUser() {
    return this.http.get(`${this.apiUrl}/api/user`, { withCredentials: true });
  }
}


  



  /*
  login(credentials: any) {
  return this.http.post(`${this.apiUrl}/api/login`, credentials)
    .pipe(
      catchError((error) => {
        console.error('Login API error:', error);
        return throwError(() => error);
      })
    );
}*/


  /*
  login(data: { email: string; password: string }) {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/login`, data)
    );
  }
  */

  

