import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://calendar-api-vpl7.onrender.com';

  //constructor(private http: HttpClient) {}

   // get cookie helper
  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  getCsrfCookie(): Promise<void> {
    return fetch(`${this.apiUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include'
    }).then(() => {});
  }

  // Login
  login(email: string, password: string): Promise<any> {
    return this.getCsrfCookie().then(() => {
      const token = this.getCookie('XSRF-TOKEN') || '';
      return fetch(`${this.apiUrl}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': token
        },
        body: JSON.stringify({ email, password })
      }).then(res => res.json());
    });
  }

  // Fetch authenticated user
  getUser(): Promise<any> {
    return fetch(`${this.apiUrl}/api/user`, {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json());
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

  
}
