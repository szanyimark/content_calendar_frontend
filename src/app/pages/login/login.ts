import { Component } from '@angular/core';

import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [ReactiveFormsModule, NzButtonModule, NzInputModule, NzFormModule, NzCheckboxModule],
})

export class Login {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService,) {
    this.loginForm = fb.group({
      username: fb.control('admin@example.com', [Validators.required, Validators.email]),
      password: fb.control('password', [Validators.required, Validators.minLength(6)]),
      remember: [false]
    });
  }


  submitForm() {
    const credentials = {
      email: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    // Use Sanctum csrf-cookie endpoint to establish session cookies,
    // then read the XSRF-TOKEN cookie from the browser, decode it and send it in the header.
    this.auth.getCsrfCookie().subscribe({
      next: () => {
        try {
          const raw = getCookieValue('XSRF-TOKEN');
          if (!raw) throw new Error('XSRF-TOKEN cookie not found');
          let token = raw;
          try { token = decodeURIComponent(raw); } catch {}

          // Try to parse JSON wrapper like {iv, value, mac}
          try {
            if (token.startsWith('{')) {
              const obj = JSON.parse(token);
              if (obj && typeof obj.value === 'string') token = obj.value;
            }
          } catch {}

          // If looks like base64, try to decode
          try {
            const b = token.replace(/\s+/g, '');
            if (/^[A-Za-z0-9+/=]+$/.test(b)) {
              try { token = atob(b); } catch {}
            }
          } catch {}

          this.auth.loginWithToken(credentials.email, credentials.password, token).subscribe({
            next: (resp: any) => {
              console.log('Login success:', resp);
              this.router.navigate(['/main']);
            },
            error: (err: any) => {
              console.error('Login failed:', err);
            }
          });
        } catch (e) {
          console.error('Failed to decode XSRF cookie:', e);
        }
      },
      error: (err: any) => {
        console.error('Failed to fetch CSRF cookie:', err);
      }
    });
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const pairs = document.cookie ? document.cookie.split('; ') : [];
  for (const p of pairs) {
    const idx = p.indexOf('=');
    const key = idx > -1 ? p.substr(0, idx) : p;
    const val = idx > -1 ? p.substr(idx + 1) : '';
    if (key === name) return val;
  }
  return null;
}





